import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth.js';
import { getMimeCategory } from '../../services/preview.service.js';
import { 
  X, Download, FileText, Music, File, 
  Video, Image as ImageIcon, Loader2, AlertCircle
} from 'lucide-react';
import { Button } from '../ui/button.jsx';

// Utility helper to format bytes nicely
const formatBytes = (bytes, decimals = 2) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default function AttachmentPreviewModal({ file, isOpen, onClose }) {
  const { accessToken } = useAuth();
  
  // States
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [csvRows, setCsvRows] = useState([]);

  const category = file ? getMimeCategory(file.mimeType, file.name) : 'fallback';

  useEffect(() => {
    if (!isOpen || !file) return;

    const fetchPreviewUrl = async () => {
      setIsLoading(true);
      setError(null);
      setTextContent('');
      setCsvRows([]);
      
      try {
        // If it is a Document model document, call the download/preview endpoint to sign
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
          // Standard public URL
          setPreviewUrl(file.url || file.cloudinaryUrl);
        }
      } catch (err) {
        setError(err.message || "Failed to load document preview");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreviewUrl();
  }, [isOpen, file, accessToken]);

  // Fetch text/CSV content if needed
  useEffect(() => {
    if (category === 'text' && previewUrl) {
      const fetchText = async () => {
        try {
          const res = await fetch(previewUrl);
          if (!res.ok) throw new Error("Could not read text content");
          const text = await res.text();
          setTextContent(text);

          if (file.name?.endsWith('.csv')) {
            const rows = text.split('\n')
              .map(row => row.split(','))
              .filter(row => row.length > 0 && row.some(col => col.trim() !== ''));
            setCsvRows(rows);
          }
        } catch (err) {
          setError("Failed to render text content: " + err.message);
        }
      };
      fetchText();
    }
  }, [previewUrl, category, file]);

  if (!isOpen || !file) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            {getHeaderIcon()}
            <div className="min-w-0">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base truncate max-w-md">
                {file.name}
              </h3>
              <p className="text-xs text-slate-400">
                {formatBytes(file.size)} {file.version ? `· Version ${file.version}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {previewUrl && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDownload}
                className="gap-2 h-8"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            )}
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-50 dark:bg-slate-950/40">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-sm font-medium">Securing connection & preparing preview...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-rose-500 max-w-md text-center">
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
          ) : !previewUrl ? (
            <div className="text-center py-12 text-slate-400">
              No preview source available.
            </div>
          ) : (
            // Render specific category viewers
            <div className="w-full flex justify-center">
              {category === 'image' && (
                <img 
                  src={previewUrl} 
                  alt={file.name} 
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm"
                />
              )}

              {category === 'video' && (
                /* eslint-disable-next-line jsx-a11y/media-has-caption */
                <video 
                  src={previewUrl} 
                  controls 
                  className="w-full max-h-[70vh] rounded-lg shadow-sm"
                />
              )}

              {category === 'audio' && (
                <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-sm">
                  <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 p-4 rounded-full mb-4">
                    <Music className="h-8 w-8" />
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1 text-center truncate w-full">{file.name}</p>
                  <p className="text-xs text-slate-400 mb-6">{formatBytes(file.size)}</p>
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <audio src={previewUrl} controls className="w-full" />
                </div>
              )}

              {category === 'pdf' && (
                <iframe 
                  src={`${previewUrl}#toolbar=0`}
                  className="w-full h-[70vh] border-0 rounded-lg shadow-sm bg-white" 
                  title={file.name}
                />
              )}

              {category === 'office' && (
                <iframe 
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(previewUrl)}&embedded=true`} 
                  className="w-full h-[70vh] border-0 rounded-lg shadow-sm bg-white" 
                  title={file.name}
                />
              )}

              {category === 'text' && (
                <div className="w-full">
                  {file.name?.endsWith('.csv') && csvRows.length > 0 ? (
                    <div className="overflow-auto max-h-[65vh] border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900">
                      <table className="w-full text-sm text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                            {csvRows[0].map((col, cIdx) => (
                              <th key={cIdx} className="p-3 border-r border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {csvRows.slice(1).map((row, rIdx) => (
                            <tr key={rIdx} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              {row.map((col, cIdx) => (
                                <td key={cIdx} className="p-3 border-r border-slate-100 dark:border-slate-800 font-mono text-xs whitespace-nowrap text-slate-600 dark:text-slate-300">
                                  {col}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <pre className="p-5 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-mono text-xs overflow-auto max-h-[65vh] rounded-lg border border-slate-200 dark:border-slate-800">
                      {textContent}
                    </pre>
                  )}
                </div>
              )}

              {category === 'fallback' && (
                <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md shadow-sm w-full">
                  <File className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-center mb-1 truncate w-full">{file.name}</h4>
                  <p className="text-sm text-slate-400 mb-6">{formatBytes(file.size)}</p>
                  <Button onClick={handleDownload} className="w-full gap-2">
                    <Download className="h-4 w-4" />
                    Download File
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
