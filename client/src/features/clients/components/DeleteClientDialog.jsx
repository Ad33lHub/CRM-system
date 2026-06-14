import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useDeleteClientMutation } from '@/services/clientsApi';
import { toast } from 'sonner';

export default function DeleteClientDialog({ client, open, onOpenChange, onSuccess }) {
  const [reason, setReason] = useState('');
  const [deleteClient, { isLoading }] = useDeleteClientMutation();

  const handleDelete = async () => {
    try {
      const result = await deleteClient({
        id: client._id || client.id,
        reason,
      }).unwrap();

      const deadline = result?.data?.restoreDeadline
        ? new Date(result.data.restoreDeadline).toLocaleDateString()
        : '30 days';

      toast.success(`Client archived. Restore available until ${deadline}`);
      setReason('');
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to archive client');
    }
  };

  const isValid = reason.trim().length >= 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Archive Client</DialogTitle>
              <DialogDescription className="mt-1">
                Are you sure you want to archive{' '}
                <span className="font-semibold text-foreground">
                  {client?.companyName}
                </span>
                ? This client will be hidden from all views but can be restored
                within 30 days.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="deleteReason">
              Reason for archiving <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="deleteReason"
              placeholder="Reason for archiving (min 10 characters)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {reason.length} / 500
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isValid || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Archiving...
              </>
            ) : (
              'Archive Client'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
