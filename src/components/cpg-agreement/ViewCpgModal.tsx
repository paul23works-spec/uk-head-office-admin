'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  ShieldCheck,
  ExternalLink,
  FileText,
  Building2,
  Calendar,
  IndianRupee,
  CheckCircle2,
  Edit2,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { CpgRecord, CpgStatus } from '@/types';
import { DemoTag } from '../common/Badge';

interface ViewCpgModalProps {
  cpg: CpgRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ViewCpgModal({ cpg, isOpen, onClose }: ViewCpgModalProps) {
  const { updateCpg, getAgreementByProjectId } = useProjects();
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<CpgStatus>('Valid');
  const [remarks, setRemarks] = useState('');
  const [validityDate, setValidityDate] = useState('');
  const [saveFeedback, setSaveFeedback] = useState('');

  if (!isOpen || !cpg) return null;

  const linkedAgreement = getAgreementByProjectId(cpg.projectId);

  const startEdit = () => {
    setStatus(cpg.status);
    setRemarks(cpg.remarks);
    setValidityDate(cpg.validityDate);
    setIsEditing(true);
  };

  const handleSave = () => {
    updateCpg(cpg.id, { status, remarks, validityDate });
    setSaveFeedback('CPG record updated successfully.');
    setIsEditing(false);
    setTimeout(() => setSaveFeedback(''), 2500);
  };

  const isExpired = new Date(cpg.validityDate) < new Date();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="view-cpg-title"
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
            <div className="p-2 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-400/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="view-cpg-title" className="text-base font-bold font-editorial tracking-tight text-white">
                  {cpg.cpgRef}
                </h2>
                <DemoTag />
              </div>
              <p className="text-xs text-slate-300">
                Stage 04: Contract Performance Guarantee (Bank Guarantee)
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <IndianRupee className="w-3 h-3 text-slate-400" />
                Guarantee Value
              </div>
              <div className="text-sm font-bold text-slate-900 mt-1">
                {cpg.cpgAmount || 'N/A'}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-400" />
                Issuing Bank
              </div>
              <div className="text-xs font-bold text-slate-900 mt-1 truncate" title={cpg.bankName}>
                {cpg.bankName || 'SBI'}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                Valid Until
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs font-bold text-slate-900">{cpg.validityDate}</span>
                {isExpired && (
                  <span className="text-[10px] text-rose-600 font-bold" title="Expired BG">
                    (Expired)
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Status
              </div>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                    cpg.status === 'Valid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : cpg.status === 'Submitted' || cpg.status === 'Under Verification'
                      ? 'bg-blue-100 text-blue-800'
                      : cpg.status === 'Released'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {cpg.status}
                </span>
              </div>
            </div>
          </div>

          {/* Workflow Alignment Bar */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-lg">
            <div className="text-[11px] font-semibold text-indigo-900 mb-1 flex items-center justify-between">
              <span>Upstream Administrative Trail</span>
              <span className="text-[10px] text-indigo-600">Stage 04 of 13</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-indigo-800">
              <Link
                href={`/projects/${cpg.projectId}`}
                className="inline-flex items-center gap-1 font-semibold text-indigo-700 hover:text-indigo-900 underline underline-offset-2"
              >
                <span>Project: {cpg.projectCode}</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <span className="text-indigo-300">•</span>
              <span>Name: {cpg.projectName}</span>
              {cpg.loiLoaNumber && (
                <>
                  <span className="text-indigo-300">•</span>
                  <Link
                    href="/loi-loa"
                    className="inline-flex items-center gap-1 text-indigo-700 hover:text-indigo-900 underline underline-offset-2"
                  >
                    <span>LOI: {cpg.loiLoaNumber}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Detailed Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs border border-slate-200 rounded-lg p-4 bg-slate-50/50">
            <div>
              <span className="text-slate-500 font-medium">Guarantee Reference (BG Ref):</span>
              <p className="font-semibold text-slate-800 mt-0.5">{cpg.cpgRef}</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Issuance Date:</span>
              <p className="font-semibold text-slate-800 mt-0.5">{cpg.cpgDate}</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Submission to Client:</span>
              <p className="font-semibold text-slate-800 mt-0.5">{cpg.submissionDate}</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Validity Expiry:</span>
              <p className="font-semibold text-slate-800 mt-0.5">{cpg.validityDate}</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Issuing Bank & Branch:</span>
              <p className="font-semibold text-slate-800 mt-0.5">{cpg.bankName || 'State Bank of India'}</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Co-Stage Agreement Status:</span>
              <p className="font-semibold text-slate-800 mt-0.5">
                {linkedAgreement ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Agreement Executed ({linkedAgreement.agreementRef})
                  </span>
                ) : (
                  <span className="text-amber-700 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Agreement Pending
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
                <span>Modify CPG Record</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    CPG Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as CpgStatus)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Under Verification">Under Verification</option>
                    <option value="Valid">Valid</option>
                    <option value="Expired">Expired</option>
                    <option value="Released">Released</option>
                    <option value="Invoked">Invoked</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Validity Date
                  </label>
                  <input
                    type="date"
                    value={validityDate}
                    onChange={(e) => setValidityDate(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
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
                <span className="text-xs font-semibold text-slate-700">Administrative Remarks</span>
                <button
                  onClick={startEdit}
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit Record</span>
                </button>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed">
                {cpg.remarks || 'No remarks provided.'}
              </div>
            </div>
          )}

          {/* Documents Attached */}
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-2">
              Attached Verification & Guarantee Files ({cpg.documents?.length || 0})
            </div>
            {cpg.documents && cpg.documents.length > 0 ? (
              <div className="space-y-2">
                {cpg.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-2.5 border border-slate-200 rounded-lg bg-white text-xs hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div>
                        <span className="font-medium text-slate-800">{doc.name}</span>
                        <div className="text-[10px] text-slate-400">
                          {doc.type} • {doc.fileSize} • Uploaded {doc.uploadedDate}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-mono">
                      DEMO ATTACHMENT
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No document files attached.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs">
          <div className="text-slate-500">
            Record ID: <span className="font-mono">{cpg.id}</span>
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
