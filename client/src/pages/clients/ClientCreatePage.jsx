import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FileText, X } from 'lucide-react';
import StepIndicator from '@/features/clients/components/ClientForm/StepIndicator';
import Step1Company from '@/features/clients/components/ClientForm/Step1Company';
import Step2Contacts from '@/features/clients/components/ClientForm/Step2Contacts';
import Step3Billing from '@/features/clients/components/ClientForm/Step3Billing';
import Step4Review from '@/features/clients/components/ClientForm/Step4Review';
import { useClientForm } from '@/features/clients/components/ClientForm/useClientForm';

export default function ClientCreatePage() {
  const {
    currentStep,
    formData,
    steps,
    hasDraft,
    isSubmitting,
    nextStep,
    prevStep,
    goToStep,
    submit,
    restoreDraft,
    discardDraft,
  } = useClientForm();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Add New Client"
        breadcrumbs={[
          { label: 'Clients', href: '/clients' },
          { label: 'Add New Client' },
        ]}
      />

      {/* Draft Restore Banner */}
      {hasDraft && (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
          <FileText className="h-4 w-4 text-blue-600" />
          <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm">
              You have an unsaved draft. Would you like to restore it?
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={restoreDraft}>
                Restore
              </Button>
              <Button size="sm" variant="ghost" onClick={discardDraft}>
                <X className="h-4 w-4 mr-1" /> Discard
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <StepIndicator steps={steps} currentStep={currentStep} onStepClick={goToStep} />

      <Card className="p-6">
        {currentStep === 1 && (
          <Step1Company formData={formData} onNext={nextStep} />
        )}
        {currentStep === 2 && (
          <Step2Contacts formData={formData} onNext={nextStep} onBack={prevStep} />
        )}
        {currentStep === 3 && (
          <Step3Billing formData={formData} onNext={nextStep} onBack={prevStep} />
        )}
        {currentStep === 4 && (
          <Step4Review
            formData={formData}
            onBack={prevStep}
            onSubmit={submit}
            isSubmitting={isSubmitting}
            goToStep={goToStep}
          />
        )}
      </Card>
    </div>
  );
}
