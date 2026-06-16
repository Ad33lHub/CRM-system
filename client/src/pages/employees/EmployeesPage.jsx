import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/page-header.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Card, CardHeader, CardContent } from '../../components/ui/card.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Users, Plus, Mail, Building2, Shield, Calendar } from 'lucide-react';
import { useGetEmployeesQuery } from '../../services/employeesApi.js';
import useAuth from '../../hooks/useAuth.js';

export default function EmployeesPage() {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  // Queries
  const { data: employeesData, isLoading } = useGetEmployeesQuery();
  const employees = employeesData?.data || [];

  const departments = ['all', ...new Set(employees.map(e => e.department).filter(Boolean))];

  const filteredEmployees = employees.filter(emp => {
    // Name/email/role live on the populated `user` sub-document.
    const u = emp.user || {};
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const searchMatch = fullName.includes(searchTerm.toLowerCase()) ||
                        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (emp.designation || '').toLowerCase().includes(searchTerm.toLowerCase());
    const deptMatch = deptFilter === 'all' || emp.department === deptFilter;
    return searchMatch && deptMatch;
  });

  // Admins and hiring managers may register staff.
  const canCreate =
    ['super_admin', 'admin'].includes(role) ||
    (role === 'manager' && user?.managerType === 'hiring_manager');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Register"
        subtitle="Manage company staff profiles, security roles, and departments"
        actions={
          canCreate && (
            <Button onClick={() => navigate('/employees/new')} className="btn-primary-cta gap-2">
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          )
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-[#1a2332] p-4 rounded-xl border border-[#1e293b]">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, email, designation..."
          className="flex-1 h-10 bg-[#0f172a] border-[#334155] text-[#f8fafc]"
        />
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="rounded-md border border-[#334155] bg-[#0f172a] text-[#f8fafc] px-3 py-2 text-xs font-semibold focus:outline-none"
        >
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept === 'all' ? 'All Departments' : dept.charAt(0).toUpperCase() + dept.slice(1).replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading employees register...</div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-16 bg-[#1a2332] border border-[#1e293b] rounded-xl">
          <Users className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <h4 className="font-bold text-slate-300">No Employees Listed</h4>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or register a new staff account.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((emp) => (
            <Card
              key={emp.id || emp._id}
              onClick={() => navigate(`/employees/${emp.id || emp._id}`)}
              className="hover:shadow-md hover:border-blue-500/20 transition-all border cursor-pointer bg-[#1a2332] border-[#1e293b] rounded-xl"
            >
              <CardHeader className="flex flex-row items-center gap-4 pb-3 border-b border-[#1e293b]">
                {emp.user?.avatar ? (
                  <img src={emp.user.avatar} alt={emp.user?.firstName} className="h-12 w-12 rounded-full object-cover border border-[#1e293b]" />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-[#334155] text-[#f8fafc] flex items-center justify-center font-bold text-sm shrink-0">
                    {emp.user?.firstName?.[0]}{emp.user?.lastName?.[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-extrabold text-[#f8fafc] truncate">
                    {emp.user?.firstName} {emp.user?.lastName}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium truncate">{emp.designation || 'Specialist'}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-xs font-semibold text-slate-400 pt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-[#64748b] shrink-0" />
                    <span className="font-medium text-slate-300 truncate">{emp.user?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-[#64748b] shrink-0" />
                    <span className="capitalize text-slate-300">{emp.department?.replace('_', ' ') || 'General'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-[#64748b] shrink-0" />
                    <span className="capitalize text-blue-400">{emp.user?.role?.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-[#1e293b] pt-3 mt-2">
                  <Badge 
                    style={emp.isActive ? {
                      background: 'rgba(34, 197, 94, 0.12)',
                      color: '#4ade80'
                    } : {
                      background: 'rgba(148, 163, 184, 0.12)',
                      color: '#94a3b8'
                    }}
                    className="text-[9px] uppercase tracking-wide border-none px-2.5 py-0.5 rounded-full"
                  >
                    {emp.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Join: {emp.joinDate ? new Date(emp.joinDate).toLocaleDateString() : '--'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
