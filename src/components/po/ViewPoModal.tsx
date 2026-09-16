'use client';

import React from 'react';
import { X, ShoppingCart, BellRing } from 'lucide-react';
import { PoRecord } from '@/types';
import { useProjects } from '@/lib/project-context';
import { DemoTag } from '../common/Badge';

interface ViewPoModalProps {
  isOpen: boolean;
  onClose: () => void;
  po?: PoRecord;
}

export function ViewPoModal({ isOpen, onClose, po }: ViewPoModalProps) {
  const { inspectionCalls } = useProjects();

  if (!isOpen || !po) return null;

  const relevantCalls = inspectionCalls.filter(
    (c) => c.poId === po.id && c.status !== 'Cancelled'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0A192F] text-white flex items-center justify-between border-b border-[#152747]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 flex items-center justify-center text-blue-300 border border-blue-400/30">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-editorial">{po.poNumber}</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {po.status}
                </span>
                <DemoTag label="STAGE 06" />
              </div>
              <p className="text-xs text-slate-400">
                {po.projectCode} — {po.projectName}
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
          {/* Metadata Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-[11px] text-slate-500 font-semibold block">Manufacturer / Vendor</span>
              <p className="font-bold text-slate-900 mt-0.5">{po.vendorName}</p>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-semibold block">PO Date</span>
              <p className="font-mono text-slate-800 mt-0.5">{po.poDate}</p>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-semibold block">Total Contract Value</span>
              <p className="font-mono font-bold text-blue-900 text-sm mt-0.5">
                ₹ {po.totalAmount.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
              Purchase Order Line Items ({po.items.length})
            </span>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-600 uppercase">
                  <tr>
                    <th className="px-3 py-2">Item #</th>
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2 text-right">PO Qty</th>
                    <th className="px-3 py-2 text-right">Rate</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {po.items.map((line) => (
                    <tr key={line.id} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2 font-mono font-bold text-slate-800">
                        {line.boqItemNumber}
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-700">
                        {line.description}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                        {line.quantity} {line.unit}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-600">
                        ₹ {line.rate.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-blue-900">
                        ₹ {line.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-right text-xs text-slate-700">
                      Total:
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-blue-950">
                      ₹ {po.totalAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Remarks */}
          {po.remarks && (
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">Terms &amp; Remarks</span>
              <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-0.5">
                {po.remarks}
              </p>
            </div>
          )}

          {/* Downstream Inspection Calls */}
          <div className="pt-2 border-t border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2">
              <BellRing className="w-3.5 h-3.5" />
              <span>Inspection Calls Raised Against this PO ({relevantCalls.length})</span>
            </span>

            {relevantCalls.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                No inspection calls have been raised against this Purchase Order yet.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {relevantCalls.map((c) => (
                  <div
                    key={c.id}
                    className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-blue-700">{c.inspectionCallNumber}</span>
                      <span className="text-slate-400 mx-1.5">•</span>
                      <span className="text-slate-600">{c.material}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-800">
                        {c.quantity} {c.unit}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{c.status}</span>
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
