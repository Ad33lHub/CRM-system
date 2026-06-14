import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight, X as XIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const step1Schema = z.object({
  companyName: z.string().trim().min(2, 'At least 2 characters').max(100),
  industry: z.enum([
    'technology', 'finance', 'healthcare', 'education',
    'retail', 'real_estate', 'manufacturing', 'media',
    'consulting', 'other',
  ]),
  companySize: z.string().optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  source: z.enum([
    'referral', 'linkedin', 'website', 'cold_outreach',
    'upwork', 'fiverr', 'google_ads', 'event', 'other',
  ]),
  status: z.enum(['lead', 'active', 'inactive', 'churned']).default('lead'),
  currency: z.string().max(3).default('PKR'),
});

const INDUSTRIES = [
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'media', label: 'Media' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'other', label: 'Other' },
];

const SOURCES = [
  { value: 'referral', label: 'Referral' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'website', label: 'Website' },
  { value: 'cold_outreach', label: 'Cold Outreach' },
  { value: 'upwork', label: 'Upwork' },
  { value: 'fiverr', label: 'Fiverr' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' },
];

const SIZES = [
  { value: '1-10', label: '1–10' },
  { value: '11-50', label: '11–50' },
  { value: '51-200', label: '51–200' },
  { value: '201-500', label: '201–500' },
  { value: '500+', label: '500+' },
];

const CURRENCIES = [
  { value: 'PKR', label: 'PKR' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
];

const STATUSES = [
  { value: 'lead', label: 'Lead' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'churned', label: 'Churned' },
];

export default function Step1Company({ formData, onNext }) {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      companyName: formData.companyName || '',
      industry: formData.industry || 'technology',
      companySize: formData.companySize || '',
      website: formData.website || '',
      source: formData.source || 'other',
      status: formData.status || 'lead',
      currency: formData.currency || 'PKR',
    },
  });

  const onSubmit = (data) => onNext(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Company Name */}
        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="companyName">
            Company Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="companyName"
            placeholder="e.g. Verixsoft"
            {...register('companyName')}
            className={errors.companyName ? 'border-destructive' : ''}
          />
          {errors.companyName && (
            <p className="text-xs text-destructive">{errors.companyName.message}</p>
          )}
        </div>

        {/* Industry */}
        <div className="space-y-1.5">
          <Label>
            Industry <span className="text-destructive">*</span>
          </Label>
          <Select
            value={watch('industry')}
            onValueChange={(v) => setValue('industry', v, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((i) => (
                <SelectItem key={i.value} value={i.value}>
                  {i.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.industry && (
            <p className="text-xs text-destructive">{errors.industry.message}</p>
          )}
        </div>

        {/* Company Size */}
        <div className="space-y-1.5">
          <Label>Company Size</Label>
          <Select
            value={watch('companySize') || undefined}
            onValueChange={(v) => setValue('companySize', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              {SIZES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Website */}
        <div className="space-y-1.5">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            placeholder="https://example.com"
            {...register('website')}
            className={errors.website ? 'border-destructive' : ''}
          />
          {errors.website && (
            <p className="text-xs text-destructive">{errors.website.message}</p>
          )}
        </div>

        {/* Source */}
        <div className="space-y-1.5">
          <Label>
            Source <span className="text-destructive">*</span>
          </Label>
          <Select
            value={watch('source')}
            onValueChange={(v) => setValue('source', v, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              {SOURCES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={watch('status')}
            onValueChange={(v) => setValue('status', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Currency */}
        <div className="space-y-1.5">
          <Label>Currency</Label>
          <Select
            value={watch('currency')}
            onValueChange={(v) => setValue('currency', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button type="button" variant="ghost" onClick={() => navigate('/clients')}>
          <XIcon className="h-4 w-4 mr-1" /> Cancel
        </Button>
        <Button type="submit">
          Next: Add Contacts <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </form>
  );
}
