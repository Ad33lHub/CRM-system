import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/page-header.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Card, CardContent } from '../../components/ui/card.jsx';
import { useCreateProjectMutation } from '../../services/projectsApi.js';
import { useGetClientsQuery } from '../../services/clientsApi.js';
import { toast } from 'sonner';

export default function ProjectCreatePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Form States
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [client, setClient] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [estimatedBudget, setEstimatedBudget] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [priority, setPriority] = useState('medium');

  // Queries/Mutations
  const { data: clientsData } = useGetClientsQuery({ limit: 100 });
  const clientsList = clientsData?.data || [];
  const [createProject, { isLoading }] = useCreateProjectMutation();

  const handleNextStep = () => {
    if (step === 1 && !name) {
      toast.error('Project Name is required');
      return;
    }
    if (step === 2 && !client) {
      toast.error('Please associate a client');
      return;
    }
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!name || !client) {
      toast.error('Required fields are missing');
      return;
    }

    try {
      await createProject({
        name,
        description,
        client,
        startDate: startDate ? new Date(startDate) : undefined,
        deadline: deadline ? new Date(deadline) : undefined,
        budget: {
          estimated: Number(estimatedBudget) || 0,
          currency,
        },
        priority,
        status: 'draft',
      }).unwrap();

      toast.success('Project created successfully in Draft mode!');
      navigate('/projects');
    } catch (err) {
      toast.error(err.data?.message || 'Failed to create project');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Create Project"
        subtitle={`Step ${step} of 6 — ${
          step === 1 ? 'Project Metadata' :
          step === 2 ? 'Client Assignment' :
          step === 3 ? 'Target Timeline' :
          step === 4 ? 'Budget details' :
          step === 5 ? 'Priority & Settings' : 'Review & Finalize'
        }`}
        breadcrumbs={[
          { label: 'Projects', href: '/projects' },
          { label: 'Create wizard' }
        ]}
      />

      <Card className="border border-slate-200 dark:border-slate-800">
        <CardContent className="p-6">
          <form onSubmit={handleFormSubmit} className="space-y-6">
            
            {/* Step 1: Metadata */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="proj-name" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Project Name</label>
                  <Input
                    id="proj-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. CRM Integration Phase 2"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="proj-desc" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</label>
                  <textarea
                    id="proj-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details about the sprint items, scopes, and target results..."
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Client Selection */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="proj-client" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Associate Client</label>
                  <select
                    id="proj-client"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="">-- Select Client Profile --</option>
                    {clientsList.map((c) => (
                      <option key={c._id || c.id} value={c._id || c.id}>
                        {c.companyName} ({c.companyEmail})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Step 3: Timeline */}
            {step === 3 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="proj-start" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Start Date</label>
                  <Input
                    id="proj-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="proj-deadline" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Deadline Target</label>
                  <Input
                    id="proj-deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Budget */}
            {step === 4 && (
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label htmlFor="proj-budget" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimated Budget</label>
                  <Input
                    id="proj-budget"
                    type="number"
                    value={estimatedBudget}
                    onChange={(e) => setEstimatedBudget(e.target.value)}
                    placeholder="5000"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="proj-currency" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Currency</label>
                  <select
                    id="proj-currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="PKR">PKR (Rs.)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 5: Priority */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="proj-priority" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority Level</label>
                  <select
                    id="proj-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 6: Review & Finalize */}
            {step === 6 && (
              <div className="space-y-4">
                <h4 className="font-bold text-[#f8fafc] text-sm border-b border-[#1e293b] pb-2">Scaffold Review Summary</h4>
                <div className="grid grid-cols-2 gap-y-3 text-xs">
                  <div><span className="text-[#94a3b8]">Project Name:</span></div>
                  <div className="font-semibold text-[#f8fafc]">{name}</div>
                  <div><span className="text-[#94a3b8]">Associated Client ID:</span></div>
                  <div className="font-semibold truncate max-w-[200px] text-[#f8fafc]">{client}</div>
                  <div><span className="text-[#94a3b8]">Budget Estimate:</span></div>
                  <div className="font-semibold text-[#f8fafc]">{estimatedBudget || 0} {currency}</div>
                  <div><span className="text-[#94a3b8]">Priority:</span></div>
                  <div className="font-semibold capitalize text-[#f8fafc]">{priority}</div>
                  {startDate && (
                    <>
                      <div><span className="text-[#94a3b8]">Start Date:</span></div>
                      <div className="font-semibold text-[#f8fafc]">{new Date(startDate).toLocaleDateString()}</div>
                    </>
                  )}
                  {deadline && (
                    <>
                      <div><span className="text-[#94a3b8]">Target Deadline:</span></div>
                      <div className="font-semibold text-[#f8fafc]">{new Date(deadline).toLocaleDateString()}</div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between border-t pt-4 border-slate-100 dark:border-slate-800/80">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={handlePrevStep} disabled={isLoading}>
                  Previous
                </Button>
              ) : (
                <Button type="button" variant="ghost" onClick={() => navigate('/projects')}>
                  Cancel
                </Button>
              )}

              {step < 6 ? (
                <Button type="button" onClick={handleNextStep}>
                  Next Step
                </Button>
              ) : (
                <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                  {isLoading ? 'Creating project...' : 'Create Project'}
                </Button>
              )}
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}
