'use client';

import React from 'react';
import { X, BellRing, ClipboardCheck, MapPin, Calendar } from 'lucide-react';
import { InspectionCallRecord } from '@/types';
import { useProjects } from '@/lib/project-context';
import { DemoTag } from '../common/Badge';

interface ViewInspectionCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  call?: InspectionCallRecord;
}

export function ViewInspectionCallModal({ isOpen, onClose, call }: ViewInspectionCallModalProps) {
  const { inspectionOrders } = useProjects();

  if (!isOpen || !call) return null;

  const relevantOrders = inspectionOrders.filter(
    (o) => o.inspectionCallId === call.id && o.status !== 'Cancelled'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0A192F] text-white flex items-center justify-between border-b border-[#152747]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 flex items-center justify-center text-blue-300 border border-blue-400/30">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-editorial">{call.inspectionCallNumber}</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {call.status}
                </span>
                <DemoTag label="STAGE 07" />
              </div>
              <p className="text-xs text-slate-400">
                {call.projectCode} — {call.projectName}
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
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-[11px] text-slate-500 font-semibold block">PO Reference</span>
              <p className="font-mono font-bold text-slate-900 mt-0.5">{call.poNumber}</p>
              <p className="text-[10px] text-slate-500">{call.vendorName}</p>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-semibold block">Material Item</span>
              <p className="font-bold text-slate-900 mt-0.5">{call.material}</p>
              <p className="text-[10px] text-slate-500 font-mono">Item {call.boqItemNumber}</p>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-semibold block">Call Quantity</span>
              <p className="font-mono font-bold text-blue-900 text-base mt-0.5">
                {call.quantity} <span className="text-xs font-normal text-slate-500">{call.unit}</span>
              </p>
            </div>
          </div>

          {/* Quantities Audit Trail */}
          <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-2">
            <span className="font-semibold text-slate-700 block">Quantity Audit Balance</span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 p-2 rounded">
                <span className="text-[10px] text-slate-500 block">Total PO Quantity</span>
                <span className="font-bold font-mono text-slate-800">{call.poQuantity} {call.unit}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded">
                <span className="text-[10px] text-slate-500 block">Previously Called</span>
                <span className="font-bold font-mono text-amber-700">{call.previouslyCalledQuantity} {call.unit}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded">
                <span className="text-[10px] text-slate-500 block">Balance Remaining</span>
                <span className="font-bold font-mono text-emerald-700">{call.remainingQuantity} {call.unit}</span>
              </div>
            </div>
          </div>

          {/* Schedule & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-slate-700 block">Dates</span>
                <p className="text-slate-600 mt-0.5">Request: {call.requestDate}</p>
                <p className="text-slate-600">Proposed Inspection: {call.proposedInspectionDate}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-slate-700 block">Location</span>
                <p className="text-slate-600 mt-0.5">{call.inspectionLocation}</p>
              </div>
            </div>
          </div>

          {/* Remarks */}
          {call.remarks && (
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">Remarks</span>
              <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-0.5">
                {call.remarks}
              </p>
            </div>
          )}

          {/* Downstream Inspection Orders */}
          <div className="pt-2 border-t border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2">
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Inspection Orders Issued Against this Call ({relevantOrders.length})</span>
            </span>

            {relevantOrders.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                No Inspection Orders have been issued for this call yet.
              </p>
            ) : (
              <div className="space-y-1.5">
                {relevantOrders.map((o) => (
                  <div
                    key={o.id}
                    className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-blue-700">{o.inspectionOrderNumber}</span>
                      <span className="text-slate-400 mx-1.5">•</span>
                      <span className="text-slate-600">Assigned: {o.assignedAuthority}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-slate-700 font-bold">{o.inspectionDate}</span>
                      <span className="text-[10px] text-slate-400 block">{o.status}</span>
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
