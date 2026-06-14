import React, { useState } from 'react';
import { FileText, ExternalLink, Download, Loader2 } from 'lucide-react';
import { Button } from '../ui/button.jsx';

export default function PdfPreview({ url, name }) {
  const [loading, setLoading] = useState(true);
  const [iframeBlocked, setIframeBlocked] = useState(false);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name || 'document.pdf';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="w-full h-[70vh] flex flex-col bg-slate-950 rounded-lg relative overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 z-10 gap-3 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm font-medium">Loading PDF document...</p>
        </div>
      )}

      {iframeBlocked ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-4">
          <FileText className="h-16 w-16 text-slate-600 mb-2" />
          <p className="font-semibold text-slate-200">Your browser blocked the PDF viewer</p>
          <p className="text-xs text-slate-400 max-w-sm">
            For security, some browsers block inline PDF previews. You can open the PDF in a new tab or download it directly.
          </p>
          <div className="flex gap-3 mt-2">
            <Button asChild variant="outline" className="gap-2">
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Open in New Tab
              </a>
            </Button>
            <Button onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Download File
            </Button>
          </div>
        </div>
      ) : (
        <iframe 
          src={`${url}#toolbar=0`}
          type="application/pdf"
          className="w-full h-full border-0 bg-white" 
          title={name}
          onLoad={handleLoad}
          onError={() => setIframeBlocked(true)}
        />
      )}
    </div>
  );
}
