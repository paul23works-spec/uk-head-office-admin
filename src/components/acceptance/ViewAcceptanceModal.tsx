'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  FileSignature,
  ExternalLink,
  FileText,
  FileCheck,
  CheckCircle2,
  Edit2,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { AcceptanceRecord, AcceptanceStatus } from '@/types';
import { DemoTag } from '../common/Badge';

interface ViewAcceptanceModalProps {
  acceptance: AcceptanceRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ViewAcceptanceModal({
  acceptance,
  isOpen,
  onClose,
}: ViewAcceptanceModalProps) {
  const { updateAcceptance, getCpgByProjectId, getAgreementByProjectId } = useProjects();
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<AcceptanceStatus>('Accepted');
  const [remarks, setRemarks] = useState('');
  const [saveFeedback, setSaveFeedback] = useState('');

  if (!isOpen || !acceptance) return null;

  const linkedCpg = getCpgByProjectId(acceptance.projectId);
  const linkedAgreement = getAgreementByProjectId(acceptance.projectId);

  const startEdit = () => {
    setStatus(acceptance.status);
    setRemarks(acceptance.remarks);
    setIsEditing(true);
  };

  const handleSave = () => {
    updateAcceptance(acceptance.id, { status, remarks });
    setSaveFeedback('Acceptance record updated.');
    setIsEditing(false);
    setTimeout(() => setSaveFeedback(''), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="view-acceptance-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#0A192F] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/30 text-blue-300 border border-blue-400/30">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="view-acceptance-title" className="text-base font-bold font-editorial tracking-tight text-white">
                  {acceptance.acceptanceRef}
                </h2>
                <DemoTag />
              </div>
              <p className="text-xs text-slate-300">
                Stage 03 Record • Submitted {acceptance.acceptanceDate}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback alert */}
        {saveFeedback && (
          <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveFeedback}</span>
          </div>
        )}

        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto text-xs">
          {/* Upstream Relationships */}
          <div className="p-4 rounded-lg bg-blue-50/70 border border-blue-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-blue-200/60">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-800 tracking-wider">
                  Linked Parent Project
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  {acceptance.projectCode} — {acceptance.projectName}
                </h3>
              </div>
              <Link
                href={`/projects/${acceptance.projectId}`}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-blue-300 text-blue-700 font-semibold text-xs hover:bg-blue-100/60 transition-colors self-start sm:self-auto"
              >
                <span>View Project</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <span>Upstream LOI / LOA: <strong>{acceptance.loiLoaNumber}</strong></span>
              </span>
              <Link
                href="/loi-loa"
                onClick={onClose}
                className="text-blue-700 font-semibold hover:underline"
              >
                View in LOI/LOA →
              </Link>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium block">Acceptance Ref</span>
              <span className="text-xs font-mono font-bold text-slate-900 block mt-0.5">
                {acceptance.acceptanceRef}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium block">Submission Date</span>
              <span className="text-xs font-mono text-slate-700 block mt-0.5">
                {acceptance.acceptanceDate}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium block">Acceptance Status</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 mt-0.5">
                {acceptance.status}
              </span>
            </div>

            <div className="sm:col-span-3">
              <span className="text-[10px] text-slate-400 uppercase font-medium block">Client Authority</span>
              <span className="text-xs font-semibold text-slate-800 block mt-0.5">
                {acceptance.client}
              </span>
            </div>
          </div>

          {/* Downstream Stage 04 Connection */}
          <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Connected Downstream Stage 04: CPG + Agreement</span>
              </span>
              <Link
                href="/cpg-agreement"
                onClick={onClose}
                className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
              >
                Open Stage 04 →
              </Link>
            </div>
            <p className="text-[11px] text-slate-600">
              CPG Status: <strong>{linkedCpg ? linkedCpg.status : 'Pending'}</strong> • Agreement Status:{' '}
              <strong>{linkedAgreement ? linkedAgreement.status : 'Pending'}</strong>
            </p>
          </div>

          {/* Documents */}
          <div className="space-y-2">
            <span className="font-bold text-slate-800 block">Attached Document Metadata</span>
            {acceptance.documents && acceptance.documents.length > 0 ? (
              <div className="space-y-1.5">
                {acceptance.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <span className="font-mono font-medium text-slate-800 block">
                          {doc.name}
                        </span>
                        {doc.remarks && <span className="text-[10px] text-slate-500">{doc.remarks}</span>}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {doc.uploadedDate}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic">No document metadata records attached.</p>
            )}
          </div>

          {/* Remarks & Quick Edit */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Administrative Remarks</span>
              {!isEditing ? (
                <button
                  onClick={startEdit}
                  className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Status / Remarks</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Acceptance Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as AcceptanceStatus)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Returned">Returned</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Remarks</label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                  />
                </div>
              </div>
            ) : (
              <p className="text-slate-600 leading-relaxed">
                {acceptance.remarks || 'No remarks recorded for this acceptance filing.'}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs">
          <span className="font-mono text-slate-400">
            ID: {acceptance.id} • Updated: {acceptance.updatedAt}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
