import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

export default function TextPreview({ url, name }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [csvRows, setCsvRows] = useState([]);

  useEffect(() => {
    const fetchTextContent = async () => {
      setLoading(true);
      setError(null);
      setContent('');
      setCsvRows([]);
      setIsTruncated(false);

      try {
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Failed to load text content (${res.status})`);
        }
        
        const rawText = await res.text();
        
        // Handle max limit check (10000 characters)
        const maxLength = 10000;
        let displayedText = rawText;
        if (rawText.length > maxLength) {
          displayedText = rawText.substring(0, maxLength);
          setIsTruncated(true);
        }
        
        setContent(displayedText);

        if (name?.endsWith('.csv')) {
          const rows = displayedText.split('\n')
            .map(row => row.split(','))
            .filter(row => row.length > 0 && row.some(col => col.trim() !== ''));
          setCsvRows(rows);
        }
      } catch (err) {
        setError(err.message || 'Error loading file content');
      } finally {
        setLoading(false);
      }
    };

    if (url) {
      fetchTextContent();
    }
  }, [url, name]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-2 w-full">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        <p className="text-sm">Reading file content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg max-w-md mx-auto my-6 text-sm">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  const isCsv = name?.endsWith('.csv') && csvRows.length > 0;

  return (
    <div className="w-full space-y-3">
      {isTruncated && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-2.5 rounded-lg text-xs font-semibold text-center select-none shrink-0">
          Showing first 10,000 characters of the file. Complete file is available via download.
        </div>
      )}

      {isCsv ? (
        <div className="overflow-auto max-h-[60vh] border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 shadow-inner">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                {csvRows[0].map((col, cIdx) => (
                  <th key={cIdx} className="p-3 border-r border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 text-xs uppercase select-none">
                    {col.replace(/"/g, '')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {csvRows.slice(1).map((row, rIdx) => (
                <tr key={rIdx} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                  {row.map((col, cIdx) => (
                    <td key={cIdx} className="p-3 border-r border-slate-100 dark:border-slate-800 font-mono text-xs whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {col.replace(/"/g, '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <pre className="p-5 bg-slate-950 text-slate-100 font-mono text-xs overflow-auto max-h-[60vh] rounded-lg border border-slate-800 shadow-inner leading-relaxed">
          {content}
        </pre>
      )}
    </div>
  );
}
