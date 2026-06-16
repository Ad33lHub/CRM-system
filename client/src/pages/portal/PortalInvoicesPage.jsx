import React, { useState } from 'react';
import { useGetPortalInvoicesQuery } from '../../services/portalApi.js';
import api from '../../lib/axios.js';
import { Receipt, Download, Loader2 } from 'lucide-react';
import { money, formatDate } from './portal-utils.js';

const STATUS_STYLES = {
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  partially_paid: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  overdue: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  draft: 'bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300',
  void: 'bg-slate-100 text-slate-500 line-through dark:bg-slate-700/40',
};

export default function PortalInvoicesPage() {
  const { data, isLoading } = useGetPortalInvoicesQuery();
  const invoices = data?.data || [];
  const [downloading, setDownloading] = useState(null);

  const downloadPdf = async (invoice) => {
    const invId = invoice._id || invoice.id;
    setDownloading(invId);
    try {
      const res = await api.get(`/invoices/${invId}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoiceNumber || 'invoice'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // ignore; the button just resets
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Invoices</h1>
        <p className="text-sm text-slate-400">Review your invoices and download PDF copies.</p>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-slate-400">Loading invoices…</p>
      ) : invoices.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900/50">
          <Receipt className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h4 className="font-bold text-slate-700 dark:text-slate-300">No invoices yet</h4>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">
            Your invoices will appear here as they are issued.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400 dark:border-slate-800">
                  <th className="px-5 py-3 font-bold">Invoice</th>
                  <th className="px-5 py-3 font-bold">Issued</th>
                  <th className="px-5 py-3 font-bold">Due</th>
                  <th className="px-5 py-3 font-bold">Total</th>
                  <th className="px-5 py-3 font-bold">Balance</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 font-bold text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.map((inv) => {
                  const invId = inv._id || inv.id;
                  const balance = Math.max(0, (inv.total || 0) - (inv.paidAmount || 0));
                  return (
                    <tr key={invId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-100">
                        {inv.invoiceNumber || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                        {formatDate(inv.sentAt || inv.createdAt)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-700 dark:text-slate-200">
                        {money(inv.total, inv.currency)}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-700 dark:text-slate-200">
                        {money(balance, inv.currency)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            STATUS_STYLES[inv.status] || STATUS_STYLES.draft
                          }`}
                        >
                          {(inv.status || 'draft').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => downloadPdf(inv)}
                          disabled={downloading === invId}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          {downloading === invId ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                          PDF
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
