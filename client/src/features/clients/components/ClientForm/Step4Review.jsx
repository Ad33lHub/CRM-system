import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Star,
  Building2,
  Users,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function LabelValue({ label, value, className }) {
  if (!value) return null;
  return (
    <div className={cn('space-y-0.5', className)}>
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}

function formatLabel(value) {
  if (!value) return '—';
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Step4Review({ formData, onBack, onSubmit, isSubmitting, goToStep }) {
  const address = formData.billingAddress || {};
  const addressStr = [address.street, address.city, address.state, address.country, address.postalCode]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-6">
      {/* Company Info */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Company Information</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => goToStep(1)}>
            <Pencil className="h-3 w-3 mr-1" /> Edit
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <LabelValue label="Company Name" value={formData.companyName} />
          <LabelValue label="Industry" value={formatLabel(formData.industry)} />
          <LabelValue label="Company Size" value={formData.companySize || '—'} />
          <LabelValue label="Website" value={formData.website || '—'} />
          <LabelValue label="Source" value={formatLabel(formData.source)} />
          <LabelValue label="Status" value={formatLabel(formData.status)} />
          <LabelValue label="Currency" value={formData.currency} />
        </div>
      </Card>

      {/* Contacts */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">
              Contacts ({formData.contacts?.length || 0})
            </h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => goToStep(2)}>
            <Pencil className="h-3 w-3 mr-1" /> Edit
          </Button>
        </div>
        <div className="space-y-3">
          {formData.contacts?.map((c, i) => (
            <div
              key={i}
              className={cn(
                'p-3 rounded-lg border',
                c.isPrimary && 'border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/20'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{c.name}</span>
                {c.isPrimary && (
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 gap-1 text-[10px]">
                    <Star className="h-3 w-3" /> Primary
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {c.email && <span>{c.email}</span>}
                {c.phone && <span>{c.phone}</span>}
                {c.designation && <span>{c.designation}</span>}
                {c.department && <span>{c.department}</span>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Billing & Details */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Billing & Details</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => goToStep(3)}>
            <Pencil className="h-3 w-3 mr-1" /> Edit
          </Button>
        </div>
        <div className="space-y-4">
          <LabelValue label="Billing Address" value={addressStr || '—'} />

          {formData.tags?.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {formData.tags.map((t) => (
                  <Badge key={t} variant="outline" className="text-xs">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <LabelValue label="Notes" value={formData.notes || '—'} />
          <LabelValue
            label="Next Follow-Up"
            value={
              formData.nextFollowUpAt
                ? new Date(formData.nextFollowUpAt).toLocaleDateString()
                : '—'
            }
          />
        </div>
      </Card>

      {/* Footer */}
      <Separator />
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...
            </>
          ) : (
            'Create Client'
          )}
        </Button>
      </div>
    </div>
  );
}
