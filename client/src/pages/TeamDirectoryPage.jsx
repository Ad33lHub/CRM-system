import React, { useMemo, useState } from 'react';
import { PageHeader } from '../components/ui/page-header.jsx';
import { Button } from '../components/ui/button.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Input } from '../components/ui/input.jsx';
import { Search, Mail, Phone, Users, Building2, UserCircle2 } from 'lucide-react';
import { useGetEmployeesQuery } from '../services/employeesApi.js';

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  developer: 'Developer',
  designer: 'Designer',
  qa_engineer: 'QA Engineer',
};

// Name / email / phone / avatar / role live on the populated `user` sub-document.
function getProfile(emp) {
  const u = emp.user || {};
  const firstName = u.firstName || '';
  const lastName = u.lastName || '';
  return {
    name: `${firstName} ${lastName}`.trim() || u.email || 'Unknown',
    initials: `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || '?',
    email: u.email || '',
    phone: u.phone || '',
    avatar: u.avatar || '',
    role: u.role || '',
  };
}

export default function TeamDirectoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');

  const { data, isLoading } = useGetEmployeesQuery();
  const employees = useMemo(() => data?.data || [], [data]);

  const departments = useMemo(
    () => ['all', ...new Set(employees.map((e) => e.department).filter(Boolean))],
    [employees]
  );

  const filteredEmployees = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return employees.filter((emp) => {
      const { name, email } = getProfile(emp);
      const searchMatch =
        !q ||
        name.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        (emp.designation || '').toLowerCase().includes(q) ||
        (emp.skills || []).some((skill) => skill.toLowerCase().includes(q));
      const deptMatch = selectedDept === 'all' || emp.department === selectedDept;
      return searchMatch && deptMatch;
    });
  }, [employees, searchTerm, selectedDept]);

  const hasFilters = searchTerm || selectedDept !== 'all';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader
          title="Team Directory"
          subtitle="Search and connect with specialists and team members across the workspace"
        />

        {!isLoading && (
          <div className="flex gap-3 shrink-0">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-center dark:border-slate-800 dark:bg-slate-900/50">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Staff
              </span>
              <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
                {employees.length}
              </span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-center dark:border-slate-800 dark:bg-slate-900/50">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Departments
              </span>
              <span className="flex items-center justify-center gap-1.5 text-xl font-extrabold text-blue-500">
                <Building2 className="h-4 w-4" />
                {Math.max(0, departments.length - 1)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Search & department filters */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, designation, or skill…"
            className="h-11 pl-10"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          {departments.map((dept) => {
            const isActive = selectedDept === dept;
            return (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow'
                    : 'border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {dept === 'all' ? 'All' : dept.replace('_', ' ')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results header */}
      {!isLoading && (
        <div className="flex items-center justify-between px-1 text-xs font-semibold text-slate-400">
          <span>
            Showing {filteredEmployees.length} of {employees.length} team members
          </span>
          {hasFilters && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDept('all');
              }}
              className="text-blue-500 hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>
      )}

      {/* Directory grid */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-400">Loading team directory…</div>
      ) : filteredEmployees.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900/50">
          <Users className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h4 className="font-bold text-slate-700 dark:text-slate-300">No team members found</h4>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">
            Try adjusting your search or department filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6">
          {filteredEmployees.map((emp) => {
            const { name, initials, email, phone, avatar, role } = getProfile(emp);
            const manager = emp.reportsTo
              ? `${emp.reportsTo.firstName || ''} ${emp.reportsTo.lastName || ''}`.trim()
              : '';
            return (
              <div
                key={emp.id || emp._id}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/5 dark:border-slate-800 dark:bg-slate-900/50"
              >
                {/* Accent banner */}
                <div className="h-12 w-full bg-gradient-to-r from-blue-500/15 to-indigo-500/15 dark:from-blue-600/20 dark:to-indigo-600/20" />

                {/* Avatar overlapping banner */}
                <div className="relative -mt-8 ml-5 h-16 w-16 shrink-0 overflow-hidden rounded-full border-4 border-white bg-slate-200 shadow dark:border-slate-900 dark:bg-slate-800">
                  {avatar ? (
                    <img src={avatar} alt={name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-base font-extrabold text-slate-600 dark:text-slate-100">
                      {initials}
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between p-5 pt-3">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-[15px] font-extrabold text-slate-800 transition-colors group-hover:text-blue-500 dark:text-slate-100">
                          {name}
                        </h3>
                        <p className="truncate text-xs font-semibold text-slate-400">
                          {emp.designation || 'Specialist'}
                        </p>
                      </div>
                      <Badge className="shrink-0 rounded-full border-none bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-500">
                        {(emp.department || 'general').replace('_', ' ')}
                      </Badge>
                    </div>

                    {/* Role + reporting line */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-400">
                      {role && (
                        <span className="flex items-center gap-1 capitalize">
                          <UserCircle2 className="h-3.5 w-3.5 text-slate-400" />
                          {ROLE_LABELS[role] || role.replace('_', ' ')}
                        </span>
                      )}
                      {manager && <span className="truncate">Reports to {manager}</span>}
                    </div>

                    {/* Contact */}
                    <div className="space-y-1.5 pt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                      {email && (
                        <a
                          href={`mailto:${email}`}
                          className="flex items-center gap-2 truncate transition-colors hover:text-slate-800 dark:hover:text-slate-100"
                        >
                          <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{email}</span>
                        </a>
                      )}
                      {phone && (
                        <a
                          href={`tel:${phone}`}
                          className="flex items-center gap-2 truncate transition-colors hover:text-slate-800 dark:hover:text-slate-100"
                        >
                          <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{phone}</span>
                        </a>
                      )}
                    </div>

                    {/* Skills */}
                    {emp.skills && emp.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {emp.skills.slice(0, 3).map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
                          >
                            {skill}
                          </span>
                        ))}
                        {emp.skills.length > 3 && (
                          <span className="self-center pl-1 text-[10px] font-bold text-slate-400">
                            +{emp.skills.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                    {email && (
                      <Button asChild variant="outline" size="sm" className="flex-1 gap-1.5">
                        <a href={`mailto:${email}`}>
                          <Mail className="h-3.5 w-3.5" /> Mail
                        </a>
                      </Button>
                    )}
                    {phone && (
                      <Button asChild variant="outline" size="sm" className="flex-1 gap-1.5">
                        <a href={`tel:${phone}`}>
                          <Phone className="h-3.5 w-3.5" /> Call
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
