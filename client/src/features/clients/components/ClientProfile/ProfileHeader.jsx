import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Edit2,
  MoreVertical,
  Globe,
  Tag,
  Plus,
  DollarSign,
  Briefcase,
  CheckSquare,
  FileText,
  Trash2,
  History,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ProfileHeader({
  client,
  stats = {},
  onEdit,
  onStatusChange,
  onDelete,
  onAddTag,
  onRemoveTag,
  userRole,
}) {
  const navigate = useNavigate();

  const getInitials = (name) => {
    if (!name) return 'C';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const formattedRevenue = new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: client.currency || 'PKR',
    maximumFractionDigits: 0,
  }).format(client.totalRevenue || 0);

  const websiteUrl = client.website && !/^https?:\/\//i.test(client.website)
    ? `https://${client.website}`
    : client.website;

  return (
    <div className="space-y-6 bg-card border rounded-xl p-6 shadow-sm">
      {/* Upper Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 text-lg border-2 border-primary/10">
            {client.avatar ? (
              <AvatarImage src={client.avatar} alt={client.companyName} />
            ) : null}
            <AvatarFallback className="bg-primary/5 text-primary font-bold">
              {getInitials(client.companyName)}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {client.companyName}
            </h1>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span className="capitalize">{client.industry}</span>
              {client.companySize && (
                <>
                  <span>•</span>
                  <span>{client.companySize} employees</span>
                </>
              )}
              {client.website && (
                <>
                  <span>•</span>
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {client.website}
                  </a>
                </>
              )}
            </div>
            {client.assignedTo && (
              <div className="flex items-center gap-2 pt-1 text-sm text-muted-foreground">
                <span>Assigned to:</span>
                <Avatar className="h-5 w-5">
                  {client.assignedTo.avatar && (
                    <AvatarImage src={client.assignedTo.avatar} alt={client.assignedTo.firstName} />
                  )}
                  <AvatarFallback className="bg-muted text-[10px]">
                    {client.assignedTo.firstName?.[0]}
                    {client.assignedTo.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">
                  {client.assignedTo.firstName} {client.assignedTo.lastName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto ml-auto md:ml-0">
          <Button onClick={onEdit} variant="outline" size="sm" className="gap-1">
            <Edit2 className="h-4 w-4" /> Edit
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={onEdit} className="gap-2">
                <Edit2 className="h-4 w-4 text-muted-foreground" />
                Edit Client
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onStatusChange} className="gap-2">
                <StatusBadge status={client.status} size="sm" className="h-4 pointer-events-none" />
                Change Status
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate(`/activity?entity=Client&entityId=${client._id || client.id}`)}
                className="gap-2"
              >
                <History className="h-4 w-4 text-muted-foreground" />
                View Audit Log
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="gap-2 text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4" />
                Archive Client
              </DropdownMenuItem>

              {['super_admin', 'admin'].includes(userRole) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => alert('Viewing as client...')} className="gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    View as Client
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <hr className="border-border" />

      {/* Badges / Tags Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Clickable status badge */}
          <button
            onClick={onStatusChange}
            className="hover:opacity-90 active:scale-95 transition-all focus:outline-none"
            title="Click to change status"
          >
            <StatusBadge status={client.status} dot />
          </button>

          <Badge variant="outline" className="capitalize bg-muted/50 text-muted-foreground">
            Source: {client.source}
          </Badge>

          {client.tags?.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="group flex items-center gap-1.5 px-2.5 py-0.5"
            >
              <Tag className="h-3 w-3 text-muted-foreground" />
              {tag}
              <button
                type="button"
                onClick={() => onRemoveTag(tag)}
                className="text-muted-foreground hover:text-foreground rounded-full"
              >
                ×
              </button>
            </Badge>
          ))}
          <Button
            onClick={onAddTag}
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3 w-3" /> Add tag
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
        <div className="flex items-center gap-3 p-3 bg-muted/20 border border-muted/40 rounded-lg">
          <div className="p-2 bg-primary/10 rounded-md text-primary">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Total Revenue</p>
            <p className="text-base font-bold text-foreground">{formattedRevenue}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-muted/20 border border-muted/40 rounded-lg">
          <div className="p-2 bg-emerald-500/10 rounded-md text-emerald-600">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Active Projects</p>
            <p className="text-base font-bold text-foreground">{stats.activeProjects ?? 0}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-muted/20 border border-muted/40 rounded-lg">
          <div className="p-2 bg-blue-500/10 rounded-md text-blue-600">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Open Tasks</p>
            <p className="text-base font-bold text-foreground">{stats.openTasks ?? 0}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-muted/20 border border-muted/40 rounded-lg">
          <div className="p-2 bg-amber-500/10 rounded-md text-amber-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Open Invoices</p>
            <p className="text-base font-bold text-foreground">{stats.openInvoices ?? 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
