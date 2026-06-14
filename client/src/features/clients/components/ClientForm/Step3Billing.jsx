import { useForm } from 'react-hook-form';
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
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useGetClientTagsQuery } from '@/services/clientsApi';

const COUNTRIES = [
  'Pakistan', 'United States', 'United Kingdom', 'Canada',
  'Australia', 'India', 'Germany', 'UAE', 'Saudi Arabia', 'Other',
];

export default function Step3Billing({ formData, onNext, onBack }) {
  const { data: tagsData } = useGetClientTagsQuery();
  const existingTags = tagsData?.data || [];

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      billingAddress: formData.billingAddress || {
        street: '',
        city: '',
        state: '',
        country: 'Pakistan',
        postalCode: '',
      },
      tags: formData.tags || [],
      notes: formData.notes || '',
      assignedTo: formData.assignedTo || '',
      nextFollowUpAt: formData.nextFollowUpAt || '',
    },
  });

  const tags = watch('tags');
  const notes = watch('notes');

  const onSubmit = (data) => onNext(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Billing Address */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Billing Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              placeholder="123 Main St"
              {...register('billingAddress.street')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">City</Label>
            <Input id="city" placeholder="Lahore" {...register('billingAddress.city')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="state">State / Province</Label>
            <Input id="state" placeholder="Punjab" {...register('billingAddress.state')} />
          </div>
          <div className="space-y-1.5">
            <Label>Country</Label>
            <Select
              value={watch('billingAddress.country') || 'Pakistan'}
              onValueChange={(v) => setValue('billingAddress.country', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="postalCode">Postal Code</Label>
            <Input
              id="postalCode"
              placeholder="54000"
              {...register('billingAddress.postalCode')}
            />
          </div>
        </div>
      </div>

      {/* Additional Details */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Additional Details</h3>
        <div className="space-y-4">
          {/* Tags */}
          <div className="space-y-1.5">
            <Label>Tags</Label>
            <TagInput
              value={tags}
              onChange={(v) => setValue('tags', v)}
              placeholder="Type a tag and press Enter"
              maxTags={10}
              suggestions={existingTags}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this client..."
              rows={4}
              maxLength={3000}
              {...register('notes')}
            />
            <p className="text-xs text-muted-foreground text-right">
              {(notes || '').length} / 3000
            </p>
          </div>

          {/* Follow-up Date */}
          <div className="space-y-1.5">
            <Label htmlFor="nextFollowUpAt">Next Follow-Up Date</Label>
            <Input
              id="nextFollowUpAt"
              type="date"
              {...register('nextFollowUpAt')}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button type="submit">
          Next: Review <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </form>
  );
}
