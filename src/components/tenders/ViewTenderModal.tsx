'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  FileSpreadsheet,
  ExternalLink,
  FileText,
  FileCheck,
  Building,
  MapPin,
  CheckCircle2,
  Edit2,
  Save,
} from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { TenderRecord, TenderStatus, TenderL1Status } from '@/types';
import { DemoTag } from '../common/Badge';

interface ViewTenderModalProps {
  tender: TenderRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateLoi?: (tender: TenderRecord) => void;
}

export function ViewTenderModal({
  tender,
  isOpen,
  onClose,
  onOpenCreateLoi,
}: ViewTenderModalProps) {
  const { updateTender, getLoiLoaByProjectId } = useProjects();
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<TenderStatus>('Published');
  const [l1Status, setL1Status] = useState<TenderL1Status>('Not Determined');
  const [remarks, setRemarks] = useState('');
  const [saveFeedback, setSaveFeedback] = useState('');

  if (!isOpen || !tender) return null;

  const linkedLoi = getLoiLoaByProjectId(tender.projectId);

  const startEdit = () => {
    setStatus(tender.status);
    setL1Status(tender.l1Status);
    setRemarks(tender.remarks);
    setIsEditing(true);
  };

  const handleSave = () => {
    updateTender(tender.id, {
      status,
      l1Status,
      remarks,
    });
    setSaveFeedback('Tender status and administrative remarks updated.');
    setIsEditing(false);
    setTimeout(() => setSaveFeedback(''), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="view-tender-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#0A192F] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/30 text-blue-300 border border-blue-400/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="view-tender-title" className="text-base font-bold font-editorial tracking-tight text-white">
                  {tender.tenderNumber}
                </h2>
                <DemoTag />
              </div>
              <p className="text-xs text-slate-300">
                Stage 01 Record • Registered {tender.tenderDate}
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
          {/* Linked Parent Project Card */}
          <div className="p-4 rounded-lg bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-800 tracking-wider">
                Linked Parent Project
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                {tender.projectCode} — {tender.projectName}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Client: {tender.client} • Location: {tender.location}
              </p>
            </div>
            <Link
              href={`/projects/${tender.projectId}`}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-blue-300 text-blue-700 font-semibold text-xs hover:bg-blue-100/60 transition-colors shrink-0"
            >
              <span>View Project</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Key Attributes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium block">Tender Value</span>
              <span className="text-sm font-bold text-slate-900 font-editorial block mt-0.5">
                {tender.tenderValue}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium block">Estimated Budget</span>
              <span className="text-xs font-semibold text-slate-700 block mt-0.5">
                {tender.estimatedValue || 'Not specified'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium block">Tender Status</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 mt-0.5">
                {tender.status}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium block">L1 Qualification</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold mt-0.5 ${
                tender.l1Status === 'L1'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {tender.l1Status}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium block">Opening Date</span>
              <span className="text-xs font-mono text-slate-700 block mt-0.5">
                {tender.openingDate}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium block">Closing Due Date</span>
              <span className="text-xs font-mono text-slate-700 block mt-0.5">
                {tender.closingDate}
              </span>
            </div>
          </div>

          {/* Department and Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 bg-white">
              <Building className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">Department / Authority</span>
                <span className="font-semibold text-slate-800">{tender.department}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 bg-white">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">Location</span>
                <span className="font-semibold text-slate-800">{tender.location}</span>
              </div>
            </div>
          </div>

          {/* Downstream Stage 02 LOI/LOA Connection */}
          <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <span>Connected Downstream Stage 02: LOI / LOA</span>
              </span>
              {linkedLoi ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  LOI/LOA Recorded
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                  Pending Stage 02
                </span>
              )}
            </div>

            {linkedLoi ? (
              <div className="p-3 rounded bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-mono font-bold text-xs text-slate-800">
                    {linkedLoi.loiNumber}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Dated {linkedLoi.date} • Contract Value: {linkedLoi.contractValue} • Status: {linkedLoi.status}
                  </p>
                </div>
                <Link
                  href="/loi-loa"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold shrink-0"
                >
                  View in LOI/LOA Module →
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 rounded bg-amber-50/60 border border-amber-200 text-xs text-amber-900">
                <span>No LOI / LOA has been registered for this tender yet.</span>
                {onOpenCreateLoi && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCreateLoi(tender);
                    }}
                    className="px-3 py-1.5 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shrink-0 cursor-pointer"
                  >
                    + Register LOI/LOA
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Document Records */}
          <div className="space-y-2">
            <span className="font-bold text-slate-800 block">Associated Document Metadata</span>
            {tender.documents && tender.documents.length > 0 ? (
              <div className="space-y-1.5">
                {tender.documents.map((doc) => (
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

          {/* Remarks & Quick Edit Form */}
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tender Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as TenderStatus)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                      <option value="Submitted">Submitted</option>
                      <option value="Under Evaluation">Under Evaluation</option>
                      <option value="L1">L1</option>
                      <option value="Awarded">Awarded</option>
                      <option value="Not Awarded">Not Awarded</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">L1 Status</label>
                    <select
                      value={l1Status}
                      onChange={(e) => setL1Status(e.target.value as TenderL1Status)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                    >
                      <option value="Not Determined">Not Determined</option>
                      <option value="L1">L1</option>
                      <option value="Not L1">Not L1</option>
                    </select>
                  </div>
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
                {tender.remarks || 'No remarks logged for this tender record.'}
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs">
          <span className="font-mono text-slate-400">
            ID: {tender.id} • Updated: {tender.updatedAt}
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
