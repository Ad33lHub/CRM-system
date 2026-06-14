import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/page-header.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { useCreateInvoiceMutation } from '../../services/invoicesApi.js';
import { useGetClientsQuery } from '../../services/clientsApi.js';
import { useGetProjectsQuery } from '../../services/projectsApi.js';
import { Plus, Trash, Loader2, ArrowLeft, Save, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function InvoiceCreatePage() {
  const navigate = useNavigate();

  // Form States
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [lineItems, setLineItems] = useState([
    { description: 'Initial Software Consulting', quantity: 1, rate: 1500, taxRate: 5 }
  ]);

  // Queries & Mutations
  const { data: clientsData } = useGetClientsQuery();
  const { data: projectsData } = useGetProjectsQuery();
  const [createInvoiceApi, { isLoading }] = useCreateInvoiceMutation();

  const clients = clientsData?.data || [];
  const projects = projectsData?.data || [];

  // Compute values
  const [subtotal, setSubtotal] = useState(0);
  const [taxTotal, setTaxTotal] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  useEffect(() => {
    let sub = 0;
    let tax = 0;
    lineItems.forEach(item => {
      const itemSub = (item.quantity || 0) * (item.rate || 0);
      sub += itemSub;
      tax += itemSub * ((item.taxRate || 0) / 100);
    });
    setSubtotal(sub);
    setTaxTotal(tax);
    setGrandTotal(sub + tax);
  }, [lineItems]);

  const handleAddItem = () => {
    setLineItems(prev => [...prev, { description: '', quantity: 1, rate: 0, taxRate: 5 }]);
  };

  const handleRemoveItem = (idx) => {
    if (lineItems.length === 1) return;
    setLineItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, val) => {
    setLineItems(prev => prev.map((item, i) => {
      if (i === idx) {
        return {
          ...item,
          [field]: field === 'description' ? val : parseFloat(val) || 0
        };
      }
      return item;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientId) {
      toast.error('Please select a client');
      return;
    }
    if (!dueDate) {
      toast.error('Please specify a due date');
      return;
    }
    if (lineItems.some(item => !item.description.trim())) {
      toast.error('All line items must have a description');
      return;
    }

    try {
      await createInvoiceApi({
        invoiceNumber,
        client: clientId,
        project: projectId || undefined,
        dueDate,
        items: lineItems,
        totals: {
          subtotal,
          tax: taxTotal,
          total: grandTotal
        }
      }).unwrap();

      toast.success('Invoice created successfully!');
      navigate('/invoices');
    } catch (err) {
      toast.error(err.data?.message || 'Failed to create invoice');
    }
  };

  const selectedClient = clients.find(c => (c.id || c._id) === clientId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoice Builder"
        subtitle="Compose line-item invoices with real-time tax calculation and live layouts"
        actions={
          <Button variant="outline" onClick={() => navigate('/invoices')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Registry
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Form Builder */}
        <Card className="border bg-white dark:bg-slate-900/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <span>Invoice Form details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                {/* Invoice Number */}
                <div className="space-y-1.5">
                  <label htmlFor="inv-num" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Invoice Number</label>
                  <Input id="inv-num" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} required disabled={isLoading} className="h-10.5" />
                </div>
                {/* Due Date */}
                <div className="space-y-1.5">
                  <label htmlFor="inv-due" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Due Date</label>
                  <Input id="inv-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required disabled={isLoading} className="h-10.5" />
                </div>
              </div>

              {/* Client Selection */}
              <div className="space-y-1.5">
                <label htmlFor="select-client" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Client</label>
                <select
                  id="select-client"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                  disabled={isLoading}
                  className="flex h-10.5 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="">Choose Client</option>
                  {clients.map((c) => (
                    <option key={c.id || c._id} value={c.id || c._id}>{c.companyName}</option>
                  ))}
                </select>
              </div>

              {/* Project Selection */}
              <div className="space-y-1.5">
                <label htmlFor="inv-project" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Project Context (Optional)</label>
                <select
                  id="inv-project"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  disabled={isLoading}
                  className="flex h-10.5 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="">Select Project</option>
                  {projects.map((p) => (
                    <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Line Items builder */}
              <div className="space-y-3 pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Line Items</span>
                  <Button type="button" size="sm" onClick={handleAddItem} className="h-8 gap-1 text-xs">
                    <Plus className="h-3.5 w-3.5" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1">
                  {lineItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-lg border">
                      <Input
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        placeholder="Item Description"
                        required
                        className="flex-1 h-9 text-xs"
                      />
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        placeholder="Qty"
                        required
                        className="w-14 h-9 text-xs"
                      />
                      <Input
                        type="number"
                        value={item.rate}
                        onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                        placeholder="Rate"
                        required
                        className="w-20 h-9 text-xs"
                      />
                      <Input
                        type="number"
                        value={item.taxRate}
                        onChange={(e) => handleItemChange(idx, 'taxRate', e.target.value)}
                        placeholder="Tax %"
                        className="w-16 h-9 text-xs"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={lineItems.length === 1}
                        className="h-9 w-9 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 transition-all rounded-lg flex items-center justify-center gap-2 mt-4"
              >
                {isLoading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Save className="h-4.5 w-4.5" />}
                Generate & Save Invoice
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Live Preview */}
        <Card className="border bg-slate-50 dark:bg-slate-950/20 shadow-md p-6 flex flex-col justify-between min-h-[400px]">
          <div className="space-y-6">
            {/* Invoice Header */}
            <div className="flex justify-between items-start pb-4 border-b">
              <div>
                <img src="https://verixsoft.com/icon.png" alt="Verixsoft Logo" className="h-10 w-auto rounded mb-2" onError={e=>e.target.src='https://placehold.co/80x80/3b82f6/ffffff?text=V'} />
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Verixsoft Solutions</h4>
                <p className="text-[10px] text-slate-400">123 Tech Square, Sector-G, Islamabad</p>
              </div>
              <div className="text-right">
                <h3 className="text-xl font-extrabold text-blue-600">INVOICE</h3>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">#{invoiceNumber}</p>
                <p className="text-[10px] text-slate-400">Due: {dueDate ? new Date(dueDate).toLocaleDateString() : '--'}</p>
              </div>
            </div>

            {/* Bill To Info */}
            <div className="text-xs">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-1">Bill To</span>
              {selectedClient ? (
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800 dark:text-slate-200">{selectedClient.companyName}</p>
                  <p className="text-slate-500 dark:text-slate-400">{selectedClient.contactPerson}</p>
                  <p className="text-slate-500 dark:text-slate-400">{selectedClient.email}</p>
                </div>
              ) : (
                <p className="text-slate-400 italic">No client selected.</p>
              )}
            </div>

            {/* Items Table */}
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
                  {lineItems.map((item, idx) => {
                    const amt = (item.quantity || 0) * (item.rate || 0);
                    return (
                      <tr key={idx} className="border-b border-transparent hover:bg-slate-100/30">
                        <td className="py-2 text-slate-800 dark:text-slate-200 font-medium">{item.description || 'New Item Line'}</td>
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
          </div>

          {/* Computations Total Summary */}
          <div className="border-t pt-4 text-xs font-semibold text-slate-500 dark:text-slate-400 space-y-1.5 self-end w-56">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-slate-700 dark:text-slate-300 font-bold">${subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax Total</span>
              <span className="text-slate-700 dark:text-slate-300 font-bold">${taxTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t pt-1.5 text-slate-800 dark:text-slate-100 font-extrabold">
              <span>Grand Total (USD)</span>
              <span className="text-sm text-blue-600">${grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
