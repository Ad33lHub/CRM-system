import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/ui/button.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card.jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import {
  Calendar, Users,
  Receipt, Play, Eye, Download, LayoutGrid, Plus, Trash2, UserPlus
} from 'lucide-react';
import {
  useGetProjectByIdQuery,
  useUpdateProjectMutation,
  useAddTeamMemberMutation,
  useRemoveTeamMemberMutation,
} from '../../services/projectsApi.js';
import { useGetEmployeesQuery } from '../../services/employeesApi.js';
import { useGetTasksQuery } from '../../services/tasksApi.js';
import CreateTaskDialog from '../../features/tasks/components/CreateTaskDialog.jsx';
import { useGetInvoicesQuery } from '../../services/invoicesApi.js';
import useAuth from '../../hooks/useAuth.js';
import { toast } from 'sonner';
import FilePreviewModal from '../../components/FilePreview/FilePreviewModal.jsx';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Queries
  const { data: projectRes, isLoading: projectLoading } = useGetProjectByIdQuery(id);
  const { data: tasksRes } = useGetTasksQuery({ projectId: id });
  const { data: invoicesRes } = useGetInvoicesQuery({ projectId: id });
  const { data: employeesRes } = useGetEmployeesQuery({ limit: 100 });

  const project = projectRes?.data || projectRes;
  const tasks = tasksRes?.data || [];
  const invoices = invoicesRes?.data || [];
  const employees = employeesRes?.data || [];

  // Mutations
  const [updateProject, { isLoading: updatingStatus }] = useUpdateProjectMutation();
  const [addTeamMember, { isLoading: addingMember }] = useAddTeamMemberMutation();
  const [removeTeamMember] = useRemoveTeamMemberMutation();

  const handleStatusChange = async (newStatus) => {
    try {
      await updateProject({ id, data: { status: newStatus } }).unwrap();
      toast.success(`Project moved to ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update status');
    }
  };

  // Task creation + member assignment UI state
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [memberUserId, setMemberUserId] = useState('');
  const [memberRole, setMemberRole] = useState('developer');

  const canManage = ['super_admin', 'admin', 'manager'].includes(role);

  const handleAddMember = async () => {
    if (!memberUserId) {
      toast.error('Please select a team member');
      return;
    }
    try {
      await addTeamMember({ id, data: { userId: memberUserId, role: memberRole } }).unwrap();
      toast.success('Team member added');
      setMemberUserId('');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to add team member');
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await removeTeamMember({ id, userId }).unwrap();
      toast.success('Team member removed');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to remove team member');
    }
  };

  // Local state for documents
  const [documents, setDocuments] = useState([]);
  const [docLoading, setDocLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const fetchProjectDocuments = useCallback(async () => {
    setDocLoading(true);
    try {
      const res = await fetch(`/api/documents?entityType=project&entityId=${id}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (res.ok) setDocuments(data);
    } catch {
      toast.error('Failed to load project documents.');
    } finally {
      setDocLoading(false);
    }
  }, [id, accessToken]);

  useEffect(() => {
    if (id && activeTab === 'files') {
      fetchProjectDocuments();
    }
  }, [id, activeTab, fetchProjectDocuments]);

  const handleDownload = async (docId, versionNumber = null) => {
    try {
      const url = `/api/documents/${docId}/download${versionNumber ? `?version=${versionNumber}` : ''}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.target = '_blank';
      a.click();
    } catch {
      toast.error('Failed to get signed URL');
    }
  };

  const triggerPreview = (doc) => {
    setPreviewFile({
      id: doc._id,
      documentId: doc._id,
      name: doc.name,
      mimeType: doc.mimeType,
      size: doc.totalSize,
      version: doc.currentVersion,
      entityType: doc.entityType,
      category: doc.category
    });
    setPreviewOpen(true);
  };

  if (projectLoading) {
    return <div className="text-center py-12 text-slate-400">Loading project details...</div>;
  }

  if (!project) {
    return <div className="text-center py-12 text-rose-500">Project Workspace not found</div>;
  }

  // Status badge styling helper
  const getProjectStatusStyleAndLabel = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'active') {
      return {
        label: 'Active',
        style: {
          background: 'rgba(34, 197, 94, 0.12)',
          color: '#4ade80',
          border: '1px solid rgba(34, 197, 94, 0.25)'
        }
      };
    } else if (s === 'on_hold') {
      return {
        label: 'On Hold',
        style: {
          background: 'rgba(250, 204, 21, 0.12)',
          color: '#facc15',
          border: '1px solid rgba(250, 204, 21, 0.25)'
        }
      };
    } else if (s === 'completed') {
      return {
        label: 'Completed',
        style: {
          background: 'rgba(59, 130, 246, 0.12)',
          color: '#60a5fa',
          border: '1px solid rgba(59, 130, 246, 0.25)'
        }
      };
    } else if (s === 'cancelled') {
      return {
        label: 'Cancelled',
        style: {
          background: 'rgba(248, 113, 113, 0.12)',
          color: '#f87171',
          border: '1px solid rgba(248, 113, 113, 0.25)'
        }
      };
    } else {
      return {
        label: status,
        style: {
          background: 'rgba(148, 163, 184, 0.12)',
          color: '#94a3b8',
          border: '1px solid rgba(148, 163, 184, 0.25)'
        }
      };
    }
  };

  const renderBudgetValue = (value, currency) => {
    if (value === null || value === undefined || value === 0) {
      return <span className="text-[#475569] font-medium">—</span>;
    }
    return `${value.toLocaleString()} ${currency}`;
  };

  const getMilestoneStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    let label = '';
    let styles = {};
    if (s === 'pending') {
      label = 'Pending';
      styles = { backgroundColor: 'rgba(250,204,21,0.12)', color: '#facc15' };
    } else if (s === 'in_progress') {
      label = 'In Progress';
      styles = { backgroundColor: 'rgba(59,130,246,0.12)', color: '#60a5fa' };
    } else if (s === 'completed') {
      label = 'Completed';
      styles = { backgroundColor: 'rgba(34,197,94,0.12)', color: '#4ade80' };
    } else if (s === 'blocked') {
      label = 'Blocked';
      styles = { backgroundColor: 'rgba(248,113,113,0.12)', color: '#f87171' };
    } else {
      label = status;
      styles = { backgroundColor: 'rgba(148,163,184,0.12)', color: '#94a3b8' };
    }
    return (
      <span className="milestone-badge" style={styles}>
        {label}
      </span>
    );
  };

  const isPastDue = project.deadline ? new Date(project.deadline) < new Date() : false;
  const statusInfo = getProjectStatusStyleAndLabel(project.status);

  return (
    <div className="space-y-6">
      {/* Custom Page Header */}
      <div className="flex flex-col border-b border-[#1e293b] pb-5 mb-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[13px] text-[#64748b] mb-4">
          <Link to="/projects" className="hover:text-[#cbd5e1] transition-colors">Projects</Link>
          <span className="text-[#334155]">›</span>
          <span className="text-[#94a3b8]">{project.name}</span>
        </div>
        
        {/* Title and Badge Row */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-[28px] font-bold text-[#f8fafc] leading-none">
              {project.name}
            </h1>
            <span
              className="inline-flex items-center rounded-[20px] px-3.5 py-1 text-[12px] font-bold uppercase tracking-wider"
              style={statusInfo.style}
            >
              {statusInfo.label}
            </span>
          </div>

          {canManage && (
            <div className="flex items-center gap-2">
              <label htmlFor="proj-status" className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                Status
              </label>
              <select
                id="proj-status"
                value={project.status}
                disabled={updatingStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="h-9 rounded-md border border-[#334155] bg-[#0f172a] px-3 text-sm font-semibold text-[#f8fafc] capitalize focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}
        </div>
        
        {/* Subtitle */}
        <p className="text-[14px] text-[#64748b] mt-1.5 mb-1">
          Viewing workspace and progression metrics for Project: {project.name}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 w-full">
        {/* Tab Bar sits outside the main content panel */}
        <TabsList className="select-none project-tabs" variant="line">
          <TabsTrigger value="overview" className="tab-item">
            Overview
          </TabsTrigger>
          <TabsTrigger value="tasks" className="tab-item">
            Tasks <span className="tab-badge">{tasks.length}</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="tab-item">
            Members <span className="tab-badge">{project.team?.length || 0}</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="tab-item">
            Invoices <span className="tab-badge">{invoices.length}</span>
          </TabsTrigger>
          <TabsTrigger value="files" className="tab-item">
            Files <span className="tab-badge">{documents.length}</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="tab-item">
            Timeline
          </TabsTrigger>
        </TabsList>

        {/* CSS Grid Layout Container */}
        <div className="project-detail-layout">
          
          {/* Main Content Area (Column 1) */}
          <div className="project-main-content space-y-6">
            
            {/* Tab 1: Overview */}
            <TabsContent value="overview" className="space-y-6 m-0">
              {/* Main project workspace panel empty state */}
              <div className="project-main-panel">
                <LayoutGrid className="h-10 w-10 text-[#334155] mb-3" />
                <h3 className="text-[16px] font-semibold text-[#64748b] mb-1">No workspace data</h3>
                <p className="text-[13px] text-[#475569] text-center max-w-[280px]">
                  Select a tab below to view tasks, members, or timeline.
                </p>
              </div>

              {/* Project Milestones */}
              <div className="bg-[#1a2332] border border-[#1e293b] rounded-lg p-5">
                <h3 className="text-[11px] font-bold tracking-wider text-[#64748b] uppercase mb-4">
                  PROJECT MILESTONES
                </h3>
                {project.milestones?.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">No milestones registered yet.</div>
                ) : (
                  <div className="space-y-3">
                    {project.milestones?.map((m, idx) => (
                      <div key={m._id || idx} className="milestone-row">
                        <div>
                          <p className="milestone-name">{m.title}</p>
                          <p className="milestone-due">
                            Due: {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        {getMilestoneStatusBadge(m.status)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tab 2: Tasks */}
            <TabsContent value="tasks" className="m-0">
              <Card className="border border-[#1e293b] bg-[#1a2332]">
                <CardHeader className="flex flex-row items-center justify-between border-b border-[#1e293b]">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Kanban Deliverable Tasks</CardTitle>
                  <div className="flex items-center gap-2">
                    {canManage && (
                      <Button size="sm" onClick={() => setTaskDialogOpen(true)} className="gap-1.5 h-8 bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="h-3.5 w-3.5" /> New Task
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => navigate('/tasks')} className="gap-1.5 h-8">
                      <Play className="h-3.5 w-3.5" /> Go to Board
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {tasks.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">No tasks registered under this project workspace.</div>
                  ) : (
                    <div className="space-y-2">
                      {tasks.map((task) => (
                        <div key={task.id || task._id} className="flex items-center justify-between p-3 rounded-lg border border-[#1e293b] text-xs bg-[#0f172a] text-[#f8fafc]">
                          <div>
                            <p className="font-bold text-[#f8fafc]">{task.title}</p>
                            <p className="text-[10px] text-slate-400">Priority: <span className="capitalize font-semibold">{task.priority}</span></p>
                          </div>
                          <Badge variant="outline" className="capitalize text-[#f8fafc] border-[#334155]">{task.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 3: Members */}
            <TabsContent value="members" className="m-0">
              <Card className="border border-[#1e293b] bg-[#1a2332]">
                <CardHeader className="border-b border-[#1e293b]">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Team Roster Assignments</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                  {/* Add member form */}
                  {canManage && (
                    <div className="flex flex-col sm:flex-row gap-2 p-3 rounded-lg border border-dashed border-[#334155] bg-[#0f172a]">
                      <select
                        value={memberUserId}
                        onChange={(e) => setMemberUserId(e.target.value)}
                        className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">-- Select teammate --</option>
                        {employees.map((emp) => {
                          const u = emp.user || {};
                          const uid = u._id || u.id;
                          if (!uid) return null;
                          return (
                            <option key={emp.id || emp._id} value={uid}>
                              {u.firstName} {u.lastName}
                              {emp.designation ? ` · ${emp.designation}` : ''}
                            </option>
                          );
                        })}
                      </select>
                      <select
                        value={memberRole}
                        onChange={(e) => setMemberRole(e.target.value)}
                        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="pm">PM</option>
                        <option value="lead_dev">Lead Dev</option>
                        <option value="developer">Developer</option>
                        <option value="designer">Designer</option>
                        <option value="qa">QA</option>
                      </select>
                      <Button onClick={handleAddMember} disabled={addingMember} className="gap-1.5 h-10 bg-blue-600 hover:bg-blue-700 text-white">
                        <UserPlus className="h-4 w-4" /> {addingMember ? 'Adding…' : 'Add'}
                      </Button>
                    </div>
                  )}

                  {project.team?.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">No team members assigned yet.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {project.team?.map((member, idx) => {
                        const u = member.user && typeof member.user === 'object' ? member.user : null;
                        const memberUid = u ? u._id || u.id : member.user;
                        const displayName = u ? `${u.firstName} ${u.lastName}` : `User ID: ${member.user}`;
                        return (
                          <div key={memberUid || idx} className="flex items-center gap-3 p-3 rounded-lg border border-[#1e293b] text-xs bg-[#0f172a] text-[#f8fafc]">
                            <Users className="h-5 w-5 text-blue-500 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-[#f8fafc] truncate">{displayName}</p>
                              <p className="text-[10px] text-slate-400 capitalize">
                                Role: {(member.role || 'member').replace('_', ' ')}
                                {u?.email ? ` · ${u.email}` : ''}
                              </p>
                            </div>
                            {canManage && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(memberUid)}
                                className="text-slate-500 hover:text-rose-400 transition-colors shrink-0"
                                aria-label="Remove member"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 4: Invoices */}
            <TabsContent value="invoices" className="m-0">
              <Card className="border border-[#1e293b] bg-[#1a2332]">
                <CardHeader className="flex flex-row items-center justify-between border-b border-[#1e293b]">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Associated Invoices</CardTitle>
                  {['super_admin', 'admin', 'manager'].includes(role) && (
                    <Button size="sm" onClick={() => navigate('/invoices/new')} className="gap-1.5 h-8">
                      <Receipt className="h-3.5 w-3.5" /> Create Invoice
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="pt-6">
                  {invoices.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">No invoices generated for this project yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {invoices.map((inv) => (
                        <div key={inv.id || inv._id} className="flex items-center justify-between p-3 rounded-lg border border-[#1e293b] text-xs bg-[#0f172a] text-[#f8fafc]">
                          <div>
                            <p className="font-bold text-[#f8fafc]">Invoice #{inv.invoiceNumber}</p>
                            <p className="text-[10px] text-slate-400">Total: {inv.currency || 'PKR'} {(inv.total || 0).toLocaleString()}</p>
                          </div>
                          <Badge className="capitalize text-[#f8fafc] border-[#334155]">{inv.status?.replace('_', ' ')}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 5: Files */}
            <TabsContent value="files" className="m-0">
              <Card className="border border-[#1e293b] bg-[#1a2332]">
                <CardHeader className="border-b border-[#1e293b]">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Secure Files Library</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {docLoading ? (
                    <div className="text-center py-6 text-xs text-slate-400">Loading files folder...</div>
                  ) : documents.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">No project contracts or assets uploaded yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div key={doc._id} className="flex items-center justify-between p-3 rounded-lg border border-[#1e293b] text-xs bg-[#0f172a] text-[#f8fafc]">
                          <div>
                            <p className="font-bold text-[#f8fafc]">{doc.name}</p>
                            <p className="text-[10px] text-slate-400">Version: v{doc.currentVersion} · {doc.mimeType}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => triggerPreview(doc)} className="h-7 px-2 text-[10px] gap-1">
                              <Eye className="h-3 w-3" /> Preview
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDownload(doc._id)} className="h-7 px-2 text-[10px] gap-1">
                              <Download className="h-3 w-3" /> Download
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 6: Timeline */}
            <TabsContent value="timeline" className="m-0">
              <Card className="border border-[#1e293b] bg-[#1a2332]">
                <CardHeader className="border-b border-[#1e293b]">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Project Audit Activity Logs</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4 text-xs">
                    <div className="flex gap-3 items-start border-l-2 border-[#1e293b] pl-4 py-2 relative">
                      <div className="absolute h-2.5 w-2.5 rounded-full bg-blue-600 left-[-6px] top-4" />
                      <div>
                        <p className="font-bold text-[#f8fafc]">Project Created</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Initial draft timeline set up.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </div>

          {/* Right Sidebar 1: Scope Overview */}
          <div className="project-side-panel scope-panel">
            <h3 className="text-[11px] font-bold tracking-wider text-[#64748b] uppercase mb-3">
              SCOPE OVERVIEW
            </h3>
            <p className="text-[14px] text-[#cbd5e1] leading-relaxed mb-4">
              {project.description || 'No description provided.'}
            </p>
            
            <div className="scope-info-row">
              <Calendar className="text-blue-500 shrink-0" />
              <span>Started: {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</span>
            </div>
            
            <div className="scope-info-row">
              <Calendar className={isPastDue ? 'text-[#facc15] shrink-0' : 'text-[#94a3b8] shrink-0'} />
              <span>Target Date: {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>

          {/* Right Sidebar 2: Budget Details */}
          <div className="project-side-panel budget-panel">
            <h3 className="text-[11px] font-bold tracking-wider text-[#64748b] uppercase mb-3">
              BUDGET DETAILS
            </h3>
            
            <div className="budget-row">
              <span className="budget-label">Estimated Budget</span>
              <span className="budget-value">
                {renderBudgetValue(project.budget?.estimated, project.budget?.currency || 'PKR')}
              </span>
            </div>
            
            <div className="budget-row">
              <span className="budget-label">Actual Spent</span>
              <span className="budget-value">
                {renderBudgetValue(project.budget?.actual, project.budget?.currency || 'PKR')}
              </span>
            </div>
          </div>

        </div>
      </Tabs>

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        isOpen={previewOpen}
        onClose={() => { setPreviewOpen(false); setPreviewFile(null); }}
      />

      {/* Create Task Dialog (pre-linked to this project) */}
      <CreateTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        defaultProjectId={id}
        lockProject
      />
    </div>
  );
}
