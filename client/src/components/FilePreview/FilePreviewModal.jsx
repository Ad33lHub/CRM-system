import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth.js';
import { getFileCategory, getPreviewStrategy } from '../../services/filePreview.service.js';
import { X, Download, FileText, Music, File, Video, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button.jsx';

// Import sub-previewers
import ImagePreview from './ImagePreview.jsx';
import PdfPreview from './PdfPreview.jsx';
import OfficePreview from './OfficePreview.jsx';
import AudioPreview from './AudioPreview.jsx';
import VideoPreview from './VideoPreview.jsx';
import TextPreview from './TextPreview.jsx';
import DownloadFallback from './DownloadFallback.jsx';

export default function FilePreviewModal({ file, open, isOpen, onClose }) {
  const { accessToken } = useAuth();
  
  // Support both 'open' and 'isOpen' props
  const modalOpen = open !== undefined ? open : isOpen;

  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  useEffect(() => {
    if (!modalOpen || !file) return;

    const fetchPreviewUrl = async () => {
      setIsLoading(true);
      setError(null);
      setPreviewUrl(null);
      
      try {
        const hasDocId = file.documentId || file._id || file.id;
        const isDocType = file.entityType === 'document' || file.category || file.versions;

        if (hasDocId && isDocType) {
          const docId = file.documentId || file._id || file.id;
          const url = `/api/documents/${docId}/download${file.version ? `?version=${file.version}` : ''}`;
          
          const res = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          
          if (!res.ok) {
            throw new Error(`Failed to fetch preview URL (${res.status})`);
          }
          
          const data = await res.json();
          setPreviewUrl(data.signedUrl);
        } else {
          // Fallback to direct URL if public/anonymous context
          setPreviewUrl(file.url || file.cloudinaryUrl);
        }
      } catch (err) {
        setError(err.message || 'Failed to load document preview');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreviewUrl();
  }, [modalOpen, file, accessToken]);

  if (!modalOpen || !file) return null;

  const mimeType = file.mimeType || '';
  const category = getFileCategory(mimeType);
  const strategy = getPreviewStrategy(mimeType);

  const handleDownload = () => {
    if (previewUrl) {
      const a = document.createElement('a');
      a.href = previewUrl;
      a.download = file.name || 'download';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const getHeaderIcon = () => {
    switch (category) {
      case 'image': return <ImageIcon className="h-5 w-5 text-blue-500" />;
      case 'video': return <Video className="h-5 w-5 text-indigo-500" />;
      case 'audio': return <Music className="h-5 w-5 text-emerald-500" />;
      case 'pdf': return <FileText className="h-5 w-5 text-rose-500" />;
      case 'office': return <FileText className="h-5 w-5 text-amber-500" />;
      case 'text': return <FileText className="h-5 w-5 text-slate-500" />;
      default: return <File className="h-5 w-5 text-slate-400" />;
    }
  };

  const getBadgeText = () => {
    if (category === 'unknown') return 'FILE';
    return category.toUpperCase();
  };

  const renderPreviewContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm font-medium">Securing connection & preparing preview...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-rose-500 max-w-md text-center mx-auto">
          <AlertCircle className="h-10 w-10 text-rose-500" />
          <p className="font-semibold text-slate-800 dark:text-slate-200">Failed to render preview</p>
          <p className="text-xs text-slate-400">{error}</p>
          {previewUrl && (
            <Button onClick={handleDownload} className="mt-4 gap-2">
              <Download className="h-4 w-4" />
              Download Directly
            </Button>
          )}
        </div>
      );
    }

    if (!previewUrl) {
      return (
        <div className="text-center py-16 text-slate-400">
          No preview source available.
        </div>
      );
    }

    // Route based on strategy
    if (strategy === 'google_viewer') {
      return <OfficePreview url={previewUrl} name={file.name} size={file.size} />;
    }
    
    if (strategy === 'download_only') {
      return <DownloadFallback url={previewUrl} name={file.name} size={file.size} />;
    }

    // Strategy is native
    switch (category) {
      case 'image':
        return <ImagePreview url={previewUrl} name={file.name} size={file.size} />;
      case 'pdf':
        return <PdfPreview url={previewUrl} name={file.name} size={file.size} />;
      case 'audio':
        return <AudioPreview url={previewUrl} name={file.name} size={file.size} />;
      case 'video':
        return <VideoPreview url={previewUrl} name={file.name} size={file.size} />;
      case 'text':
        return <TextPreview url={previewUrl} name={file.name} size={file.size} />;
      default:
        return <DownloadFallback url={previewUrl} name={file.name} size={file.size} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            {getHeaderIcon()}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base truncate max-w-md">
                  {file.name}
                </h3>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 select-none">
                  {getBadgeText()}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {formatBytes(file.size)} {file.version ? `· Version ${file.version}` : ''}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50 dark:bg-slate-950/40">
          {renderPreviewContent()}
        </div>

        {/* Footer */}
        {previewUrl && !isLoading && !error && (
          <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end shrink-0">
            <Button 
              onClick={handleDownload} 
              variant="outline" 
              className="gap-2 h-9"
            >
              <Download className="h-4 w-4" />
              Download File
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
