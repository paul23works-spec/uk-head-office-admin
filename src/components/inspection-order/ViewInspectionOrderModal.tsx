'use client';

import React from 'react';
import { X, ClipboardCheck, FileBadge } from 'lucide-react';
import { InspectionOrderRecord } from '@/types';
import { useProjects } from '@/lib/project-context';
import { DemoTag } from '../common/Badge';

interface ViewInspectionOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: InspectionOrderRecord;
}

export function ViewInspectionOrderModal({ isOpen, onClose, order }: ViewInspectionOrderModalProps) {
  const { jirs } = useProjects();

  if (!isOpen || !order) return null;

  const relevantJirs = jirs.filter(
    (j) => j.inspectionOrderId === order.id
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0A192F] text-white flex items-center justify-between border-b border-[#152747]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 flex items-center justify-center text-blue-300 border border-blue-400/30">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-editorial">{order.inspectionOrderNumber}</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {order.status}
                </span>
                <DemoTag label="STAGE 08" />
              </div>
              <p className="text-xs text-slate-400">
                {order.projectCode} — {order.projectName}
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
          {/* Key Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-[11px] text-slate-500 font-semibold block">Inspection Authority</span>
              <p className="font-bold text-slate-900 mt-0.5">{order.assignedAuthority}</p>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-semibold block">Deputed Officer</span>
              <p className="font-bold text-slate-900 mt-0.5">{order.assignedPerson || 'Designated Team'}</p>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-semibold block">Linked Inspection Call</span>
              <p className="font-mono text-blue-700 font-bold mt-0.5">{order.inspectionCallNumber}</p>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-semibold block">PO &amp; Manufacturer</span>
              <p className="text-slate-800 mt-0.5">
                <span className="font-mono">{order.poNumber}</span> • {order.vendorName}
              </p>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-semibold block">Equipment Under Test</span>
              <p className="font-medium text-slate-900 mt-0.5">
                {order.material} ({order.quantity} {order.unit})
              </p>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-semibold block">Scheduled Inspection Date</span>
              <p className="font-mono text-slate-800 font-semibold mt-0.5">{order.inspectionDate}</p>
            </div>
          </div>

          {/* Location */}
          <div className="text-xs bg-white p-3 rounded-lg border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block">Inspection Venue</span>
            <p className="text-slate-800 mt-0.5">{order.inspectionLocation}</p>
          </div>

          {/* Remarks */}
          {order.remarks && (
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">Instructions &amp; Scope</span>
              <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-0.5">
                {order.remarks}
              </p>
            </div>
          )}

          {/* Downstream JIRs */}
          <div className="pt-2 border-t border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2">
              <FileBadge className="w-3.5 h-3.5" />
              <span>Joint Inspection Reports Generated ({relevantJirs.length})</span>
            </span>

            {relevantJirs.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                No Joint Inspection Reports generated for this order yet.
              </p>
            ) : (
              <div className="space-y-1.5">
                {relevantJirs.map((j) => (
                  <div
                    key={j.id}
                    className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-blue-700">{j.jirNumber}</span>
                      <span className="text-slate-400 mx-1.5">•</span>
                      <span className="text-slate-600">Inspected: {j.inspectedQuantity} {j.unit}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-emerald-700 font-bold">
                        Accepted: {j.acceptedQuantity} {j.unit}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{j.status}</span>
                    </div>
                  </div>
                ))}
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
