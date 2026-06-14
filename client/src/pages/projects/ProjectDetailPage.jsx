import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/page-header.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card.jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { 
  Calendar, Users, 
  Receipt, AlertTriangle, Play, Eye, Download 
} from 'lucide-react';
import { useGetProjectByIdQuery } from '../../services/projectsApi.js';
import { useGetTasksQuery } from '../../services/tasksApi.js';
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

  const project = projectRes?.data || projectRes;
  const tasks = tasksRes?.data || [];
  const invoices = invoicesRes?.data || [];

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

  const projectStatusBadge = (status) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800';
      case 'on_hold': return 'bg-amber-100 text-amber-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-rose-100 text-rose-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.name}
        subtitle={`Viewing workspace and progression metrics for Project: ${project.name}`}
        breadcrumbs={[
          { label: 'Projects', href: '/projects' },
          { label: project.name }
        ]}
        actions={
          <Badge className={`capitalize py-1 px-3 ${projectStatusBadge(project.status)}`}>
            {project.status}
          </Badge>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="select-none">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="members">Members ({project.team?.length || 0})</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
          <TabsTrigger value="files">Files ({documents.length})</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Scope Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {project.description || 'No description provided.'}
                </p>
                <div className="flex gap-6 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span>Started: {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span>Target Target: {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Budget Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Estimated Budget</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {(project.budget?.estimated || 0).toLocaleString()} {project.budget?.currency || 'PKR'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Actual Spent</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {(project.budget?.actual || 0).toLocaleString()} {project.budget?.currency || 'PKR'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Project Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              {project.milestones?.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">No milestones registered yet.</div>
              ) : (
                <div className="space-y-3">
                  {project.milestones?.map((m, idx) => (
                    <div key={m._id || idx} className="flex items-center justify-between p-3 rounded-lg border text-xs">
                      <div>
                        <p className="font-bold text-slate-700 dark:text-slate-200">{m.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Due: {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <Badge className="capitalize">{m.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Tasks */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Kanban Deliverable Tasks</CardTitle>
              <Button size="sm" onClick={() => navigate('/tasks')} className="gap-1.5 h-8">
                <Play className="h-3.5 w-3.5" /> Go to Board
              </Button>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">No tasks registered under this project workspace.</div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div key={task.id || task._id} className="flex items-center justify-between p-3 rounded-lg border text-xs bg-white dark:bg-slate-900">
                      <div>
                        <p className="font-bold text-slate-700 dark:text-slate-200">{task.title}</p>
                        <p className="text-[10px] text-slate-400">Priority: <span className="capitalize font-semibold">{task.priority}</span></p>
                      </div>
                      <Badge variant="outline" className="capitalize">{task.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Members */}
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Team Roster Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {project.team?.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">No team members assigned yet.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.team?.map((member, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border text-xs bg-white dark:bg-slate-900">
                      <Users className="h-5 w-5 text-blue-500 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-700 dark:text-slate-200">User ID: {member.user}</p>
                        <p className="text-[10px] text-slate-400 capitalize">Role: {member.role || 'Member'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Invoices */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Associated Invoices</CardTitle>
              {['super_admin', 'admin', 'manager'].includes(role) && (
                <Button size="sm" onClick={() => navigate('/invoices/new')} className="gap-1.5 h-8">
                  <Receipt className="h-3.5 w-3.5" /> Create Invoice
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">No invoices generated for this project yet.</div>
              ) : (
                <div className="space-y-2">
                  {invoices.map((inv) => (
                    <div key={inv.id || inv._id} className="flex items-center justify-between p-3 rounded-lg border text-xs bg-white dark:bg-slate-900">
                      <div>
                        <p className="font-bold text-slate-700 dark:text-slate-200">Invoice #{inv.invoiceNumber}</p>
                        <p className="text-[10px] text-slate-400">Total: {inv.totals?.total} {inv.totals?.currency}</p>
                      </div>
                      <Badge className="capitalize">{inv.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Files */}
        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Secure Files Library</CardTitle>
            </CardHeader>
            <CardContent>
              {docLoading ? (
                <div className="text-center py-6 text-xs text-slate-400">Loading files folder...</div>
              ) : documents.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">No project contracts or assets uploaded yet.</div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc._id} className="flex items-center justify-between p-3 rounded-lg border text-xs bg-white dark:bg-slate-900">
                      <div>
                        <p className="font-bold text-slate-700 dark:text-slate-200">{doc.name}</p>
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
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Project Audit Activity Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-xs">
                <div className="flex gap-3 items-start border-l-2 pl-4 py-2 relative">
                  <div className="absolute h-2.5 w-2.5 rounded-full bg-blue-600 left-[-6px] top-4" />
                  <div>
                    <p className="font-bold text-slate-700 dark:text-slate-200">Project Created</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Initial draft timeline set up.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* File Preview Modal */}
      <FilePreviewModal 
        file={previewFile}
        isOpen={previewOpen}
        onClose={() => { setPreviewOpen(false); setPreviewFile(null); }}
      />
    </div>
  );
}
