'use client';

import React from 'react';
import { X, ListTree, ShoppingCart, Cpu } from 'lucide-react';
import { BoqItem } from '@/types';
import { useProjects } from '@/lib/project-context';
import { DemoTag } from '../common/Badge';

interface ViewBoqModalProps {
  isOpen: boolean;
  onClose: () => void;
  boqItem?: BoqItem;
}

export function ViewBoqModal({ isOpen, onClose, boqItem }: ViewBoqModalProps) {
  const { pos, getRemainingBoqQuantity, getLatestGtpForBoqItem } = useProjects();

  if (!isOpen || !boqItem) return null;

  const remaining = getRemainingBoqQuantity(boqItem.id);
  const ordered = Math.max(0, boqItem.quantity - remaining);
  const percentOrdered = Math.min(100, Math.round((ordered / boqItem.quantity) * 100));

  const relevantPos = pos.filter(
    (p) => p.status !== 'Cancelled' && p.items.some((line) => line.boqItemId === boqItem.id)
  );

  const latestGtp = getLatestGtpForBoqItem(boqItem.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#0A192F] text-white flex items-center justify-between border-b border-[#152747]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 flex items-center justify-center text-blue-300 border border-blue-400/30">
              <ListTree className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-editorial">
                  BOQ Item {boqItem.itemNumber}
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {boqItem.category}
                </span>
                <DemoTag label="FOUNDATION" />
              </div>
              <p className="text-xs text-slate-400">
                {boqItem.projectCode} — {boqItem.projectName}
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

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Main Quantities Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
              Quantity &amp; Procurement Status
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-medium">BOQ Total Qty</span>
                <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                  {boqItem.quantity} <span className="text-xs font-normal text-slate-500">{boqItem.unit}</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-medium">Ordered in POs</span>
                <div className="text-base font-bold text-amber-700 font-mono mt-0.5">
                  {ordered} <span className="text-xs font-normal text-slate-500">{boqItem.unit}</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-medium">Remaining Callable Qty</span>
                <div className="text-base font-bold text-emerald-700 font-mono mt-0.5">
                  {remaining} <span className="text-xs font-normal text-slate-500">{boqItem.unit}</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-medium">Total Value (₹)</span>
                <div className="text-sm font-bold text-blue-900 font-mono mt-1 truncate">
                  ₹ {boqItem.amount.toLocaleString('en-IN')}
                </div>
                <div className="text-[9px] text-slate-400 font-mono">@ ₹{boqItem.rate.toLocaleString('en-IN')} / {boqItem.unit}</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>Procurement Utilization: {percentOrdered}%</span>
                <span>{ordered} of {boqItem.quantity} {boqItem.unit} ordered</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    percentOrdered >= 100 ? 'bg-emerald-600' : percentOrdered > 0 ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                  style={{ width: `${percentOrdered}%` }}
                />
              </div>
            </div>
          </div>

          {/* Description & Specs */}
          <div className="space-y-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">Item Description</span>
              <p className="text-xs text-slate-800 font-medium mt-0.5">{boqItem.description}</p>
            </div>

            {boqItem.specification && (
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">Technical Specification</span>
                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono mt-0.5">
                  {boqItem.specification}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">Linked Vendor</span>
                <p className="text-xs text-slate-700 font-medium mt-0.5">
                  {boqItem.vendorName || (
                    <span className="text-amber-700 italic">Unassigned (Optional at BOQ creation)</span>
                  )}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">Latest GTP Approval Status</span>
                <div className="flex items-center gap-2 mt-0.5">
                  {latestGtp ? (
                    <>
                      <Cpu className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-xs font-semibold text-slate-800">
                        {latestGtp.revision} — {latestGtp.status}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No GTP submitted yet</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Linked POs */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Active POs Referencing this Item ({relevantPos.length})</span>
              </span>
            </div>
            {relevantPos.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                No active Purchase Orders currently reference this item. Available to order: {boqItem.quantity} {boqItem.unit}.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {relevantPos.map((p) => {
                  const line = p.items.find((l) => l.boqItemId === boqItem.id);
                  return (
                    <div
                      key={p.id}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-blue-700">{p.poNumber}</span>
                        <span className="text-slate-400 mx-1.5">•</span>
                        <span className="text-slate-600">{p.vendorName}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-800 font-mono">
                          {line?.quantity} {boqItem.unit}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{p.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Close */}
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
