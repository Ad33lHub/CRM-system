import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TagInput } from '@/components/ui/tag-input';
import { ChevronDown, Plus, Trash2, Loader2, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUpdateClientMutation } from '@/services/clientsApi';
import { toast } from 'sonner';

const INDUSTRIES = [
  'technology', 'finance', 'healthcare', 'education', 'retail',
  'real_estate', 'manufacturing', 'media', 'consulting', 'other',
];
const SOURCES = [
  'referral', 'linkedin', 'website', 'cold_outreach', 'upwork',
  'fiverr', 'google_ads', 'event', 'other',
];
const SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];
const CURRENCIES = ['PKR', 'USD', 'EUR', 'GBP'];

const titleCase = (s) =>
  (s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold"
      >
        {title}
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="space-y-4 border-t p-4">{children}</div>}
    </div>
  );
}

function buildInitialForm(client) {
  return {
    companyName: client?.companyName || '',
    industry: client?.industry || 'other',
    companySize: client?.companySize || '',
    website: client?.website || '',
    source: client?.source || 'other',
    currency: client?.currency || 'PKR',
    contacts: (client?.contacts || []).map((c) => ({
      _id: c._id || c.id,
      name: c.name || '',
      email: c.email || '',
      phone: c.phone || '',
      designation: c.designation || '',
      department: c.department || '',
      isPrimary: !!c.isPrimary,
      notes: c.notes || '',
    })),
    billingAddress: {
      street: client?.billingAddress?.street || '',
      city: client?.billingAddress?.city || '',
      state: client?.billingAddress?.state || '',
      country: client?.billingAddress?.country || 'Pakistan',
      postalCode: client?.billingAddress?.postalCode || '',
    },
    tags: client?.tags || [],
    notes: client?.notes || '',
    nextFollowUpAt: client?.nextFollowUpAt
      ? new Date(client.nextFollowUpAt).toISOString().split('T')[0]
      : '',
  };
}

export default function EditClientSheet({ client, open, onOpenChange, onSuccess }) {
  const [form, setForm] = useState(() => buildInitialForm(client));
  const [updateClient, { isLoading }] = useUpdateClientMutation();

  useEffect(() => {
    if (open) setForm(buildInitialForm(client));
  }, [open, client]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const setAddress = (field, value) =>
    setForm((f) => ({ ...f, billingAddress: { ...f.billingAddress, [field]: value } }));

  const setContact = (idx, field, value) =>
    setForm((f) => ({
      ...f,
      contacts: f.contacts.map((c, i) => (i === idx ? { ...c, [field]: value } : c)),
    }));

  const setPrimary = (idx) =>
    setForm((f) => ({
      ...f,
      contacts: f.contacts.map((c, i) => ({ ...c, isPrimary: i === idx })),
    }));

  const addContact = () =>
    setForm((f) => ({
      ...f,
      contacts: [
        ...f.contacts,
        { name: '', email: '', phone: '', designation: '', department: '', isPrimary: false, notes: '' },
      ],
    }));

  const removeContact = (idx) =>
    setForm((f) => ({ ...f, contacts: f.contacts.filter((_, i) => i !== idx) }));

  const handleSave = async () => {
    if (!form.companyName.trim() || form.companyName.trim().length < 2) {
      toast.error('Company name must be at least 2 characters');
      return;
    }
    if (form.contacts.length === 0 || !form.contacts.some((c) => c.name.trim())) {
      toast.error('At least one named contact is required');
      return;
    }
    if (!form.contacts.some((c) => c.isPrimary)) {
      form.contacts[0].isPrimary = true;
    }

    const payload = {
      id: client._id || client.id,
      companyName: form.companyName.trim(),
      industry: form.industry,
      source: form.source,
      currency: form.currency,
      contacts: form.contacts,
      billingAddress: form.billingAddress,
      tags: form.tags,
      notes: form.notes || '',
    };
    if (form.companySize) payload.companySize = form.companySize;
    if (form.website) payload.website = form.website;
    if (form.nextFollowUpAt) payload.nextFollowUpAt = form.nextFollowUpAt;

    try {
      await updateClient(payload).unwrap();
      toast.success('Client updated');
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const fields = err?.data?.error?.fields;
      if (fields) {
        toast.error(`Validation failed: ${Object.keys(fields).join(', ')}`);
      } else {
        toast.error(err?.data?.message || 'Failed to update client');
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[600px]">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>Edit Client</SheetTitle>
          <SheetDescription>Update company information, contacts, and billing details.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {/* Company Info */}
          <Section title="Company Info" defaultOpen>
            <div className="space-y-1.5">
              <Label htmlFor="edit-companyName">
                Company Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-companyName"
                value={form.companyName}
                onChange={(e) => set('companyName', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Industry</Label>
                <Select value={form.industry} onValueChange={(v) => set('industry', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((i) => (
                      <SelectItem key={i} value={i}>{titleCase(i)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Company Size</Label>
                <Select value={form.companySize || undefined} onValueChange={(v) => set('companySize', v)}>
                  <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                  <SelectContent>
                    {SIZES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-website">Website</Label>
                <Input
                  id="edit-website"
                  placeholder="https://example.com"
                  value={form.website}
                  onChange={(e) => set('website', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Source</Label>
                <Select value={form.source} onValueChange={(v) => set('source', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SOURCES.map((s) => (
                      <SelectItem key={s} value={s}>{titleCase(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={(v) => set('currency', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Section>

          {/* Contacts */}
          <Section title={`Contacts (${form.contacts.length})`}>
            <div className="space-y-4">
              {form.contacts.map((contact, idx) => (
                <div key={contact._id || idx} className="space-y-3 rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setPrimary(idx)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs',
                        contact.isPrimary
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent'
                      )}
                    >
                      <Award className="h-3 w-3" />
                      {contact.isPrimary ? 'Primary' : 'Set primary'}
                    </button>
                    {form.contacts.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => removeContact(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1.5">
                      <Label>Name <span className="text-destructive">*</span></Label>
                      <Input value={contact.name} onChange={(e) => setContact(idx, 'name', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <Input type="email" value={contact.email} onChange={(e) => setContact(idx, 'email', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phone</Label>
                      <Input value={contact.phone} onChange={(e) => setContact(idx, 'phone', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Designation</Label>
                      <Input value={contact.designation} onChange={(e) => setContact(idx, 'designation', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Department</Label>
                      <Input value={contact.department} onChange={(e) => setContact(idx, 'department', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addContact}>
                <Plus className="h-4 w-4" /> Add Contact
              </Button>
            </div>
          </Section>

          {/* Billing */}
          <Section title="Billing Address">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Street</Label>
                <Input value={form.billingAddress.street} onChange={(e) => setAddress('street', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input value={form.billingAddress.city} onChange={(e) => setAddress('city', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>State</Label>
                <Input value={form.billingAddress.state} onChange={(e) => setAddress('state', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Country</Label>
                <Input value={form.billingAddress.country} onChange={(e) => setAddress('country', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Postal Code</Label>
                <Input value={form.billingAddress.postalCode} onChange={(e) => setAddress('postalCode', e.target.value)} />
              </div>
            </div>
          </Section>

          {/* Tags & Details */}
          <Section title="Tags & Details">
            <div className="space-y-1.5">
              <Label>Tags</Label>
              <TagInput value={form.tags} onChange={(tags) => set('tags', tags)} maxTags={10} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-followup">Next Follow-up</Label>
              <Input
                id="edit-followup"
                type="date"
                value={form.nextFollowUpAt}
                onChange={(e) => set('nextFollowUpAt', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-notes">Internal Notes</Label>
              <Textarea
                id="edit-notes"
                rows={3}
                maxLength={3000}
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
              />
            </div>
          </Section>
        </div>

        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
