import React, { useState } from 'react';
import { File, Download, Copy, Check, FileArchive } from 'lucide-react';
import { Button } from '../ui/button.jsx';
import { toast } from 'sonner';

export default function DownloadFallback({ url, name, size }) {
  const [copied, setCopied] = useState(false);

  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name || 'download';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Signed download link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link.');
    }
  };

  const isArchive = name && (name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.tar') || name.endsWith('.gz'));

  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md shadow-sm w-full mx-auto my-6 text-center select-none animate-fade-in">
      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-full mb-4 border border-slate-100 dark:border-slate-800">
        {isArchive ? (
          <FileArchive className="h-16 w-16 text-blue-500" />
        ) : (
          <File className="h-16 w-16 text-slate-400" />
        )}
      </div>
      
      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-1 truncate w-full px-4" title={name}>
        {name}
      </h4>
      <p className="text-xs text-slate-400 mb-2 font-semibold">
        {formatBytes(size)}
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-[260px] mx-auto leading-relaxed">
        Preview is not available for this file type. You can download the file to inspect its contents.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-2.5 w-full">
        <Button onClick={handleDownload} className="flex-1 gap-2 shadow-sm">
          <Download className="h-4 w-4" />
          Download File
        </Button>
        <Button onClick={handleCopyLink} variant="outline" className="flex-1 gap-2 border-slate-200 dark:border-slate-800">
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy Link
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
