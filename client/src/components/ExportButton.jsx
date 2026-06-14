import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { Button } from './ui/button.jsx';
import api from '../lib/axios.js';

export default function ExportButton({ reportType, format, params = {}, label }) {
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  async function doExport(fmt) {
    setLoading(true);
    setShowPicker(false);
    try {
      const query = new URLSearchParams({ format: fmt, ...params }).toString();
      const res = await api.get(`/export/${reportType}?${query}`, {
        responseType: 'blob',
      });

      const ext = fmt === 'pdf' ? 'pdf' : 'xlsx';
      const contentDisposition = res.headers['content-disposition'] ?? '';
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : `${reportType}_export.${ext}`;

      const url = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Export failed. Please try again.';
      alert(msg);
    } finally {
      setLoading(false);
    }
  }

  if (format) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => doExport(format)}
        className="flex items-center gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : format === 'pdf' ? (
          <FileText className="h-4 w-4" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" />
        )}
        {label ?? (format === 'pdf' ? 'Export PDF' : 'Export Excel')}
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => setShowPicker((p) => !p)}
        className="flex items-center gap-2"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {label ?? 'Export'}
      </Button>
      {showPicker && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-border rounded-md shadow-lg p-1 min-w-[140px]">
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent rounded"
            onClick={() => doExport('excel')}
          >
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            Excel (.xlsx)
          </button>
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent rounded"
            onClick={() => doExport('pdf')}
          >
            <FileText className="h-4 w-4 text-red-600" />
            PDF
          </button>
        </div>
      )}
    </div>
  );
}
