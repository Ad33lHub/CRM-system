import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, AlertCircle, Calendar, Plus, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetClientProjectsQuery } from '@/services/clientsApi';

export default function ProjectsTab({ clientId }) {
  const navigate = useNavigate();
  const { data, isLoading } = useGetClientProjectsQuery(clientId);

  const projects = data?.data || data || [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="w-full">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-1/3 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Summary Metrics
  const total = projects.length;
  const active = projects.filter((p) => p.status === 'active').length;
  const completed = projects.filter((p) => p.status === 'completed').length;
  const onHold = projects.filter((p) => p.status === 'on_hold').length;

  if (total === 0) {
    return (
      <Card className="border-dashed flex flex-col items-center justify-center p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Briefcase className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          No projects have been created for this client. Get started by launching a new project workspace.
        </p>
        <Button onClick={() => navigate('/projects/new', { state: { clientId } })} className="mt-4 gap-1">
          <Plus className="h-4 w-4" /> New Project
        </Button>
      </Card>
    );
  }

  const getHealthColor = (health) => {
    switch (health) {
      case 'green':
        return 'bg-emerald-500';
      case 'amber':
        return 'bg-amber-500';
      case 'red':
        return 'bg-red-500';
      default:
        return 'bg-muted';
    }
  };

  const getPriorityVariant = (priority) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
      default:
        return 'outline';
    }
  };

  const formatCurrency = (amount, curr = 'PKR') => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Summary Row */}
      <div className="grid grid-cols-4 gap-4 text-center">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-foreground">{total}</p>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Total Projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-primary">{active}</p>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-emerald-600">{completed}</p>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-amber-600">{onHold}</p>
            <p className="text-xs text-muted-foreground uppercase font-semibold">On Hold</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project) => {
          const isOverdue =
            project.deadline &&
            new Date(project.deadline) < new Date() &&
            !['completed', 'cancelled'].includes(project.status);

          const progress = project.completionPercent || 0;

          return (
            <Card key={project._id || project.id} className="group hover:shadow-md transition-all">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${getHealthColor(project.health)}`}
                      title={`Health Status: ${project.health}`}
                    />
                    <h3 className="font-bold text-foreground text-base group-hover:text-primary transition-colors truncate max-w-[200px]">
                      {project.name}
                    </h3>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Badge variant="outline" className="capitalize text-[10px] py-0 px-2">
                      {project.status}
                    </Badge>
                    <Badge variant={getPriorityVariant(project.priority)} className="capitalize text-[10px] py-0 px-2">
                      {project.priority}
                    </Badge>
                  </div>
                </div>

                {project.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                )}

                {/* Team Avatars */}
                {project.team && project.team.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <div className="flex -space-x-2">
                      {project.team.slice(0, 4).map((tm, idx) => (
                        <Avatar key={idx} className="h-6 w-6 border-2 border-background">
                          {tm.user?.avatar && <AvatarImage src={tm.user.avatar} alt="Team" />}
                          <AvatarFallback className="text-[8px] bg-muted">
                            {tm.role?.toUpperCase() || 'DEV'}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    {project.team.length > 4 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{project.team.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>

                {/* Deadline and Budget */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className={isOverdue ? 'text-destructive font-bold' : 'text-muted-foreground'}>
                      {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}
                    </span>
                    {isOverdue && <AlertCircle className="h-3.5 w-3.5 text-destructive animate-pulse" />}
                  </div>

                  <div className="text-right">
                    <span className="text-muted-foreground">Budget: </span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(project.budget?.actual || 0, project.budget?.currency)}
                    </span>
                    <span className="text-muted-foreground text-[10px]">
                      {' '}/ {formatCurrency(project.budget?.estimated || 0, project.budget?.currency)}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-3 flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs gap-1 hover:text-primary"
                    onClick={() => navigate(`/projects/${project._id || project.id}`)}
                  >
                    View Project <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
