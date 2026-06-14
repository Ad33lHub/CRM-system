import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/page-header.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Textarea } from '../../components/ui/textarea.jsx';
import { 
  useGetTaskByIdQuery, 
  useUpdateTaskMutation 
} from '../../services/tasksApi.js';
import useAuth from '../../hooks/useAuth.js';
import AttachmentPreviewModal from '../../components/common/AttachmentPreviewModal.jsx';
import { 
  ArrowLeft, FileText, 
  Loader2, Paperclip, Plus, Download 
} from 'lucide-react';
import { toast } from 'sonner';

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  // States
  const [logHours, setLogHours] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [newComment, setNewComment] = useState('');

  // Preview modal states
  const [previewFile, setPreviewFile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Queries & Mutations
  const { data: taskData, isLoading, refetch } = useGetTaskByIdQuery(id);
  const [updateTaskApi] = useUpdateTaskMutation();

  const task = taskData?.data || taskData;

  const handleStatusChange = async (newStatus) => {
    try {
      await updateTaskApi({ id, data: { status: newStatus } }).unwrap();
      toast.success('Task status updated!');
      refetch();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handlePriorityChange = async (newPriority) => {
    try {
      await updateTaskApi({ id, data: { priority: newPriority } }).unwrap();
      toast.success('Task priority updated!');
      refetch();
    } catch (err) {
      toast.error('Failed to update priority');
    }
  };

  const handleLogHours = async (e) => {
    e.preventDefault();
    const hoursNum = parseFloat(logHours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      toast.error('Please enter a valid number of hours');
      return;
    }

    try {
      const currentLogged = task.loggedHours || 0;
      await updateTaskApi({
        id,
        data: { loggedHours: currentLogged + hoursNum }
      }).unwrap();
      toast.success('Hours logged successfully!');
      setLogHours('');
      refetch();
    } catch (err) {
      toast.error('Failed to log hours');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', 'task');
    formData.append('entityId', id);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        // Add attachment to the task
        const updatedAttachments = [...(task.attachments || []), {
          name: data.fileName,
          url: data.url,
          publicId: data.publicId,
          size: data.size
        }];

        await updateTaskApi({
          id,
          data: { attachments: updatedAttachments }
        }).unwrap();

        toast.success('File attached to task successfully');
        refetch();
      } else {
        toast.error(data.message || "Upload failed");
      }
    } catch (err) {
      toast.error("Error attaching file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      // Simulate adding a note to the task activityLog
      const newActivity = [...(task.activityLog || []), {
        action: 'comment',
        note: newComment,
        doneAt: new Date()
      }];

      await updateTaskApi({
        id,
        data: { activityLog: newActivity }
      }).unwrap();

      toast.success('Comment added!');
      setNewComment('');
      refetch();
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  const openPreview = (att) => {
    setPreviewFile({
      name: att.name,
      url: att.url,
      size: att.size,
      mimeType: att.name?.endsWith('.pdf') ? 'application/pdf' : 'image/png' // estimate
    });
    setPreviewOpen(true);
  };

  if (isLoading) {
    return <div className="text-center py-12 text-slate-400">Loading task details...</div>;
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold text-rose-500">Task Not Found</h3>
        <Button onClick={() => navigate('/tasks')} className="mt-4">Back to Tasks</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={task.title}
        subtitle="Track sub-task checklists, log hours, upload assets, and coordinate sprint feedback"
        breadcrumbs={[
          { label: 'Tasks', href: '/tasks' },
          { label: 'Task Details' }
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate('/tasks')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to List
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left main pane (Details, Comments) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border bg-white dark:bg-slate-900/50 shadow-md">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-blue-500" />
                <span>Task Description</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {task.description || 'No description provided for this task.'}
              </p>
            </CardContent>
          </Card>

          {/* Activity Log / Discussion */}
          <Card className="border bg-white dark:bg-slate-900/50 shadow-md">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Discussion & Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              {/* Form */}
              <form onSubmit={handleAddComment} className="space-y-3">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share status updates or ask questions..."
                  rows={3}
                  className="text-xs"
                />
                <div className="flex justify-end">
                  <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                    Add Comment
                  </Button>
                </div>
              </form>

              {/* Logs */}
              <div className="space-y-4 pt-2 border-t">
                {task.activityLog && task.activityLog.length > 0 ? (
                  task.activityLog.map((log, idx) => (
                    <div key={idx} className="flex gap-3 text-xs">
                      <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-500 shrink-0">
                        US
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          {new Date(log.doneAt).toLocaleString()}
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 leading-normal bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-lg border dark:border-slate-800">
                          {log.note || `${log.action} performed`}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-400 text-xs py-4">No comments or activity logs recorded yet.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right pane (Sidebar controls, hours logging, attachments) */}
        <div className="space-y-6 col-span-1">
          
          {/* Status, Priority, Hours Info */}
          <Card className="border bg-white dark:bg-slate-900/50 shadow-md">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Task Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {/* Status Select */}
              <div className="flex justify-between items-center">
                <span>Status</span>
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">In Review</option>
                  <option value="testing">Testing</option>
                  <option value="done">Done</option>
                </select>
              </div>

              {/* Priority Select */}
              <div className="flex justify-between items-center">
                <span>Priority</span>
                <select
                  value={task.priority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                  className="rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              {/* Time Tracking Progress */}
              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between text-[10px] uppercase tracking-wider text-slate-400">
                  <span>Logged Hours</span>
                  <span>{task.loggedHours || 0} / {task.estimatedHours || 0} hrs</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full" 
                    style={{ width: `${Math.min(100, ((task.loggedHours || 0) / (task.estimatedHours || 1)) * 100)}%` }} 
                  />
                </div>
              </div>

              {/* Log Hours Form */}
              <form onSubmit={handleLogHours} className="flex gap-2 pt-2">
                <Input
                  type="number"
                  step="0.5"
                  value={logHours}
                  onChange={(e) => setLogHours(e.target.value)}
                  placeholder="Hours (e.g. 1.5)"
                  className="h-9 text-xs"
                />
                <Button type="submit" size="sm" className="bg-blue-600 text-white font-bold h-9">
                  Log
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Attachments Card */}
          <Card className="border bg-white dark:bg-slate-900/50 shadow-md">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Paperclip className="h-4.5 w-4.5 text-blue-500" />
                <span>Task Assets</span>
              </CardTitle>
              <div>
                <input
                  type="file"
                  id="task-file-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => document.getElementById('task-file-upload').click()}
                  disabled={isUploading}
                  className="h-8 w-8 p-0"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              {task.attachments && task.attachments.length > 0 ? (
                task.attachments.map((att, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-950/20 border rounded-lg">
                    <span className="truncate font-semibold text-slate-700 dark:text-slate-300 max-w-[120px]">{att.name}</span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openPreview(att)} className="text-[10px] h-7 px-2 font-bold">
                        Preview
                      </Button>
                      <a href={att.url} download target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-slate-400">No attachments uploaded yet.</div>
              )}
            </CardContent>
          </Card>

        </div>

      </div>

      <AttachmentPreviewModal 
        file={previewFile}
        isOpen={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewFile(null);
        }}
      />
    </div>
  );
}
