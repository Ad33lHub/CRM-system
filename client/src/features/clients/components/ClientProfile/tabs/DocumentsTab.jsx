import React, { useState, useEffect, useRef, useCallback } from 'react';
import useAuth from '@/hooks/useAuth';
import { 
  File, Upload, Trash2, Download, Eye, 
  History, Calendar, Shield, Tag, AlertTriangle, ChevronDown, ChevronUp, Loader2, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import FilePreviewModal from '@/components/FilePreview/FilePreviewModal.jsx';

// Utility helper to format bytes nicely
const formatBytes = (bytes, decimals = 2) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Categories mapping for display
const CATEGORIES = {
  contract: 'Contract',
  nda: 'NDA',
  id_card: 'ID Card',
  deliverable: 'Deliverable',
  invoice_document: 'Invoice Doc',
  proposal_document: 'Proposal Doc',
  certificate: 'Certificate',
  tax_form: 'Tax Form',
  report: 'Report',
  other: 'Other'
};

const ACCESS_LEVELS = {
  private: 'Private (Owner Only)',
  team: 'Team Access',
  admin_only: 'Admins Only'
};

export default function DocumentsTab({ clientId }) {
  const { accessToken, role } = useAuth();
  
  // States
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDocForVersion, setSelectedDocForVersion] = useState(null);
  
  // Form fields for document upload
  const [docName, setDocName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('contract');
  const [accessLevel, setAccessLevel] = useState('team');
  const [tags, setTags] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [changeNote, setChangeNote] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Expanded version histories
  const [expandedDocs, setExpandedDocs] = useState({});

  // Previewer
  const [previewFile, setPreviewFile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Fetch documents on load
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/documents?entityType=client&entityId=${clientId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setDocuments(data);
      } else {
        toast.error("Failed to load documents.");
      }
    } catch (err) {
      toast.error("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  }, [clientId, accessToken]);

  useEffect(() => {
    if (clientId) {
      fetchDocuments();
    }
  }, [clientId, fetchDocuments]);

  const toggleExpand = (docId) => {
    // If expanding, fetch full doc details (to get versions)
    if (!expandedDocs[docId]) {
      fetchDocDetail(docId);
    } else {
      setExpandedDocs(prev => ({ ...prev, [docId]: false }));
    }
  };

  const fetchDocDetail = async (docId) => {
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        // Update document in list with versions
        setDocuments(prev => prev.map(d => d._id === docId ? data : d));
        setExpandedDocs(prev => ({ ...prev, [docId]: true }));
      }
    } catch (err) {
      toast.error("Failed to load document version history");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!docName) {
        // Autofill name from file
        const baseName = file.name.split('.')[0].replace(/[^a-zA-Z0-9 ]/g, ' ');
        setDocName(baseName);
      }
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('name', docName.trim());
    formData.append('entityType', 'client');
    formData.append('entityId', clientId);
    formData.append('category', category);
    formData.append('description', description.trim());
    formData.append('accessLevel', accessLevel);
    
    if (tags.trim()) {
      const parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
      formData.append('tags', JSON.stringify(parsedTags));
    }
    if (expiresAt) {
      formData.append('expiresAt', expiresAt);
    }
    if (changeNote) {
      formData.append('changeNote', changeNote);
    }

    setLoading(true);
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });

      if (response.ok) {
        toast.success("Document uploaded successfully.");
        setUploadDialogOpen(false);
        resetForm();
        fetchDocuments();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to upload document.");
      }
    } catch (err) {
      toast.error("Network error during document upload.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewVersionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || !selectedDocForVersion) return;

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('name', selectedDocForVersion.name);
    formData.append('entityType', 'client');
    formData.append('entityId', clientId);
    formData.append('category', selectedDocForVersion.category);
    formData.append('description', selectedDocForVersion.description || '');
    formData.append('changeNote', changeNote.trim() || 'New version upload');

    setLoading(true);
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });

      if (response.ok) {
        toast.success("New version uploaded successfully.");
        setSelectedDocForVersion(null);
        resetForm();
        fetchDocuments();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to upload new version.");
      }
    } catch (err) {
      toast.error("Network error during version upload.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document? All version mappings will be removed.")) return;
    
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        toast.success("Document deleted successfully.");
        fetchDocuments();
      } else {
        toast.error("Failed to delete document.");
      }
    } catch (err) {
      toast.error("Network error.");
    }
  };

  const handleDownload = async (docId, versionNumber = null) => {
    try {
      const url = `/api/documents/${docId}/download${versionNumber ? `?version=${versionNumber}` : ''}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) throw new Error("Could not download");
      const data = await res.json();
      
      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.target = '_blank';
      a.download = '';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      toast.error("Failed to retrieve signed download URL");
    }
  };

  const triggerPreview = (doc, ver = null) => {
    setPreviewFile({
      id: doc._id,
      documentId: doc._id,
      name: doc.name,
      mimeType: doc.mimeType,
      size: ver ? ver.size : doc.totalSize,
      version: ver ? ver.versionNumber : doc.currentVersion,
      entityType: doc.entityType,
      category: doc.category
    });
    setPreviewOpen(true);
  };

  const resetForm = () => {
    setDocName('');
    setDescription('');
    setCategory('contract');
    setAccessLevel('team');
    setTags('');
    setExpiresAt('');
    setChangeNote('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      
      {/* Action Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <File className="h-5 w-5 text-blue-500" />
            Document Store
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Store signed agreements, NDAs, deliverable specifications, and verification proofs.
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)} className="gap-2">
          <Upload className="h-4 w-4" />
          Add Document
        </Button>
      </div>

      {/* Documents List */}
      {loading && documents.length === 0 ? (
        <div className="flex justify-center items-center py-12 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
          Loading secure folder library...
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed text-center">
          <File className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
          <h4 className="font-bold text-slate-700 dark:text-slate-300">No Documents Uploaded</h4>
          <p className="text-sm text-slate-400 max-w-xs mt-1">
            This client does not have any NDA, Contract, or other assets associated yet.
          </p>
          <Button variant="outline" size="sm" onClick={() => setUploadDialogOpen(true)} className="mt-4">
            Upload First Document
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => {
            const isExpiring = doc.isExpiringSoon;
            const isExpanded = expandedDocs[doc._id];

            return (
              <div 
                key={doc._id} 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Main Doc Details */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl shrink-0">
                      <File className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base truncate max-w-md">
                          {doc.name}
                        </h4>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {CATEGORIES[doc.category] || doc.category}
                        </span>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                          v{doc.currentVersion}
                        </span>
                        {isExpiring && (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Expiring Soon
                          </span>
                        )}
                        {doc.isExpired && (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                            Expired
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-slate-400 mt-1 max-w-lg">
                        {doc.description || "No description provided."}
                      </p>

                      {/* Metadata Row */}
                      <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Shield className="h-3.5 w-3.5" />
                          {ACCESS_LEVELS[doc.accessLevel] || doc.accessLevel}
                        </span>
                        {doc.expiresAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Expires: {new Date(doc.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                        {doc.tags && doc.tags.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Tag className="h-3.5 w-3.5" />
                            {doc.tags.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <Button variant="outline" size="sm" onClick={() => triggerPreview(doc)} className="gap-1.5 h-8">
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(doc._id)} className="gap-1.5 h-8">
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedDocForVersion(doc)} className="gap-1.5 h-8">
                      <Upload className="h-3.5 w-3.5" />
                      New Version
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => toggleExpand(doc._id)} className="h-8 w-8">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    {['super_admin', 'admin'].includes(role) && (
                      <Button variant="outline" size="icon" onClick={() => handleDelete(doc._id)} className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Versions History sub-table */}
                {isExpanded && doc.versions && (
                  <div className="bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 p-5">
                    <h5 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <History className="h-3.5 w-3.5" />
                      Version History
                    </h5>
                    <div className="space-y-2.5">
                      {doc.versions.slice().reverse().map((ver) => (
                        <div 
                          key={ver._id} 
                          className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-700 dark:text-slate-300">Version {ver.versionNumber}</span>
                              {ver.isActive && (
                                <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded text-[10px]">
                                  Active
                                </span>
                              )}
                              <span className="text-slate-400">{formatBytes(ver.size)}</span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 mt-1 italic">
                              &ldquo;{ver.changeNote || 'No description provided'}&rdquo;
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              Uploaded at {new Date(ver.uploadedAt).toLocaleString()}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <button 
                              onClick={() => triggerPreview(doc, ver)}
                              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                              title="Preview this version"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDownload(doc._id, ver.versionNumber)}
                              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                              title="Download this version"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Upload document Modal dialog */}
      {uploadDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Add Client Document</h3>
              <button 
                type="button"
                onClick={() => { setUploadDialogOpen(false); resetForm(); }} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="flex-1 overflow-auto p-6 space-y-4">
              
              {/* File selection */}
              <div className="space-y-1.5">
                <label htmlFor="doc-file" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select File</label>
                <button 
                  type="button"
                  id="doc-file-trigger"
                  className="w-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-slate-50/50 dark:bg-slate-900/20 text-left"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2 mx-auto" />
                  {selectedFile ? (
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate max-w-xs">{selectedFile.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatBytes(selectedFile.size)}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Click to browse or drop file here</p>
                      <p className="text-xs text-slate-400 mt-1">Accepts PDFs, Office Docs, Images (Max 5MB)</p>
                    </div>
                  )}
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  id="doc-file"
                  className="hidden" 
                  onChange={handleFileChange}
                  required
                />
              </div>

              {/* Doc Title */}
              <div className="space-y-1.5">
                <label htmlFor="doc-name" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Document Title</label>
                <Input 
                  id="doc-name"
                  value={docName} 
                  onChange={(e) => setDocName(e.target.value)} 
                  placeholder="e.g. Master Services Agreement"
                  required
                />
              </div>

              {/* Row: Category & AccessLevel */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="doc-category" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</label>
                  <select 
                    id="doc-category"
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {Object.entries(CATEGORIES).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="doc-access" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Access Security</label>
                  <select 
                    id="doc-access"
                    value={accessLevel} 
                    onChange={(e) => setAccessLevel(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {Object.entries(ACCESS_LEVELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label htmlFor="doc-description" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea 
                  id="doc-description"
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize file purpose, contracts milestones, deliverables, etc."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              {/* Expiry Date */}
              <div className="space-y-1.5">
                <label htmlFor="doc-expires" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Expiration Date (Optional)</label>
                <Input 
                  id="doc-expires"
                  type="date"
                  value={expiresAt} 
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
                <p className="text-[10px] text-slate-400">
                  Systems will automatically notify the owner 30 days prior to contract expiration.
                </p>
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <label htmlFor="doc-tags" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tags (comma separated, max 5)</label>
                <Input 
                  id="doc-tags"
                  value={tags} 
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. signed, critical, 2026"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => { setUploadDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Uploading..." : "Save Document"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Version Upload Modal dialog */}
      {selectedDocForVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                Upload Version {selectedDocForVersion.currentVersion + 1}
              </h3>
              <button 
                type="button"
                onClick={() => { setSelectedDocForVersion(null); resetForm(); }} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleNewVersionSubmit} className="p-6 space-y-4">
              
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-xs space-y-1">
                <p><span className="font-bold">Document:</span> {selectedDocForVersion.name}</p>
                <p><span className="font-bold">Current Active:</span> Version {selectedDocForVersion.currentVersion}</p>
              </div>

              {/* File selection */}
              <div className="space-y-1.5">
                <label htmlFor="new-version-file" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select New File</label>
                <button 
                  type="button"
                  id="new-version-file-trigger"
                  className="w-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-slate-50/50 dark:bg-slate-900/20 text-left"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2 mx-auto" />
                  {selectedFile ? (
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate max-w-xs">{selectedFile.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatBytes(selectedFile.size)}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Click to browse or drop new version file</p>
                    </div>
                  )}
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  id="new-version-file"
                  className="hidden" 
                  onChange={handleFileChange}
                  required
                />
              </div>

              {/* Change Note */}
              <div className="space-y-1.5">
                <label htmlFor="change-note" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Version Change Notes</label>
                <textarea 
                  id="change-note"
                  value={changeNote} 
                  onChange={(e) => setChangeNote(e.target.value)}
                  placeholder="Describe amendments, corrections, updates made in this revision..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => { setSelectedDocForVersion(null); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Uploading..." : "Save Revision"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      <FilePreviewModal 
        file={previewFile}
        isOpen={previewOpen}
        onClose={() => { setPreviewOpen(false); setPreviewFile(null); }}
      />

    </div>
  );
}
