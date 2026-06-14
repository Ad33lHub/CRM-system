import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/page-header.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Textarea } from '../../components/ui/textarea.jsx';
import { Sparkles, Loader2, ArrowLeft, Headphones } from 'lucide-react';
import { useCreateMeetingMutation } from '../../services/meetingsApi.js';
import { useGetProjectsQuery } from '../../services/projectsApi.js';
import { toast } from 'sonner';

export default function MeetingProcessorPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [transcript, setTranscript] = useState('');

  const { data: projectsData } = useGetProjectsQuery();
  const projects = projectsData?.data || [];

  const [createMeetingApi, { isLoading }] = useCreateMeetingMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!transcript.trim()) {
      toast.error('Please provide a meeting transcript');
      return;
    }

    try {
      const result = await createMeetingApi({
        title,
        projectId: projectId || undefined,
        transcript
      }).unwrap();

      toast.success('Meeting details processed with AI!');
      const mid = result.data.id || result.data._id;
      navigate(`/meetings/${mid}`);
    } catch (err) {
      toast.error(err.data?.message || 'Failed to process meeting');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meeting Transcript Processor"
        subtitle="Extract Action items, task assignments, and executive summaries using AI"
      />

      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Headphones className="h-5 w-5 text-blue-500" />
                <span>Audio Notes & Transcript Form</span>
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="gap-1 text-slate-500 hover:text-slate-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Meeting Title */}
              <div className="space-y-1.5">
                <label htmlFor="meeting-title" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Meeting Title
                </label>
                <Input
                  id="meeting-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sprints Sync & UI Approvals"
                  required
                  disabled={isLoading}
                  className="w-full h-11"
                />
              </div>

              {/* Related Project */}
              <div className="space-y-1.5">
                <label htmlFor="meeting-project" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Related Project Context (Optional)
                </label>
                <select
                  id="meeting-project"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  disabled={isLoading}
                  className="flex h-11 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Project</option>
                  {projects.map((proj) => (
                    <option key={proj.id || proj._id} value={proj.id || proj._id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Meeting Transcript */}
              <div className="space-y-1.5">
                <label htmlFor="meeting-transcript" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Copy-Paste Meeting Transcript or Notes
                </label>
                <Textarea
                  id="meeting-transcript"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Paste chat logs, Zoom transcripts, or voice-to-text transcripts here..."
                  required
                  disabled={isLoading}
                  rows={8}
                  className="w-full text-xs font-mono"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 transition-all rounded-lg flex items-center justify-center gap-2 shadow-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                AI Summarizer Processing...
              </>
            ) : (
              <>
                <Sparkles className="h-4.5 w-4.5" />
                Process Summary & Action Items
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
