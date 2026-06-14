import React, { useState } from 'react';
import { PageHeader } from '../components/ui/page-header.jsx';
import { Input } from '../components/ui/input.jsx';
import { Card, CardContent, CardHeader } from '../components/ui/card.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Search, Mail, Phone, Tag, Building2, User } from 'lucide-react';
import { useGetEmployeesQuery } from '../services/employeesApi.js';

export default function TeamDirectoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');

  const { data, isLoading } = useGetEmployeesQuery();
  const employees = data?.data || [];

  const departments = ['all', ...new Set(employees.map(e => e.department).filter(Boolean))];

  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
    const searchMatch =
      fullName.includes(searchTerm.toLowerCase()) ||
      (emp.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.designation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.skills || []).some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));

    const deptMatch = selectedDept === 'all' || emp.department === selectedDept;

    return searchMatch && deptMatch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Directory"
        subtitle="Search and connect with team members and specialists across the company"
      />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, skills, designation..."
            className="pl-10 h-10.5"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all ${
                selectedDept === dept
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80'
              }`}
            >
              {dept.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading directory...</div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border rounded-xl">
          <User className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h4 className="font-bold text-slate-700 dark:text-slate-300">No Team Members Found</h4>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or department filters to find matching profiles.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((emp) => (
            <Card
              key={emp.id || emp._id}
              className="hover:shadow-lg transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-sm"
            >
              <CardHeader className="flex flex-row items-center gap-4 pb-3">
                <div className="relative">
                  {emp.avatar ? (
                    <img
                      src={emp.avatar}
                      alt={emp.firstName}
                      className="h-14 w-14 rounded-full object-cover border border-slate-100 dark:border-slate-800"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                      {emp.firstName?.[0]}{emp.lastName?.[0]}
                    </div>
                  )}
                  {/* Status Indicator Dot */}
                  <span
                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${
                      emp.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                    title={emp.isOnline ? 'Online' : 'Offline'}
                  />
                </div>

                <div className="min-w-0">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate">
                    {emp.firstName} {emp.lastName}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium truncate">{emp.designation || 'Specialist'}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-blue-500 dark:text-blue-400">
                      {emp.department || 'General'}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2 text-xs border-t pt-3 border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <a href={`mailto:${emp.email}`} className="hover:underline truncate">{emp.email}</a>
                  </div>
                  {emp.phone && (
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{emp.phone}</span>
                    </div>
                  )}
                </div>

                {/* Skills tags */}
                {emp.skills && emp.skills.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                      <Tag className="h-3 w-3" />
                      <span>Skills & Core Expertise</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {emp.skills.map((skill, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-[10px] py-0 px-2 font-medium border border-transparent dark:border-slate-800"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
