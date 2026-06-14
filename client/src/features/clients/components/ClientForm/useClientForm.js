import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateClientMutation } from '@/services/clientsApi';
import useAuth from '@/hooks/useAuth';
import { toast } from 'sonner';

const STEPS = [
  { key: 'company', label: 'Company Info' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'billing', label: 'Billing & Details' },
  { key: 'review', label: 'Review & Submit' },
];

const EMPTY_FORM = {
  companyName: '',
  industry: 'technology',
  companySize: '',
  website: '',
  source: 'other',
  status: 'lead',
  currency: 'PKR',
  contacts: [
    {
      name: '',
      email: '',
      phone: '',
      designation: '',
      department: '',
      isPrimary: true,
      notes: '',
    },
  ],
  billingAddress: {
    street: '',
    city: '',
    state: '',
    country: 'Pakistan',
    postalCode: '',
  },
  tags: [],
  notes: '',
  assignedTo: '',
  nextFollowUpAt: '',
};

export function useClientForm(initialData = null) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const draftKey = `client_draft_${user?.id || user?._id || 'anon'}`;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialData || EMPTY_FORM);
  const [isDirty, setIsDirty] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const saveTimer = useRef(null);

  const [createClient, { isLoading: isSubmitting }] = useCreateClientMutation();

  // Check for existing draft on mount
  useEffect(() => {
    if (initialData) return;
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw);
        const age = Date.now() - (draft._savedAt || 0);
        if (age < 24 * 60 * 60 * 1000) {
          setHasDraft(true);
        } else {
          localStorage.removeItem(draftKey);
        }
      }
    } catch {
      localStorage.removeItem(draftKey);
    }
  }, [draftKey, initialData]);

  // Auto-save draft (debounced)
  useEffect(() => {
    if (!isDirty) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({ ...formData, _savedAt: Date.now() })
        );
        toast.success('Draft saved', {
          duration: 1500,
          position: 'bottom-right',
          className: 'text-xs',
        });
      } catch {
        // Storage full — ignore
      }
    }, 1000);

    return () => clearTimeout(saveTimer.current);
  }, [formData, isDirty, draftKey]);

  const restoreDraft = useCallback(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw);
        delete draft._savedAt;
        setFormData((prev) => ({ ...prev, ...draft }));
        setDraftRestored(true);
        setHasDraft(false);
        toast.success('Draft restored');
      }
    } catch {
      toast.error('Failed to restore draft');
    }
  }, [draftKey]);

  const discardDraft = useCallback(() => {
    localStorage.removeItem(draftKey);
    setHasDraft(false);
  }, [draftKey]);

  const nextStep = useCallback(
    (stepData) => {
      setFormData((prev) => ({ ...prev, ...stepData }));
      setIsDirty(true);
      setCurrentStep((s) => Math.min(s + 1, STEPS.length));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  const prevStep = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goToStep = useCallback((n) => {
    setCurrentStep(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const submit = useCallback(async () => {
    try {
      // Clean up empty strings
      const payload = { ...formData };
      if (!payload.website) delete payload.website;
      if (!payload.assignedTo) delete payload.assignedTo;
      if (!payload.notes) delete payload.notes;
      if (!payload.companySize) delete payload.companySize;
      if (!payload.nextFollowUpAt) delete payload.nextFollowUpAt;

      // Ensure exactly one primary contact
      const hasPrimary = payload.contacts?.some((c) => c.isPrimary);
      if (!hasPrimary && payload.contacts?.length > 0) {
        payload.contacts[0].isPrimary = true;
      }

      const result = await createClient(payload).unwrap();

      localStorage.removeItem(draftKey);
      toast.success('Client created successfully!');

      const clientId = result?.data?._id || result?.data?.id;
      if (clientId) {
        navigate(`/clients/${clientId}`);
      } else {
        navigate('/clients');
      }
    } catch (err) {
      const message =
        err?.data?.message || err?.data?.error?.message || 'Failed to create client';
      toast.error(message);

      // Navigate to step with errors
      if (err?.data?.error?.fields) {
        const fields = Object.keys(err.data.error.fields);
        if (fields.some((f) => ['companyName', 'industry', 'source', 'status'].includes(f))) {
          goToStep(1);
        } else if (fields.some((f) => f.startsWith('contacts'))) {
          goToStep(2);
        } else {
          goToStep(3);
        }
      }
    }
  }, [formData, createClient, navigate, draftKey, goToStep]);

  return {
    currentStep,
    formData,
    setFormData,
    isDirty,
    hasDraft,
    draftRestored,
    isSubmitting,
    steps: STEPS,
    nextStep,
    prevStep,
    goToStep,
    submit,
    restoreDraft,
    discardDraft,
  };
}

export default useClientForm;
