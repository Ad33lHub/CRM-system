import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/page-header.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import {
  Sparkles, CheckSquare, Calendar, FolderKanban,
  ArrowLeft, FileText, CheckCircle2, Paperclip, Eye,
} from 'lucide-react';
import { useGetMeetingByIdQuery } from '../../services/meetingsApi.js';
import AttachmentPreviewModal from '../../components/common/AttachmentPreviewModal.jsx';

export default function MeetingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useGetMeetingByIdQuery(id);
  const meeting = data?.data;

  const [previewFile, setPreviewFile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const openPreview = (att) => {
    setPreviewFile({
      name: att.name || 'Attachment',
      url: att.url,
      mimeType: att.mimeType || '',
      size: att.size || 0,
    });
    setPreviewOpen(true);
  };

  if (isLoading) {
    return <div className="text-center py-12 text-slate-400">Loading meeting detail...</div>;
  }

  if (!meeting) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold text-rose-500">Meeting Not Found</h3>
        <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={meeting.title}
        subtitle="AI-summarized meeting minutes and team action tracker"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Meeting Details' },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        }
      />

      {/* Meta context cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center gap-3">
          <Calendar className="h-8 w-8 text-blue-500 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Date Conducted</div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {new Date(meeting.date || meeting.createdAt).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
        </Card>

        {meeting.projectId && (
          <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center gap-3">
            <FolderKanban className="h-8 w-8 text-indigo-500 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Project Scope</div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                {meeting.projectId.name || 'CRM Workspace'}
              </div>
            </div>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transcript block */}
        <Card className="lg:col-span-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm flex flex-col max-h-[70vh]">
          <CardHeader className="border-b py-3 px-4">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-400" />
              <span>Full Meeting Transcript</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 overflow-y-auto flex-1 text-xs font-mono bg-slate-50 dark:bg-slate-950/20 text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
            {meeting.transcript}
          </CardContent>
        </Card>

        {/* AI summary & actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Executive Summary */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500 animate-pulse" />
                <span>Executive Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {meeting.summary}
              </p>
            </CardContent>
          </Card>

          {/* Action items checklist */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-md">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-emerald-500" />
                <span>Action Items Checklist</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 dark:divide-slate-800 p-0">
              {meeting.actionItems && meeting.actionItems.length > 0 ? (
                meeting.actionItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/10"
                  >
                    <CheckCircle2 className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                        {item.task}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        <span>Assignee: {item.assignee || 'Unassigned'}</span>
                        {item.dueDate && (
                          <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] uppercase tracking-wider border-slate-200">
                      Pending
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No action items extracted by AI.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attachments */}
          {meeting.attachments && meeting.attachments.length > 0 && (
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Paperclip className="h-5 w-5 text-blue-500" />
                  <span>Attachments</span>
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    {meeting.attachments.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {meeting.attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {att.name || 'Attachment'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 uppercase">
                        {att.mimeType || 'file'}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openPreview(att)}
                      className="shrink-0 gap-1.5 h-7 px-2 text-[10px] font-bold"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
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
