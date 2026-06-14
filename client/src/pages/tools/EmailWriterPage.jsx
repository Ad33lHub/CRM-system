import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/page-header.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Textarea } from '../../components/ui/textarea.jsx';
import { Sparkles, Loader2, Copy, Check, Mail } from 'lucide-react';
import { useWriteEmailMutation } from '../../services/toolsApi.js';
import { toast } from 'sonner';

export default function EmailWriterPage() {
  const [recipient, setRecipient] = useState('');
  const [tone, setTone] = useState('professional');
  const [points, setPoints] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const [writeEmailApi, { isLoading }] = useWriteEmailMutation();

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!recipient.trim()) {
      toast.error('Recipient is required');
      return;
    }
    if (!points.trim()) {
      toast.error('Please enter the key points to cover');
      return;
    }

    try {
      const result = await writeEmailApi({
        recipient,
        tone,
        points
      }).unwrap();

      toast.success('Email generated successfully!');
      setGeneratedEmail(result.data?.email || result.data?.emailBody || (typeof result.data === 'string' ? result.data : ''));
      setIsCopied(false);
    } catch (err) {
      toast.error(err.data?.message || 'Failed to generate email');
    }
  };

  const handleCopy = () => {
    if (!generatedEmail) return;
    navigator.clipboard.writeText(generatedEmail);
    setIsCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Business Email Writer"
        subtitle="Compose professional, polished customer communication templates instantly"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-500" />
              <span>Email Blueprint Parameters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              
              {/* Recipient */}
              <div className="space-y-1.5">
                <label htmlFor="email-recip" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Target Recipient / Context
                </label>
                <Input
                  id="email-recip"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="e.g. Client (Approve Design), Team (Sync Reminder)"
                  required
                  disabled={isLoading}
                  className="w-full h-11"
                />
              </div>

              {/* Tone */}
              <div className="space-y-1.5">
                <label htmlFor="email-tone" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Communication Tone Style
                </label>
                <select
                  id="email-tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  disabled={isLoading}
                  className="flex h-11 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="professional">Professional</option>
                  <option value="formal">Formal & Corporate</option>
                  <option value="casual">Casual & Friendly</option>
                  <option value="persuasive">Persuasive Pitch</option>
                </select>
              </div>

              {/* Key Points */}
              <div className="space-y-1.5">
                <label htmlFor="email-points" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Key Points / Message Core (One per line)
                </label>
                <Textarea
                  id="email-points"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  placeholder="e.g.&#10;- Request feedback on mobile app UI v2&#10;- Emphasize milestone deadline is Wednesday&#10;- Offer a call to review details"
                  required
                  disabled={isLoading}
                  rows={5}
                />
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
                    AI Copywriter Composing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4.5 w-4.5" />
                    Write Professional Email Draft
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Output Area */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-md flex flex-col max-h-[70vh]">
          <CardHeader className="border-b py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Mail className="h-4.5 w-4.5 text-slate-400" />
              <span>Generated Draft Result</span>
            </CardTitle>
            {generatedEmail && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopy}
                className="gap-1.5 h-8 text-xs font-bold"
              >
                {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {isCopied ? 'Copied!' : 'Copy Text'}
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-6 overflow-y-auto flex-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {generatedEmail ? (
              <pre className="whitespace-pre-wrap font-sans text-sm bg-slate-50 dark:bg-slate-950/20 p-5 rounded-lg border border-slate-100 dark:border-slate-800 leading-relaxed">
                {generatedEmail}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center py-12">
                <Sparkles className="h-10 w-10 text-slate-300 mb-3" />
                <p>Fill out the email parameters and generate your customized email pitch.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
