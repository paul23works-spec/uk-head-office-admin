'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  FileCheck,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  Edit2,
  Save,
} from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { LoiLoaRecord, LoiLoaStatus } from '@/types';
import { DemoTag } from '../common/Badge';

interface ViewLoiLoaModalProps {
  loi: LoiLoaRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateAcceptance?: (loi: LoiLoaRecord) => void;
}

export function ViewLoiLoaModal({
  loi,
  isOpen,
  onClose,
  onOpenCreateAcceptance,
}: ViewLoiLoaModalProps) {
  const { updateLoiLoa, getAcceptanceByProjectId, getCpgByProjectId, getAgreementByProjectId } = useProjects();
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<LoiLoaStatus>('Received');
  const [remarks, setRemarks] = useState('');
  const [saveFeedback, setSaveFeedback] = useState('');

  if (!isOpen || !loi) return null;

  const linkedAcceptance = getAcceptanceByProjectId(loi.projectId);
  const linkedCpg = getCpgByProjectId(loi.projectId);
  const linkedAgreement = getAgreementByProjectId(loi.projectId);

  const startEdit = () => {
    setStatus(loi.status);
    setRemarks(loi.remarks);
    setIsEditing(true);
  };

  const handleSave = () => {
    updateLoiLoa(loi.id, { status, remarks });
    setSaveFeedback('LOI / LOA record updated.');
    setIsEditing(false);
    setTimeout(() => setSaveFeedback(''), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="view-loi-title"
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
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="view-loi-title" className="text-base font-bold font-editorial tracking-tight text-white">
                  {loi.loiNumber}
                </h2>
                <DemoTag />
              </div>
              <p className="text-xs text-slate-300">
                Stage 02 Record • Dated {loi.date}
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
          {/* Upstream Relationships Card */}
          <div className="p-4 rounded-lg bg-blue-50/70 border border-blue-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-blue-200/60">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-800 tracking-wider">
                  Linked Project
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  {loi.projectCode} — {loi.projectName}
                </h3>
              </div>
              <Link
                href={`/projects/${loi.projectId}`}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-blue-300 text-blue-700 font-semibold text-xs hover:bg-blue-100/60 transition-colors self-start sm:self-auto"
              >
                <span>View Project</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <span>Upstream Tender Ref: <strong>{loi.tenderNumber}</strong></span>
              </span>
              <Link
                href="/tenders"
                onClick={onClose}
                className="text-blue-700 font-semibold hover:underline"
              >
                View in Tenders →
              </Link>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium block">Contract Value</span>
              <span className="text-sm font-bold text-slate-900 font-editorial block mt-0.5">
                {loi.contractValue}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium block">Award Date</span>
              <span className="text-xs font-mono text-slate-700 block mt-0.5">
                {loi.date}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium block">LOI Status</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 mt-0.5">
                {loi.status}
              </span>
            </div>

            <div className="sm:col-span-2">
              <span className="text-[10px] text-slate-400 uppercase font-medium block">Issuing Client</span>
              <span className="text-xs font-semibold text-slate-800 block mt-0.5">
                {loi.client}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium block">Reference</span>
              <span className="text-xs text-slate-600 block mt-0.5 truncate" title={loi.referenceDetails}>
                {loi.referenceDetails}
              </span>
            </div>
          </div>

          {/* Downstream Stage Connections: Acceptance & CPG/Agreement */}
          <div className="space-y-3">
            <span className="font-bold text-slate-800 block">Connected Downstream Stages</span>

            {/* Stage 03 Acceptance */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-[10px]">
                  03
                </span>
                <div>
                  <span className="font-semibold text-slate-800 block">Stage 03: Formal Acceptance</span>
                  {linkedAcceptance ? (
                    <span className="text-[11px] text-emerald-700 font-medium">
                      Ref: {linkedAcceptance.acceptanceRef} ({linkedAcceptance.status})
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-700 font-medium">
                      Acceptance not yet submitted
                    </span>
                  )}
                </div>
              </div>

              {linkedAcceptance ? (
                <Link
                  href="/acceptance"
                  onClick={onClose}
                  className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
                >
                  View Acceptance →
                </Link>
              ) : (
                onOpenCreateAcceptance && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCreateAcceptance(loi);
                    }}
                    className="px-2.5 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold cursor-pointer"
                  >
                    + Log Acceptance
                  </button>
                )
              )}
            </div>

            {/* Stage 04 CPG + Agreement */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded bg-purple-100 text-purple-800 font-bold flex items-center justify-center text-[10px]">
                  04
                </span>
                <div>
                  <span className="font-semibold text-slate-800 block">Stage 04: CPG + Agreement</span>
                  <span className="text-[11px] text-slate-500">
                    CPG: {linkedCpg ? linkedCpg.status : 'Pending'} • Agreement: {linkedAgreement ? linkedAgreement.status : 'Pending'}
                  </span>
                </div>
              </div>

              <Link
                href="/cpg-agreement"
                onClick={onClose}
                className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
              >
                View Stage 04 →
              </Link>
            </div>
          </div>

          {/* Document Records */}
          <div className="space-y-2">
            <span className="font-bold text-slate-800 block">Associated Document Metadata</span>
            {loi.documents && loi.documents.length > 0 ? (
              <div className="space-y-1.5">
                {loi.documents.map((doc) => (
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
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">LOI / LOA Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as LoiLoaStatus)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Received">Received</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Accepted">Accepted</option>
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
                {loi.remarks || 'No remarks recorded for this LOI / LOA.'}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs">
          <span className="font-mono text-slate-400">
            ID: {loi.id} • Updated: {loi.updatedAt}
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
