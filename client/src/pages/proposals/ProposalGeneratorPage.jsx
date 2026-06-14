import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/page-header.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Textarea } from '../../components/ui/textarea.jsx';
import { Sparkles, Loader2, FileText, CheckCircle2, FileCheck } from 'lucide-react';
import { useCreateProposalMutation } from '../../services/proposalsApi.js';
import { useGetClientsQuery } from '../../services/clientsApi.js';
import { toast } from 'sonner';

export default function ProposalGeneratorPage() {
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState(5000);
  const [timeline, setTimeline] = useState('3 months');
  
  const [generatedBrief, setGeneratedBrief] = useState('');

  const { data: clientsData } = useGetClientsQuery();
  const clients = clientsData?.data || [];

  const [createProposalApi, { isLoading }] = useCreateProposalMutation();

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!clientId) {
      toast.error('Please select a client');
      return;
    }

    try {
      const result = await createProposalApi({
        title,
        client: clientId,
        description,
        budget: Number(budget),
        timeline
      }).unwrap();

      toast.success('AI Proposal brief generated successfully!');
      setGeneratedBrief(result.data.generatedBrief);
    } catch (err) {
      toast.error(err.data?.message || 'Failed to generate proposal');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Proposal & Contract Builder"
        subtitle="Generate client pitches, budget terms, and timeline milestones automatically"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Form */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-blue-500" />
              <span>Proposal Inputs</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              
              {/* Proposal Title */}
              <div className="space-y-1.5">
                <label htmlFor="prop-title" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Proposal Title
                </label>
                <Input
                  id="prop-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mobile Banking App Development"
                  required
                  disabled={isLoading}
                  className="w-full h-10.5"
                />
              </div>

              {/* Target Client */}
              <div className="space-y-1.5">
                <label htmlFor="prop-client" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Select Client Account
                </label>
                <select
                  id="prop-client"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                  disabled={isLoading}
                  className="flex h-10.5 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Client</option>
                  {clients.map((c) => (
                    <option key={c.id || c._id} value={c.id || c._id}>
                      {c.companyName} ({c.contactPerson})
                    </option>
                  ))}
                </select>
              </div>

              {/* Project brief / description */}
              <div className="space-y-1.5">
                <label htmlFor="prop-desc" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Scope Requirements description
                </label>
                <Textarea
                  id="prop-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize project goals, integrations, and deliverables..."
                  disabled={isLoading}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Budget */}
                <div className="space-y-1.5">
                  <label htmlFor="prop-budget" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Budget (USD)
                  </label>
                  <Input
                    id="prop-budget"
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="5000"
                    disabled={isLoading}
                    className="w-full h-10.5"
                  />
                </div>

                {/* Timeline */}
                <div className="space-y-1.5">
                  <label htmlFor="prop-timeline" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Timeline
                  </label>
                  <Input
                    id="prop-timeline"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    placeholder="3 months"
                    disabled={isLoading}
                    className="w-full h-10.5"
                  />
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 transition-all rounded-lg flex items-center justify-center gap-2 mt-4"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    AI Engine Drafting...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4.5 w-4.5" />
                    Generate AI Proposal Brief
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* AI generated preview */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-md flex flex-col max-h-[70vh]">
          <CardHeader className="border-b py-3 px-4">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-slate-400" />
              <span>AI Proposal Preview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 overflow-y-auto flex-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {generatedBrief ? (
              <div className="prose dark:prose-invert max-w-none space-y-4">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold mb-4">
                  <CheckCircle2 className="h-4.5 w-4.5" />
                  <span>Draft generated successfully!</span>
                </div>
                {/* Simulated Markdown renderer */}
                <div className="whitespace-pre-line font-serif text-sm bg-slate-50 dark:bg-slate-950/20 p-5 rounded-lg border border-slate-100 dark:border-slate-800">
                  {generatedBrief}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center py-12">
                <Sparkles className="h-10 w-10 text-slate-300 mb-3" />
                <p>Fill out the form and click &quot;Generate&quot; to create a structured proposal pitch.</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
