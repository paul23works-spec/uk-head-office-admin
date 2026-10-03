'use client';

import React, { useEffect, useState, useRef } from 'react';
import { FileText, Lock, ShieldAlert, CheckCircle2, AlertCircle, UploadCloud } from 'lucide-react';

interface DocumentsPlaceholderProps {
  projectId: string;
}

export function DocumentsPlaceholder({ projectId }: DocumentsPlaceholderProps) {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedType, setSelectedType] = useState('Letter of Intent');

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/documents?projectId=${projectId}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setDocs(json.data);
      }
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchDocs();
    }
  }, [projectId]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setUploadError('File too large. Maximum size is 50MB.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // 1. Get signed URL
      const urlRes = await fetch('/api/documents/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
          projectId,
          documentType: selectedType
        })
      });
      const urlJson = await urlRes.json();

      if (!urlJson.success) {
        throw new Error(urlJson.error || 'Failed to get upload URL');
      }

      const { signedUrl, storageKey, sanitizedFilename } = urlJson.data;

      // 2. Upload file directly to Supabase
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload file to storage');
      }

      // 3. Confirm upload with our backend
      const confirmRes = await fetch('/api/documents/confirm-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storageKey,
          filename: sanitizedFilename,
          documentType: selectedType,
          projectId
        })
      });
      
      const confirmJson = await confirmRes.json();
      if (!confirmJson.success) {
        throw new Error(confirmJson.error || 'Failed to confirm upload');
      }

      // 4. Refresh documents
      await fetchDocs();
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Upload process failed:', error);
      setUploadError(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="enterprise-card rounded-xl p-6 border border-slate-200 bg-white space-y-6">
      {/* Header & Upload Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 font-editorial">
              Project Documents &amp; Records
            </h3>
            
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Administrative filing repository for NIT, LOA, CPG, and technical submittals
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
          {uploadError && (
            <span className="text-xs text-red-500 flex items-center gap-1 bg-red-50 px-2 py-1 rounded">
              <AlertCircle className="w-3 h-3" />
              {uploadError}
            </span>
          )}
          
          <div className="flex items-center gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              disabled={uploading}
              className="text-xs border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 px-3 py-1.5"
            >
              <option value="Letter of Intent">Letter of Intent</option>
              <option value="Contract Agreement">Contract Agreement</option>
              <option value="Progressive Bill">Progressive Bill</option>
              <option value="Inspection Report">Inspection Report</option>
              <option value="Other">Other</option>
            </select>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            />
            
            <button
              onClick={handleUploadClick}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white border border-transparent text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{uploading ? 'Uploading...' : 'Upload Document'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Document Title</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Uploaded By</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Processing Status</th>
              <th className="py-3 px-4">Review Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  Loading documents...
                </td>
              </tr>
            ) : docs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No documents found.
                </td>
              </tr>
            ) : (
              docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="truncate max-w-xs">{doc.filename || doc.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{doc.documentType || doc.category || '-'}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                    {doc.fileType || 'PDF'}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{doc.uploadedBy || '-'}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                    {doc.createdAt ? new Date(doc.createdAt).toISOString().split('T')[0] : (doc.uploadDate || '-')}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                        doc.processingStatus === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : doc.processingStatus === 'PROCESSING'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : doc.processingStatus === 'FAILED'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {doc.processingStatus || 'PENDING'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                        doc.status === 'Verified' || doc.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {doc.status || 'Verified'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
