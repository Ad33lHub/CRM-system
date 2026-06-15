import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/page-header.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { FolderKanban, Plus, Calendar, DollarSign } from 'lucide-react';
import { useGetProjectsQuery } from '../../services/projectsApi.js';
import useAuth from '../../hooks/useAuth.js';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading } = useGetProjectsQuery({
    status: statusFilter === 'all' ? undefined : statusFilter
  });
  const projects = data?.data || [];

  const canCreate = ['super_admin', 'admin', 'manager'].includes(role);

  const getHealthDotColor = (health) => {
    switch (health) {
      case 'green': return 'bg-emerald-500';
      case 'amber': return 'bg-amber-500';
      case 'red': return 'bg-rose-500';
      default: return 'bg-slate-400';
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'active':
        return { background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' };
      case 'completed':
        return { background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80' };
      case 'on_hold':
        return { background: 'rgba(250, 204, 21, 0.15)', color: '#facc15' };
      case 'cancelled':
        return { background: 'rgba(248, 113, 113, 0.15)', color: '#f87171' };
      default:
        return { background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8' };
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        subtitle="Manage software house projects, milestones, and deliverables"
        actions={
          canCreate && (
            <Button onClick={() => navigate('/projects/new')} className="btn-primary-cta gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          )
        }
      />

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b pb-4 overflow-x-auto select-none">
        {['all', 'draft', 'active', 'on_hold', 'completed', 'cancelled'].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setStatusFilter(status)}
            className="capitalize"
          >
            {status.replace('_', ' ')}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading projects workspace...</div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-[#1a2332] border border-[#1e293b] rounded-xl text-center">
          <FolderKanban className="h-12 w-12 text-slate-300 mb-3" />
          <h4 className="font-bold text-slate-700 dark:text-slate-300">No Projects Scheduled</h4>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">
            Launch a new project workspace to begin managing team assignments, design reviews, and sprint tasks.
          </p>
          {canCreate && (
            <Button size="sm" onClick={() => navigate('/projects/new')} className="btn-primary-cta mt-4">
              Add First Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-[24px]">
          {projects.map((project) => (
            <Card
              key={project.id || project._id}
              className="hover:shadow-md transition-shadow cursor-pointer border border-[#1e293b]"
              onClick={() => navigate(`/projects/${project.id || project._id}`)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${getHealthDotColor(project.health)}`} title={`Health: ${project.health}`} />
                  <CardTitle className="text-base font-bold truncate max-w-[180px]">{project.name}</CardTitle>
                </div>
                <Badge
                  style={{
                    borderRadius: '6px',
                    padding: '2px 10px',
                    fontSize: '11px',
                    fontWeight: '600',
                    border: 'none',
                    ...getStatusBadgeStyle(project.status)
                  }}
                  className="capitalize"
                >
                  {project.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px]">
                  {project.description || 'No description provided.'}
                </p>

                <div className="space-y-3 pt-3 border-t border-[#1e293b] mt-3 text-[12px]">
                  <div className="flex justify-between items-center">
                    <span className="text-[#64748b]">Deadline</span>
                    <span className="font-medium text-right text-[#f8fafc]">
                      {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No date'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#64748b]">Budget</span>
                    <span className="font-medium text-right text-[#f8fafc]">
                      {(project.budget?.estimated || 0).toLocaleString()} {project.budget?.currency || 'PKR'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#64748b]">Progression Rate</span>
                    <span className="font-semibold text-right text-[#f8fafc]">{project.completionPercent || 0}%</span>
                  </div>
                  <div className="h-[4px] w-full bg-[#1e293b] rounded-[2px] overflow-hidden">
                    <div className="h-full bg-[#3b82f6] rounded-[2px]" style={{ width: `${project.completionPercent || 0}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
