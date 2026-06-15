import React, { useState } from 'react';
import { PageHeader } from '../components/ui/page-header.jsx';
import { Button } from '../components/ui/button.jsx';
import { Card, CardContent } from '../components/ui/card.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Search, Mail, Phone, Users, User } from 'lucide-react';
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

  const onlineCount = employees.filter(e => e.isOnline).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Team Directory"
          subtitle="Search and connect with specialists and team members across the workspace"
        />
        
        {/* Stats Row */}
        {!isLoading && (
          <div className="flex gap-4 shrink-0">
            <div className="bg-[#1a2332] border border-[#1e293b] rounded-xl px-4 py-2 text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Total Staff</span>
              <span className="text-xl font-extrabold text-[#f8fafc]">{employees.length}</span>
            </div>
            <div className="bg-[#1a2332] border border-[#1e293b] rounded-xl px-4 py-2 text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Online Now</span>
              <span className="text-xl font-extrabold text-emerald-400 flex items-center justify-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                {onlineCount}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col lg:flex-row gap-4 bg-[#1a2332] p-4 rounded-xl border border-[#1e293b] items-stretch lg:items-center">
        <div className="relative flex-1">
          <Search 
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#64748b' }} 
            className="shrink-0"
          />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search team members by name, email, skills, department..."
            style={{
              width: '100%',
              borderRadius: '10px',
              border: '1px solid #334155',
              padding: '12px 16px 12px 44px',
              backgroundColor: '#0f172a',
              color: '#f8fafc',
              fontSize: '14px',
              outline: 'none',
              lineHeight: '1.5'
            }}
            className="focus:border-blue-500/50 transition-colors"
          />
        </div>
        
        {/* Department Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0 items-center scrollbar-none">
          {departments.map((dept) => {
            const isActive = selectedDept === dept;
            return (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                style={isActive ? {
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  border: 'none',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap'
                } : {
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  border: '1px solid #334155',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap'
                }}
                className="hover:text-slate-100 hover:border-slate-400 transition-all"
              >
                {dept.replace('_', ' ')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header */}
      {!isLoading && (
        <div className="flex justify-between items-center text-xs text-slate-400 font-semibold px-1">
          <span>Showing {filteredEmployees.length} of {employees.length} specialists</span>
          {searchTerm && (
            <button 
              onClick={() => { setSearchTerm(''); setSelectedDept('all'); }} 
              className="text-blue-400 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Employees Directory Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading team database...</div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-16 bg-[#1a2332] border border-[#1e293b] rounded-xl">
          <Users className="h-12 w-12 text-[#64748b] mx-auto mb-3" />
          <h4 className="font-bold text-slate-300">No Members Found</h4>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or department tags to display correct staff profiles.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-[24px]">
          {filteredEmployees.map((emp) => {
            const initials = `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`.toUpperCase();
            return (
              <div
                key={emp.id || emp._id}
                className="group relative overflow-hidden bg-[#1a2332] border border-[#1e293b] rounded-[16px] transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/5 flex flex-col h-full"
              >
                {/* Visual Top Accent Card Banner */}
                <div className="h-12 w-full bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-b border-[#1e293b]/50 group-hover:from-blue-600/30 group-hover:to-indigo-600/30 transition-colors" />

                {/* Avatar section overlapping banner */}
                <div className="-mt-8 ml-5 relative h-16 w-16 rounded-full border-4 border-[#1a2332] bg-slate-800 overflow-hidden shadow-md shrink-0">
                  {emp.avatar ? (
                    <img
                      src={emp.avatar}
                      alt={`${emp.firstName} ${emp.lastName}`}
                      className="object-cover h-full w-full"
                    />
                  ) : (
                    <div className="h-full w-full bg-[#334155] text-[#f8fafc] flex items-center justify-center font-extrabold text-base">
                      {initials}
                    </div>
                  )}
                  {/* Status indicator dot */}
                  <span
                    className={`absolute bottom-0 right-0 h-4.5 w-4.5 rounded-full border-3 border-[#1a2332] ${
                      emp.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    }`}
                    title={emp.isOnline ? 'Online' : 'Offline'}
                  />
                </div>

                {/* Main Card Content */}
                <div className="p-5 pt-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-[#f8fafc] text-[15px] group-hover:text-blue-400 transition-colors truncate">
                          {emp.firstName} {emp.lastName}
                        </h3>
                        <p className="text-xs text-slate-400 font-semibold truncate">{emp.designation || 'Specialist'}</p>
                      </div>
                      <Badge className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/15 border-none text-[10px] font-bold tracking-wider uppercase shrink-0 py-0.5 px-2.5 rounded-full">
                        {emp.department || 'General'}
                      </Badge>
                    </div>

                    {/* Email and Phone */}
                    <div className="space-y-1.5 pt-1 text-xs text-slate-400 font-medium">
                      <a 
                        href={`mailto:${emp.email}`} 
                        className="flex items-center gap-2 hover:text-[#f8fafc] transition-colors truncate"
                      >
                        <Mail className="h-3.5 w-3.5 text-[#64748b] shrink-0" />
                        <span className="truncate">{emp.email}</span>
                      </a>
                      {(emp.phone || emp.phoneNumber) && (
                        <a 
                          href={`tel:${emp.phone || emp.phoneNumber}`} 
                          className="flex items-center gap-2 hover:text-[#f8fafc] transition-colors truncate"
                        >
                          <Phone className="h-3.5 w-3.5 text-[#64748b] shrink-0" />
                          <span className="truncate">{emp.phone || emp.phoneNumber}</span>
                        </a>
                      )}
                    </div>

                    {/* Skills pills */}
                    {emp.skills && emp.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {emp.skills.slice(0, 3).map((skill, sIdx) => (
                          <span 
                            key={sIdx} 
                            className="bg-[#0f172a] text-[#94a3b8] px-2.5 py-0.5 rounded-full text-[9px] font-bold border border-[#1e293b] uppercase tracking-wide"
                          >
                            {skill}
                          </span>
                        ))}
                        {emp.skills.length > 3 && (
                          <span className="text-[10px] text-slate-500 font-bold self-center pl-1">
                            +{emp.skills.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer Divider & Call actions */}
                  <div className="border-t border-[#1e293b]/50 pt-4 mt-5 flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 text-xs h-9 bg-transparent border-[#334155] text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-400"
                      onClick={() => window.location.href = `mailto:${emp.email}`}
                    >
                      <Mail className="h-3.5 w-3.5 mr-1.5" /> Mail
                    </Button>
                    {(emp.phone || emp.phoneNumber) && (
                      <Button 
                        variant="outline" 
                        className="flex-1 text-xs h-9 bg-transparent border-[#334155] text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-400"
                        onClick={() => window.location.href = `tel:${emp.phone || emp.phoneNumber}`}
                      >
                        <Phone className="h-3.5 w-3.5 mr-1.5" /> Call
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
