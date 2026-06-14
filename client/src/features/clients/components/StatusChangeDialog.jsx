import { useState, useEffect } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { useUpdateClientMutation } from '@/services/clientsApi';
import {
  VALID_STATUS_TRANSITIONS,
  CLIENT_STATUS_LABELS,
  STATUS_REASON_PLACEHOLDERS,
} from '@/constants/clients';
import { toast } from 'sonner';

export default function StatusChangeDialog({ client, open, onOpenChange, onSuccess }) {
  const [targetStatus, setTargetStatus] = useState('');
  const [reason, setReason] = useState('');
  const [churnReason, setChurnReason] = useState('');
  const [updateClient, { isLoading }] = useUpdateClientMutation();

  // Reset when (re)opened
  useEffect(() => {
    if (open) {
      setTargetStatus('');
      setReason('');
      setChurnReason('');
    }
  }, [open]);

  const currentStatus = client?.status;
  const allowedStatuses = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  const isChurn = targetStatus === 'churned';

  const reasonValid = reason.trim().length >= 10;
  const churnValid = !isChurn || churnReason.trim().length >= 10;
  const isValid = targetStatus && reasonValid && churnValid;

  const handleSubmit = async () => {
    if (!isValid) return;
    try {
      await updateClient({
        id: client._id || client.id,
        status: targetStatus,
        statusChangeReason: reason.trim(),
        ...(isChurn ? { churnReason: churnReason.trim() } : {}),
      }).unwrap();

      toast.success(`Status updated to ${CLIENT_STATUS_LABELS[targetStatus]}`);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update status');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Client Status</DialogTitle>
          <DialogDescription>
            Transition the client to a new status. A reason is recorded in the status history.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current → New */}
          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Current</Label>
              <div>
                <StatusBadge status={currentStatus} dot />
              </div>
            </div>
            <ArrowRight className="mt-5 h-4 w-4 text-muted-foreground" />
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">New status</Label>
              <Select value={targetStatus} onValueChange={setTargetStatus}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {allowedStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {CLIENT_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {allowedStatuses.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No status transitions are available from the current status.
            </p>
          )}

          {/* Reason */}
          {targetStatus && (
            <div className="space-y-1.5">
              <Label htmlFor="statusReason">
                Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="statusReason"
                placeholder={STATUS_REASON_PLACEHOLDERS[targetStatus] || 'Reason for status change...'}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                minLength={10}
                maxLength={500}
              />
              <p className="text-right text-xs text-muted-foreground">{reason.length} / 500</p>
            </div>
          )}

          {/* Churn reason */}
          {isChurn && (
            <div className="space-y-1.5">
              <Label htmlFor="churnReason">
                Churn reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="churnReason"
                placeholder="Formal reason this client is churning (for the record)..."
                value={churnReason}
                onChange={(e) => setChurnReason(e.target.value)}
                rows={2}
                minLength={10}
                maxLength={500}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
