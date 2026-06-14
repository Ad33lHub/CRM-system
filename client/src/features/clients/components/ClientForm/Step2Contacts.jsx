import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const contactSchema = z.object({
  contacts: z
    .array(
      z.object({
        name: z.string().trim().min(2, 'Name is required').max(100),
        email: z.string().email('Invalid email').optional().or(z.literal('')),
        phone: z.string().max(20).optional().or(z.literal('')),
        designation: z.string().max(100).optional().or(z.literal('')),
        department: z.string().max(100).optional().or(z.literal('')),
        isPrimary: z.boolean().default(false),
        notes: z.string().max(500).optional().or(z.literal('')),
      })
    )
    .min(1, 'At least one contact is required')
    .max(20, 'Maximum 20 contacts')
    .refine((contacts) => contacts.filter((c) => c.isPrimary).length === 1, {
      message: 'Exactly one contact must be primary',
    }),
});

export default function Step2Contacts({ formData, onNext, onBack }) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      contacts:
        formData.contacts?.length > 0
          ? formData.contacts
          : [
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
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'contacts',
  });

  const contacts = watch('contacts');

  const handleSetPrimary = (index) => {
    contacts.forEach((_, i) => {
      setValue(`contacts.${i}.isPrimary`, i === index);
    });
  };

  const handleRemove = (index) => {
    if (fields.length <= 1) return;
    const wasPrimary = contacts[index]?.isPrimary;
    remove(index);
    if (wasPrimary) {
      // Auto-promote next contact
      setTimeout(() => setValue('contacts.0.isPrimary', true), 0);
    }
  };

  const onSubmit = (data) => onNext(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">
          {fields.length} contact{fields.length !== 1 ? 's' : ''} added
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              name: '',
              email: '',
              phone: '',
              designation: '',
              department: '',
              isPrimary: false,
              notes: '',
            })
          }
          disabled={fields.length >= 20}
        >
          <Plus className="h-4 w-4 mr-1" /> Add Contact
        </Button>
      </div>

      {/* Root-level error */}
      {errors.contacts?.root && (
        <p className="text-sm text-destructive">{errors.contacts.root.message}</p>
      )}
      {errors.contacts?.message && (
        <p className="text-sm text-destructive">{errors.contacts.message}</p>
      )}

      <div className="space-y-4">
        {fields.map((field, index) => {
          const isPrimary = contacts?.[index]?.isPrimary;

          return (
            <Card
              key={field.id}
              className={cn(
                'p-4 border transition-colors',
                isPrimary && 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    Contact {index + 1}
                  </span>
                  {isPrimary && (
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 gap-1">
                      <Star className="h-3 w-3" /> Primary
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {!isPrimary && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetPrimary(index)}
                      className="text-xs text-amber-600 hover:text-amber-700"
                    >
                      <Star className="h-3 w-3 mr-1" /> Set Primary
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(index)}
                    disabled={fields.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="John Doe"
                    {...register(`contacts.${index}.name`)}
                    className={errors.contacts?.[index]?.name ? 'border-destructive' : ''}
                  />
                  {errors.contacts?.[index]?.name && (
                    <p className="text-xs text-destructive">
                      {errors.contacts[index].name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    {...register(`contacts.${index}.email`)}
                    className={errors.contacts?.[index]?.email ? 'border-destructive' : ''}
                  />
                  {errors.contacts?.[index]?.email && (
                    <p className="text-xs text-destructive">
                      {errors.contacts[index].email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    placeholder="+92 300 1234567"
                    {...register(`contacts.${index}.phone`)}
                  />
                </div>

                <div className="space-y-1">
                  <Label>Designation</Label>
                  <Input
                    placeholder="CEO, CTO, etc."
                    {...register(`contacts.${index}.designation`)}
                  />
                </div>

                <div className="space-y-1">
                  <Label>Department</Label>
                  <Input
                    placeholder="Engineering, Sales, etc."
                    {...register(`contacts.${index}.department`)}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button type="submit">
          Next: Billing Info <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </form>
  );
}
