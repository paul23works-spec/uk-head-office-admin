'use client';

import React from 'react';
import { FileText, Lock, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { INITIAL_DOCUMENTS } from '@/lib/mock-data';
import { DemoTag } from '../common/Badge';

interface DocumentsPlaceholderProps {
  projectId: string;
}

export function DocumentsPlaceholder({ projectId }: DocumentsPlaceholderProps) {
  // Demo documents for this project
  const docs = INITIAL_DOCUMENTS.filter((d) => d.projectId === projectId || d.projectId === 'PRJ-2024-001');

  return (
    <div className="enterprise-card rounded-xl p-6 border border-slate-200 bg-white space-y-6">
      {/* Header & Disabled Upload Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 font-editorial">
              Project Documents &amp; Records
            </h3>
            <DemoTag />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Administrative filing repository for NIT, LOA, CPG, and technical submittals
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled
            title="Real document storage engine scheduled for future phases"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-100 text-slate-400 border border-slate-200 text-xs font-semibold cursor-not-allowed opacity-75"
          >
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Upload Document</span>
            <span className="text-[9px] bg-slate-200 text-slate-600 px-1 rounded">Phase 2</span>
          </button>
        </div>
      </div>

      {/* Phase 1 Notice */}
      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2.5 text-xs text-slate-600">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          <strong className="text-slate-800">Document Filing Notice:</strong> In Phase 1, document listings represent demonstration metadata. Cloud file storage and binary downloads are intentionally deferred to future phases.
        </span>
      </div>

      {/* Documents Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Document Title</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Type / Size</th>
              <th className="py-3 px-4">Uploaded By</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {docs.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4 font-medium text-slate-900">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate max-w-xs">{doc.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-slate-600">{doc.category}</td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                  {doc.fileType} • {doc.fileSize}
                </td>
                <td className="py-3 px-4 text-slate-600">{doc.uploadedBy}</td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{doc.uploadDate}</td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                      doc.status === 'Verified'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {doc.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span
                    title="Storage engine deferred"
                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 cursor-not-allowed font-medium"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Locked</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
