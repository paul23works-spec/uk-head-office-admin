'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  ScrollText,
  ExternalLink,
  FileText,
  Calendar,
  CheckCircle2,
  Edit2,
  Save,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { AgreementRecord, AgreementStatus } from '@/types';
import { DemoTag } from '../common/Badge';

interface ViewAgreementModalProps {
  agreement: AgreementRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ViewAgreementModal({ agreement, isOpen, onClose }: ViewAgreementModalProps) {
  const { updateAgreement, getCpgByProjectId } = useProjects();
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<AgreementStatus>('Executed');
  const [remarks, setRemarks] = useState('');
  const [saveFeedback, setSaveFeedback] = useState('');

  if (!isOpen || !agreement) return null;

  const linkedCpg = getCpgByProjectId(agreement.projectId);

  const startEdit = () => {
    setStatus(agreement.status);
    setRemarks(agreement.remarks);
    setIsEditing(true);
  };

  const handleSave = () => {
    updateAgreement(agreement.id, { status, remarks });
    setSaveFeedback('Contract Agreement updated successfully.');
    setIsEditing(false);
    setTimeout(() => setSaveFeedback(''), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="view-agreement-title"
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
            <div className="p-2 rounded-lg bg-teal-600/30 text-teal-300 border border-teal-400/30">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="view-agreement-title" className="text-base font-bold font-editorial tracking-tight text-white">
                  {agreement.agreementRef}
                </h2>
                <DemoTag />
              </div>
              <p className="text-xs text-slate-300">
                Stage 04: Contract Agreement Execution
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

        <div className="p-6 space-y-5">
          {/* Key Metrics Header */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                Execution Date
              </div>
              <div className="text-xs font-bold text-slate-900 mt-1">
                {agreement.agreementDate}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Agreement Status
              </div>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                    agreement.status === 'Executed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : agreement.status === 'Under Preparation'
                      ? 'bg-blue-100 text-blue-800'
                      : agreement.status === 'Closed'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {agreement.status}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-slate-400" />
                Associated CPG
              </div>
              <div className="mt-1 text-xs font-bold text-slate-900 truncate">
                {linkedCpg ? linkedCpg.cpgRef : 'Not Lodged'}
              </div>
            </div>
          </div>

          {/* Upstream Lineage Link */}
          <div className="p-3.5 bg-teal-50/70 border border-teal-100 rounded-lg">
            <div className="text-[11px] font-semibold text-teal-900 mb-1 flex items-center justify-between">
              <span>Contract Linkage & Lineage</span>
              <span className="text-[10px] text-teal-600">Stage 04 of 13</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-teal-800">
              <Link
                href={`/projects/${agreement.projectId}`}
                className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-900 underline underline-offset-2"
              >
                <span>Project: {agreement.projectCode}</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <span className="text-teal-300">•</span>
              <span>Name: {agreement.projectName}</span>
              {agreement.loiLoaNumber && (
                <>
                  <span className="text-teal-300">•</span>
                  <Link
                    href="/loi-loa"
                    className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 underline underline-offset-2"
                  >
                    <span>LOI: {agreement.loiLoaNumber}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Detailed Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs border border-slate-200 rounded-lg p-4 bg-slate-50/50">
            <div>
              <span className="text-slate-500 font-medium">Agreement Reference:</span>
              <p className="font-semibold text-slate-800 mt-0.5">{agreement.agreementRef}</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Date of Bilateral Signing:</span>
              <p className="font-semibold text-slate-800 mt-0.5">{agreement.agreementDate}</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Governing Law / Format:</span>
              <p className="font-semibold text-slate-800 mt-0.5">Indian Contract Act / Non-Judicial Stamp</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Co-Stage CPG Guarantee:</span>
              <p className="font-semibold text-slate-800 mt-0.5">
                {linkedCpg ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    CPG Submitted ({linkedCpg.cpgRef})
                  </span>
                ) : (
                  <span className="text-amber-700 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    CPG Pending Submission
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Edit State / Remarks */}
          {isEditing ? (
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-lg space-y-3">
              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Edit2 className="w-3.5 h-3.5" />
                <span>Modify Agreement Details</span>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Agreement Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AgreementStatus)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="Draft">Draft</option>
                  <option value="Under Preparation">Under Preparation</option>
                  <option value="Executed">Executed</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Administrative Remarks
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700">Contractual Remarks</span>
                <button
                  onClick={startEdit}
                  className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 font-semibold cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit Record</span>
                </button>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed">
                {agreement.remarks || 'No remarks provided.'}
              </div>
            </div>
          )}

          {/* Attached Files */}
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-2">
              Attached Executed Contract Agreement Files ({agreement.documents?.length || 0})
            </div>
            {agreement.documents && agreement.documents.length > 0 ? (
              <div className="space-y-2">
                {agreement.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-2.5 border border-slate-200 rounded-lg bg-white text-xs hover:border-teal-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                      <div>
                        <span className="font-medium text-slate-800">{doc.name}</span>
                        <div className="text-[10px] text-slate-400">
                          {doc.type} • {doc.fileSize} • Uploaded {doc.uploadedDate}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded font-mono">
                      DEMO ATTACHMENT
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No agreement files attached.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs">
          <div className="text-slate-500">
            Record ID: <span className="font-mono">{agreement.id}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
