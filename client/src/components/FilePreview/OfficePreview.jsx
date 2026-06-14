import React, { useState } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';
import DownloadFallback from './DownloadFallback.jsx';

export default function OfficePreview({ url, name, size }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`;

  const handleLoad = () => {
    setLoading(false);
  };

  if (error) {
    return <DownloadFallback url={url} name={name} size={size} />;
  }

  return (
    <div className="w-full flex flex-col bg-slate-950 rounded-lg relative overflow-hidden h-[70vh]">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 z-10 gap-3 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm font-medium">Loading Office document preview...</p>
        </div>
      )}

      {/* Embedded Google Viewer Iframe */}
      <iframe 
        src={googleViewerUrl}
        className="w-full h-full border-0 bg-white" 
        title={name}
        onLoad={handleLoad}
        onError={() => setError(true)}
      />

      {/* Info Overlay / Notice */}
      <div className="bg-slate-900 border-t border-slate-800 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-400 gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
          <span>Privacy note: Google may process this file for preview. Powered by Google Docs Viewer.</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span>For the best experience, please download the file.</span>
        </div>
      </div>
    </div>
  );
}
