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

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'active': return 'default';
      case 'on_hold': return 'secondary';
      case 'completed': return 'success';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        subtitle="Manage software house projects, milestones, and deliverables"
        actions={
          canCreate && (
            <Button onClick={() => navigate('/projects/new')} className="gap-2">
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
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 border rounded-xl text-center">
          <FolderKanban className="h-12 w-12 text-slate-300 mb-3" />
          <h4 className="font-bold text-slate-700 dark:text-slate-300">No Projects Scheduled</h4>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">
            Launch a new project workspace to begin managing team assignments, design reviews, and sprint tasks.
          </p>
          {canCreate && (
            <Button size="sm" onClick={() => navigate('/projects/new')} className="mt-4">
              Add First Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card
              key={project.id || project._id}
              className="hover:shadow-md transition-shadow cursor-pointer border border-slate-200 dark:border-slate-800"
              onClick={() => navigate(`/projects/${project.id || project._id}`)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${getHealthDotColor(project.health)}`} title={`Health: ${project.health}`} />
                  <CardTitle className="text-base font-bold truncate max-w-[180px]">{project.name}</CardTitle>
                </div>
                <Badge variant={getStatusBadgeVariant(project.status)} className="capitalize">
                  {project.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px]">
                  {project.description || 'No description provided.'}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs border-t pt-3 border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>{project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No date'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 justify-end">
                    <DollarSign className="h-3.5 w-3.5 shrink-0" />
                    <span>{(project.budget?.estimated || 0).toLocaleString()} {project.budget?.currency || 'PKR'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Progression Rate</span>
                    <span className="font-semibold">{project.completionPercent || 0}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${project.completionPercent || 0}%` }} />
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
