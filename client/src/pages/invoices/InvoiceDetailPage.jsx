import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/page-header.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Input } from '../../components/ui/input.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog.jsx';
import {
  Loader2,
  ArrowLeft,
  Send,
  Download,
  Banknote,
  Ban,
  FileText,
  Upload,
} from 'lucide-react';
import {
  useGetInvoiceByIdQuery,
  useSendInvoiceMutation,
  useRecordPaymentMutation,
  useVoidInvoiceMutation,
  useLazyGetInvoicePdfQuery,
} from '../../services/invoicesApi.js';
import useAuth from '../../hooks/useAuth.js';
import AttachmentPreviewModal from '../../components/common/AttachmentPreviewModal.jsx';
import { toast } from 'sonner';

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'jazzcash', label: 'JazzCash' },
  { value: 'easypaisa', label: 'EasyPaisa' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'other', label: 'Other' },
];

const getStatusStyle = (status) => {
  switch (status) {
    case 'paid':
      return { background: 'rgba(34, 197, 94, 0.12)', color: '#16a34a' };
    case 'partially_paid':
      return { background: 'rgba(168, 85, 247, 0.12)', color: '#9333ea' };
    case 'sent':
      return { background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' };
    case 'overdue':
      return { background: 'rgba(248, 113, 113, 0.12)', color: '#dc2626' };
    case 'void':
      return { background: 'rgba(148, 163, 184, 0.12)', color: '#64748b' };
    default:
      return { background: 'rgba(148, 163, 184, 0.12)', color: '#475569' };
  }
};

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, accessToken } = useAuth();

  // Dialog states
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Payment form
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('bank_transfer');
  const [payNotes, setPayNotes] = useState('');
  const [uploadedReceipt, setUploadedReceipt] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [voidReason, setVoidReason] = useState('');

  // Queries & Mutations
  const { data: invoiceData, isLoading } = useGetInvoiceByIdQuery(id);
  const [sendInvoice, { isLoading: isSending }] = useSendInvoiceMutation();
  const [recordPayment, { isLoading: isPaying }] = useRecordPaymentMutation();
  const [voidInvoice, { isLoading: isVoiding }] = useVoidInvoiceMutation();
  const [downloadPdf, { isFetching: isDownloading }] = useLazyGetInvoicePdfQuery();

  const invoice = invoiceData?.data || invoiceData;

  if (isLoading) {
    return <div className="text-center py-12 text-slate-400">Loading invoice details...</div>;
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold text-rose-500">Invoice Not Found</h3>
        <Button onClick={() => navigate('/invoices')} className="mt-4">
          Back to List
        </Button>
      </div>
    );
  }

  const currency = invoice.currency || 'PKR';
  const money = (n) => `${currency} ${Number(n || 0).toLocaleString()}`;
  const amountDue =
    invoice.amountDue ?? Math.max(0, (invoice.total || 0) - (invoice.paidAmount || 0));
  const primaryContact =
    (invoice.client?.contacts || []).find((c) => c.isPrimary) ||
    invoice.client?.contacts?.[0] ||
    {};

  const isManager = ['super_admin', 'admin', 'manager'].includes(role);
  const canSend = isManager && ['draft', 'overdue'].includes(invoice.status);
  const canPay = isManager && ['sent', 'partially_paid', 'overdue'].includes(invoice.status);
  const canVoid = isManager && !['paid', 'void'].includes(invoice.status);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', 'invoice');
    formData.append('entityId', id);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setUploadedReceipt({
          name: data.fileName,
          url: data.url,
          publicId: data.publicId,
          size: data.size,
        });
        toast.success('Receipt uploaded');
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch (err) {
      toast.error('Error uploading receipt');
    } finally {
      setIsUploading(false);
    }
  };

  const openPayDialog = () => {
    setPayAmount(String(amountDue || ''));
    setPayMethod(invoice.paymentMethod || 'bank_transfer');
    setPayNotes('');
    setUploadedReceipt(null);
    setPayDialogOpen(true);
  };

  const handleSend = async () => {
    try {
      const res = await sendInvoice(id).unwrap();
      toast.success(res.message || 'Invoice sent to client');
    } catch (err) {
      toast.error(err.data?.message || 'Failed to send invoice');
    }
  };

  const handleRecordPayment = async () => {
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid payment amount');
      return;
    }
    try {
      await recordPayment({
        id,
        data: {
          amount,
          paymentMethod: payMethod,
          paymentNotes: payNotes.trim() || undefined,
          paymentProof: uploadedReceipt || undefined,
        },
      }).unwrap();
      toast.success('Payment recorded');
      setPayDialogOpen(false);
    } catch (err) {
      toast.error(err.data?.message || 'Failed to record payment');
    }
  };

  const handleVoid = async () => {
    if (voidReason.trim().length < 5) {
      toast.error('Please provide a reason (at least 5 characters)');
      return;
    }
    try {
      await voidInvoice({ id, reason: voidReason.trim() }).unwrap();
      toast.success('Invoice voided');
      setVoidDialogOpen(false);
    } catch (err) {
      toast.error(err.data?.message || 'Failed to void invoice');
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const blob = await downloadPdf(id).unwrap();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to generate PDF');
    }
  };

  const openPreview = (fileObj) => {
    setPreviewFile({
      name: fileObj.name || 'Receipt',
      url: fileObj.url || fileObj.cloudinaryUrl,
      size: fileObj.size,
      mimeType: fileObj.name?.endsWith('.pdf') ? 'application/pdf' : 'image/png',
    });
    setPreviewOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoice Details"
        subtitle={`Invoice No: #${invoice.invoiceNumber}`}
        breadcrumbs={[{ label: 'Invoices', href: '/invoices' }, { label: 'Invoice Detail' }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/invoices')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button variant="outline" onClick={handleDownloadPdf} disabled={isDownloading} className="gap-2">
              {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              PDF
            </Button>
            {canSend && (
              <Button onClick={handleSend} disabled={isSending} className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2">
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send Invoice
              </Button>
            )}
            {canPay && (
              <Button onClick={openPayDialog} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
                <Banknote className="h-4 w-4" />
                Record Payment
              </Button>
            )}
            {canVoid && (
              <Button variant="outline" onClick={() => setVoidDialogOpen(true)} className="gap-2 text-rose-600 border-rose-200 hover:bg-rose-50">
                <Ban className="h-4 w-4" />
                Void
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Invoice Visualizer */}
        <Card className="lg:col-span-2 border bg-white dark:bg-slate-900/50 shadow-md p-6">
          {/* Header */}
          <div className="flex justify-between items-start pb-4 border-b">
            <div>
              <img src="https://verixsoft.com/icon.png" alt="Verixsoft Logo" className="h-10 w-auto rounded mb-2" onError={(e) => (e.target.src = 'https://placehold.co/80x80/3b82f6/ffffff?text=V')} />
              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Verixsoft Solutions</h4>
              <p className="text-[10px] text-slate-400">123 Tech Square, Islamabad</p>
            </div>
            <div className="text-right">
              <h3 className="text-xl font-extrabold text-blue-600">INVOICE</h3>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">#{invoice.invoiceNumber}</p>
              <p className="text-[10px] text-slate-400">Due: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '--'}</p>
              <Badge style={{ borderRadius: '6px', padding: '2px 10px', fontSize: '11px', fontWeight: 600, border: 'none', marginTop: '8px', ...getStatusStyle(invoice.status) }} className="capitalize">
                {invoice.status?.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          {/* Client Details */}
          <div className="grid grid-cols-2 gap-4 py-4 text-xs font-semibold text-slate-500">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-1">Bill To</span>
              <p className="font-bold text-slate-800 dark:text-slate-200">{invoice.client?.companyName || 'Corporate Client'}</p>
              <p className="text-slate-400 mt-0.5">{primaryContact.name}</p>
              <p className="text-slate-400">{primaryContact.email}</p>
            </div>
            {invoice.project && (
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-1">Project Workspace</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{invoice.project.name}</p>
                <p className="text-slate-400 mt-0.5">Status: {invoice.project.status}</p>
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto border-t border-b py-2">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-1">Description</th>
                  <th className="py-1 text-center">Qty</th>
                  <th className="py-1 text-right">Unit Price</th>
                  <th className="py-1 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.lineItems || []).map((item, idx) => {
                  const amt = (item.quantity || 0) * (item.unitPrice || 0);
                  return (
                    <tr key={item._id || idx} className="border-b border-transparent">
                      <td className="py-2 text-slate-800 dark:text-slate-200 font-medium">{item.description}</td>
                      <td className="py-2 text-center text-slate-600 dark:text-slate-400">{item.quantity}</td>
                      <td className="py-2 text-right text-slate-600 dark:text-slate-400">{money(item.unitPrice)}</td>
                      <td className="py-2 text-right text-slate-800 dark:text-slate-200 font-bold">{money(amt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals Box */}
          <div className="flex flex-col items-end pt-4 text-xs font-semibold text-slate-500 space-y-1.5 w-60 ml-auto">
            <div className="flex justify-between w-full">
              <span>Subtotal</span>
              <span className="text-slate-700 dark:text-slate-300 font-bold">{money(invoice.subtotal)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between w-full">
                <span>Discount ({invoice.discountPercent || 0}%)</span>
                <span className="text-rose-500 font-bold">- {money(invoice.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between w-full">
              <span>Tax ({invoice.taxPercent || 0}%)</span>
              <span className="text-slate-700 dark:text-slate-300 font-bold">{money(invoice.taxAmount)}</span>
            </div>
            <div className="flex justify-between w-full border-t pt-1.5 text-slate-800 dark:text-slate-100 font-extrabold">
              <span>Grand Total</span>
              <span className="text-sm text-blue-600">{money(invoice.total)}</span>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-4 pt-4 border-t text-xs text-slate-500">
              <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Notes</span>
              <p className="mt-1">{invoice.notes}</p>
            </div>
          )}
        </Card>

        {/* Right Info Sidebar */}
        <div className="space-y-6 col-span-1 text-xs">
          {/* Payment Summary */}
          <Card className="border bg-white dark:bg-slate-900/50 shadow-md">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Banknote className="h-4.5 w-4.5 text-emerald-500" />
                <span>Payment Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                <Badge style={{ borderRadius: '6px', padding: '1px 8px', fontSize: '10px', fontWeight: 600, border: 'none', ...getStatusStyle(invoice.status) }} className="capitalize">
                  {invoice.status?.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{money(invoice.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Paid</span>
                <span className="font-bold text-emerald-600">{money(invoice.paidAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-slate-400">Amount Due</span>
                <span className="font-extrabold text-rose-600">{money(amountDue)}</span>
              </div>
              {invoice.paymentMethod && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Method</span>
                  <span className="font-medium text-slate-600 dark:text-slate-300 capitalize">{invoice.paymentMethod.replace('_', ' ')}</span>
                </div>
              )}
              {invoice.sentAt && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Sent</span>
                  <span className="text-slate-600 dark:text-slate-300">{new Date(invoice.sentAt).toLocaleDateString()}</span>
                </div>
              )}
              {invoice.paidAt && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Paid On</span>
                  <span className="text-slate-600 dark:text-slate-300">{new Date(invoice.paidAt).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Proof / Receipt Card */}
          <Card className="border bg-white dark:bg-slate-900/50 shadow-md">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-blue-500" />
                <span>Verification Receipt</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {invoice.paymentProof ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-950/20 border rounded-lg flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                      {invoice.paymentProof.name || 'payment_receipt'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Verified</div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => openPreview(invoice.paymentProof)} className="text-[10px] h-7 px-2 font-bold shrink-0">
                    Preview
                  </Button>
                </div>
              ) : (
                <div className="text-center text-slate-400 py-4">No payment proof uploaded yet.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
              <Banknote className="h-5 w-5 text-emerald-500" />
              <span>Record Payment</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 my-4 text-xs font-semibold text-slate-500">
            <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-950/20 border rounded-lg">
              <span>Amount Due</span>
              <span className="font-extrabold text-rose-600">{money(amountDue)}</span>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pay-amount" className="uppercase tracking-wider text-[10px] text-slate-400">Amount Received</label>
              <Input id="pay-amount" type="number" min="0" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="h-10 bg-white text-black font-medium" />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pay-method" className="uppercase tracking-wider text-[10px] text-slate-400">Payment Method</label>
              <select id="pay-method" value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white px-3 py-2 text-sm text-black font-medium focus:outline-none">
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pay-notes" className="uppercase tracking-wider text-[10px] text-slate-400">Reference / Notes (optional)</label>
              <Input id="pay-notes" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="Txn ID, bank reference…" className="h-10 bg-white text-black font-medium" />
            </div>

            <div>
              <input type="file" id="receipt-file-upload" className="hidden" onChange={handleFileUpload} />
              <Button type="button" variant="outline" disabled={isUploading} onClick={() => document.getElementById('receipt-file-upload').click()} className="gap-2 h-10 w-full justify-center border-dashed">
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploadedReceipt ? 'Change Receipt' : 'Attach Receipt (optional)'}
              </Button>
              {uploadedReceipt && (
                <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 rounded-lg text-emerald-600 truncate font-bold">
                  {uploadedReceipt.name}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 flex justify-end">
            <Button variant="outline" onClick={() => setPayDialogOpen(false)} disabled={isPaying}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={isPaying} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
              {isPaying && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void Dialog */}
      <Dialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
              <Ban className="h-5 w-5 text-rose-500" />
              <span>Void Invoice</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 my-4 text-xs font-semibold text-slate-500">
            <p>Voiding marks this invoice as cancelled and removes it from active receivables. This cannot be undone.</p>
            <Input value={voidReason} onChange={(e) => setVoidReason(e.target.value)} placeholder="Reason for voiding…" className="h-10 bg-white text-black font-medium" />
          </div>
          <DialogFooter className="gap-2 flex justify-end">
            <Button variant="outline" onClick={() => setVoidDialogOpen(false)} disabled={isVoiding}>
              Cancel
            </Button>
            <Button onClick={handleVoid} disabled={isVoiding} className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-2">
              {isVoiding && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Void
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AttachmentPreviewModal
        file={previewFile}
        isOpen={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewFile(null);
        }}
      />
    </div>
  );
}
