import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/page-header.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog.jsx';
import { Loader2, ArrowLeft, CheckCircle, FileText, Upload } from 'lucide-react';
import { 
  useGetInvoiceByIdQuery, 
  useApprovePaymentMutation 
} from '../../services/invoicesApi.js';
import useAuth from '../../hooks/useAuth.js';
import AttachmentPreviewModal from '../../components/common/AttachmentPreviewModal.jsx';
import { toast } from 'sonner';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, accessToken } = useAuth();

  // States
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedReceipt, setUploadedReceipt] = useState(null);

  // Preview modal states
  const [previewFile, setPreviewFile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Queries & Mutations
  const { data: invoiceData, isLoading, refetch } = useGetInvoiceByIdQuery(id);
  const [approvePaymentApi, { isLoading: isApproving }] = useApprovePaymentMutation();

  const invoice = invoiceData?.data || invoiceData;

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
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        setUploadedReceipt({
          name: data.fileName,
          url: data.url,
          publicId: data.publicId,
          size: data.size
        });
        toast.success('Receipt file uploaded successfully!');
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch (err) {
      toast.error('Error uploading receipt');
    } finally {
      setIsUploading(false);
    }
  };

  const handleApprovePayment = async () => {
    if (!uploadedReceipt) {
      toast.error('Please upload a payment verification receipt first');
      return;
    }

    try {
      await approvePaymentApi({
        id,
        data: {
          paymentProof: uploadedReceipt
        }
      }).unwrap();

      toast.success('Invoice payment marked as approved and paid!');
      setApproveDialogOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.data?.message || 'Failed to approve payment');
    }
  };

  const openPreview = (fileObj) => {
    setPreviewFile({
      name: fileObj.name || 'Receipt',
      url: fileObj.url || fileObj.cloudinaryUrl,
      size: fileObj.size,
      mimeType: fileObj.name?.endsWith('.pdf') ? 'application/pdf' : 'image/png' // estimate
    });
    setPreviewOpen(true);
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'sent': return 'default';
      case 'draft': return 'secondary';
      case 'overdue': return 'warning';
      case 'void': return 'destructive';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return <div className="text-center py-12 text-slate-400">Loading invoice details...</div>;
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold text-rose-500">Invoice Not Found</h3>
        <Button onClick={() => navigate('/invoices')} className="mt-4">Back to List</Button>
      </div>
    );
  }

  const isManager = ['super_admin', 'admin', 'manager'].includes(role);
  const canApprove = isManager && invoice.status !== 'paid';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Invoice Details`}
        subtitle={`Invoice No: #${invoice.invoiceNumber}`}
        breadcrumbs={[
          { label: 'Invoices', href: '/invoices' },
          { label: 'Invoice Detail' }
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/invoices')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to List
            </Button>
            {canApprove && (
              <Button onClick={() => setApproveDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
                <CheckCircle className="h-4 w-4" />
                Approve Payment
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
              <img src="https://verixsoft.com/icon.png" alt="Verixsoft Logo" className="h-10 w-auto rounded mb-2" onError={e=>e.target.src='https://placehold.co/80x80/3b82f6/ffffff?text=V'} />
              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Verixsoft Solutions</h4>
              <p className="text-[10px] text-slate-400">123 Tech Square, Islamabad</p>
            </div>
            <div className="text-right">
              <h3 className="text-xl font-extrabold text-blue-600">INVOICE</h3>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">#{invoice.invoiceNumber}</p>
              <p className="text-[10px] text-slate-400">Due: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '--'}</p>
              <Badge variant={getStatusBadgeVariant(invoice.status)} className="capitalize mt-2">
                {invoice.status}
              </Badge>
            </div>
          </div>

          {/* Client Details */}
          <div className="grid grid-cols-2 gap-4 py-4 text-xs font-semibold text-slate-500">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-1">Bill To</span>
              <p className="font-bold text-slate-800 dark:text-slate-200">{invoice.client?.companyName || 'Corporate Client'}</p>
              <p className="text-slate-400 mt-0.5">{invoice.client?.contactPerson}</p>
              <p className="text-slate-400">{invoice.client?.email}</p>
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
                  <th className="py-1 text-right">Rate</th>
                  <th className="py-1 text-right">Tax</th>
                  <th className="py-1 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item, idx) => {
                  const amt = (item.quantity || 0) * (item.rate || 0);
                  return (
                    <tr key={idx} className="border-b border-transparent">
                      <td className="py-2 text-slate-800 dark:text-slate-200 font-medium">{item.description}</td>
                      <td className="py-2 text-center text-slate-600 dark:text-slate-400">{item.quantity}</td>
                      <td className="py-2 text-right text-slate-600 dark:text-slate-400">${item.rate.toLocaleString()}</td>
                      <td className="py-2 text-right text-slate-600 dark:text-slate-400">{item.taxRate}%</td>
                      <td className="py-2 text-right text-slate-800 dark:text-slate-200 font-bold">${amt.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals Box */}
          <div className="flex flex-col items-end pt-4 text-xs font-semibold text-slate-500 space-y-1.5 w-56 ml-auto">
            <div className="flex justify-between w-full">
              <span>Subtotal</span>
              <span className="text-slate-700 dark:text-slate-300 font-bold">${(invoice.totals?.subtotal || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between w-full">
              <span>Tax Total</span>
              <span className="text-slate-700 dark:text-slate-300 font-bold">${(invoice.totals?.tax || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between w-full border-t pt-1.5 text-slate-800 dark:text-slate-100 font-extrabold">
              <span>Grand Total</span>
              <span className="text-sm text-blue-600">${(invoice.totals?.total || 0).toLocaleString()}</span>
            </div>
          </div>
        </Card>

        {/* Right Info Sidebar (Proof, Audit) */}
        <div className="space-y-6 col-span-1 text-xs">
          
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
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/20 border rounded-lg flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                        {invoice.paymentProof.name || 'payment_receipt.pdf'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Approved and verified</div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => openPreview(invoice.paymentProof)} className="text-[10px] h-7 px-2 font-bold shrink-0">
                      Preview
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-400 py-4">No payment proof uploaded yet.</div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Approve Dialog */}
      {approveDialogOpen && (
        <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
          <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xl p-6">
            <DialogHeader>
              <DialogTitle className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <span>Verify & Approve Payment</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 my-4 text-xs font-semibold text-slate-500">
              <p>Upload a confirmation receipt, bank receipt, or payment proof document (PDF/Image) to mark this invoice as paid.</p>
              
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  id="receipt-file-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploading}
                  onClick={() => document.getElementById('receipt-file-upload').click()}
                  className="gap-2 h-10 w-full flex items-center justify-center border-dashed"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploadedReceipt ? 'Change Receipt file' : 'Upload Receipt Scan'}
                </Button>
              </div>

              {uploadedReceipt && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150 rounded-lg text-emerald-600 flex justify-between items-center">
                  <span className="truncate max-w-[150px] font-bold">{uploadedReceipt.name}</span>
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 flex justify-end">
              <Button variant="outline" onClick={() => setApproveDialogOpen(false)} disabled={isApproving}>
                Cancel
              </Button>
              <Button onClick={handleApprovePayment} disabled={isApproving || !uploadedReceipt} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
                {isApproving && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm & Mark Paid
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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
