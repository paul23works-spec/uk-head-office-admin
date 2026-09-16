'use client';

import React from 'react';
import { X, Cpu, History, FileText, CheckCircle2 } from 'lucide-react';
import { GtpRecord } from '@/types';
import { useProjects } from '@/lib/project-context';
import { DemoTag } from '../common/Badge';

interface ViewGtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  gtp?: GtpRecord;
}

export function ViewGtpModal({ isOpen, onClose, gtp }: ViewGtpModalProps) {
  const { gtps, boqItems } = useProjects();

  if (!isOpen || !gtp) return null;

  // All revisions for this BOQ item
  const revisionsForThisItem = gtps
    .filter((g) => g.boqItemId === gtp.boqItemId)
    .sort((a, b) => b.revision.localeCompare(a.revision));

  const boq = boqItems.find((b) => b.id === gtp.boqItemId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0A192F] text-white flex items-center justify-between border-b border-[#152747]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 flex items-center justify-center text-blue-300 border border-blue-400/30">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-editorial">{gtp.gtpNumber}</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {gtp.revision}
                </span>
                <DemoTag label="STAGE 05" />
              </div>
              <p className="text-xs text-slate-400">
                {gtp.projectCode} — {gtp.projectName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status Alert Banner */}
          <div
            className={`p-3 rounded-lg border flex items-center justify-between ${
              gtp.status === 'Approved'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : gtp.status === 'Rejected'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block">
                  Status: {gtp.status}
                </span>
                <span className="text-[11px] opacity-80">
                  Submitted on {gtp.submissionDate} • Revision {gtp.revision}
                </span>
              </div>
            </div>
            {gtp.previousRevisionRef && (
              <span className="text-[10px] font-mono bg-white/70 px-2 py-1 rounded border border-current">
                Supersedes: {gtp.previousRevisionRef}
              </span>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-[11px] text-slate-500 font-semibold block">Material / Equipment</span>
              <p className="font-bold text-slate-900 mt-0.5">{gtp.materialItem}</p>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-semibold block">Manufacturing Vendor</span>
              <p className="font-bold text-slate-900 mt-0.5">{gtp.vendorName}</p>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-semibold block">Linked BOQ Item</span>
              <p className="font-mono text-slate-700 mt-0.5">
                Item {gtp.boqItemNumber} {boq ? `(${boq.quantity} ${boq.unit})` : ''}
              </p>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-semibold block">Revision Date</span>
              <p className="font-mono text-slate-700 mt-0.5">{gtp.revisionDate}</p>
            </div>
          </div>

          {/* Remarks */}
          {gtp.remarks && (
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">Compliance Remarks</span>
              <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200 mt-0.5">
                {gtp.remarks}
              </p>
            </div>
          )}

          {/* Revision History for this Item */}
          <div className="pt-3 border-t border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-2">
              <History className="w-3.5 h-3.5" />
              <span>Revision Trail for this Equipment ({revisionsForThisItem.length})</span>
            </span>

            <div className="space-y-1.5">
              {revisionsForThisItem.map((rev) => {
                const isCurrent = rev.id === gtp.id;
                return (
                  <div
                    key={rev.id}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                      isCurrent
                        ? 'bg-blue-50/70 border-blue-300 font-medium'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-white border border-slate-300">
                        {rev.revision}
                      </span>
                      <span className="font-mono">{rev.gtpNumber}</span>
                      <span className="text-slate-400">•</span>
                      <span>{rev.submissionDate}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          rev.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rev.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {rev.status}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] text-blue-700 font-bold">(Viewing)</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Attached Documents Placeholder */}
          <div className="pt-3 border-t border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-2">
              <FileText className="w-3.5 h-3.5" />
              <span>Technical Drawings &amp; Data Sheets</span>
            </span>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span>{gtp.gtpNumber}_Technical_Drawings_{gtp.revision}.pdf</span>
              <span className="text-[10px] font-mono text-slate-400">PDF • 3.2 MB • Verified</span>
            </div>
          </div>

          {/* Close Action */}
          <div className="pt-3 border-t border-slate-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
