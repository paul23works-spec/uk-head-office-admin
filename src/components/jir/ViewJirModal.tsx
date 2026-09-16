'use client';

import React from 'react';
import { X, FileBadge, ShieldCheck } from 'lucide-react';
import { JirRecord } from '@/types';
import { DemoTag } from '../common/Badge';

interface ViewJirModalProps {
  isOpen: boolean;
  onClose: () => void;
  jir?: JirRecord;
}

export function ViewJirModal({ isOpen, onClose, jir }: ViewJirModalProps) {
  if (!isOpen || !jir) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0A192F] text-white flex items-center justify-between border-b border-[#152747]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 flex items-center justify-center text-blue-300 border border-blue-400/30">
              <FileBadge className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-editorial">{jir.jirNumber}</h3>
                <span
                  className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded ${
                    jir.status === 'Accepted'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                  }`}
                >
                  {jir.status}
                </span>
                <DemoTag label="STAGE 09" />
              </div>
              <p className="text-xs text-slate-400">
                {jir.projectCode} — {jir.projectName}
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
          {/* Verdict Banner */}
          <div
            className={`p-3.5 rounded-lg border flex items-center justify-between ${
              jir.status === 'Accepted' || jir.status === 'Completed'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : jir.status === 'Rejected'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block">
                  Quality Verdict: {jir.status}
                </span>
                <span className="text-[11px] opacity-80">
                  Witnessed &amp; Signed on {jir.inspectionDate}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-white/80 border border-current font-semibold">
              Ready for Stage 10 DI
            </span>
          </div>

          {/* Arithmetic Breakdown Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-3">
              Inspection Quantity Arithmetic Summary
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-3">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Offered Qty</span>
                <span className="text-sm font-bold font-mono text-slate-800 block mt-0.5">
                  {jir.offeredQuantity} {jir.unit}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Inspected Qty</span>
                <span className="text-sm font-bold font-mono text-blue-900 block mt-0.5">
                  {jir.inspectedQuantity} {jir.unit}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Accepted Qty</span>
                <span className="text-sm font-bold font-mono text-emerald-700 block mt-0.5">
                  {jir.acceptedQuantity} {jir.unit}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Rejected Qty</span>
                <span className="text-sm font-bold font-mono text-rose-700 block mt-0.5">
                  {jir.rejectedQuantity} {jir.unit}
                </span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-600 bg-white p-2 rounded border border-slate-200 flex justify-between">
              <span>Boundary Check: {jir.acceptedQuantity} + {jir.rejectedQuantity} ≤ {jir.inspectedQuantity} ≤ {jir.offeredQuantity}</span>
              <span className="font-bold text-slate-800">Unaccepted Balance: {jir.balanceQuantity} {jir.unit}</span>
            </div>
          </div>

          {/* Reference Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block">Inspection Order</span>
              <span className="font-mono text-slate-800 font-bold">{jir.inspectionOrderNumber}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block">Inspection Call</span>
              <span className="font-mono text-slate-800 font-bold">{jir.inspectionCallNumber}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block">Equipment &amp; PO</span>
              <span className="text-slate-800">{jir.material} ({jir.poNumber})</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block">Manufacturer</span>
              <span className="text-slate-800 font-medium">{jir.vendorName}</span>
            </div>
          </div>

          {/* Observations and Test Results */}
          <div className="space-y-3 text-xs">
            {jir.testResults && (
              <div>
                <span className="font-semibold text-slate-700 block mb-0.5">Witnessed Test Results</span>
                <p className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono">
                  {jir.testResults}
                </p>
              </div>
            )}

            {jir.observations && (
              <div>
                <span className="font-semibold text-slate-700 block mb-0.5">Observations &amp; Findings</span>
                <p className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                  {jir.observations}
                </p>
              </div>
            )}

            {jir.remarks && (
              <div>
                <span className="font-semibold text-slate-700 block mb-0.5">Final Recommendations</span>
                <p className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                  {jir.remarks}
                </p>
              </div>
            )}
          </div>

          {/* Close */}
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
