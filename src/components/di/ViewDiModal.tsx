'use client';

import React from 'react';
import { X, Truck, Calendar, MapPin, FileCheck, Building2, Package, ShieldCheck, Ban } from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { DiRecord, DiStatus } from '@/types';
import { DemoTag } from '../common/Badge';

interface ViewDiModalProps {
  isOpen: boolean;
  onClose: () => void;
  di: DiRecord | null;
}

export function ViewDiModal({ isOpen, onClose, di }: ViewDiModalProps) {
  const { updateDi } = useProjects();

  if (!isOpen || !di) return null;

  const handleStatusUpdate = (newStatus: DiStatus) => {
    updateDi(di.id, { status: newStatus });
  };

  const getStatusBadge = (status: DiStatus) => {
    switch (status) {
      case 'Dispatched':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Ready for Dispatch':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Partially Dispatched':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'Cancelled':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'Draft':
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">{di.diNumber}</h2>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${getStatusBadge(
                    di.status
                  )}`}
                >
                  {di.status}
                </span>
                <DemoTag text="DEMO / PHASE 4" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Stage 10: Dispatch Instruction & Clearance Certificate
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Main Info Card */}
          <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-xl space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Material Description
                </span>
                <div className="text-base font-bold text-white mt-0.5">{di.materialDescription}</div>
                <div className="text-xs text-blue-400 font-mono mt-0.5">
                  Ref JIR: {di.jirNumber} • PO: {di.poNumber}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Dispatched Quantity
                </span>
                <div className="text-xl font-bold text-emerald-400 mt-0.5">
                  {di.quantity.toLocaleString('en-IN')} {di.unit}
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Project & Client</span>
              </div>
              <div className="text-sm font-semibold text-white">{di.projectName}</div>
              <div className="text-xs text-slate-400 font-mono">{di.projectCode}</div>
            </div>

            <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Package className="w-3.5 h-3.5 text-indigo-400" />
                <span>Manufacturer / Vendor</span>
              </div>
              <div className="text-sm font-semibold text-white">{di.vendorName}</div>
              <div className="text-xs text-slate-400 font-mono">Vendor ID: {di.vendorId}</div>
            </div>

            <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Clearance Dates</span>
              </div>
              <div className="text-xs text-slate-300">
                DI Date: <span className="font-semibold text-white">{di.diDate}</span>
              </div>
              <div className="text-xs text-slate-300">
                Dispatch Date: <span className="font-semibold text-white">{di.dispatchDate || 'Pending departure'}</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Destination Store / Site</span>
              </div>
              <div className="text-sm font-semibold text-white">{di.destination}</div>
            </div>

            <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Truck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Vehicle & Carrier</span>
              </div>
              <div className="text-sm font-semibold text-white">{di.vehicleReference || 'Unassigned'}</div>
              <div className="text-xs text-slate-400">LR No: {di.lrTransportReference || 'N/A'}</div>
            </div>

            <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <FileCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Downstream Stage 11 Link</span>
              </div>
              <div className="text-xs text-slate-300">
                Eligible for MICC material verification on arrival at site.
              </div>
            </div>
          </div>

          {/* Remarks */}
          {di.remarks && (
            <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                Dispatch Instructions & Remarks
              </span>
              <p className="text-xs text-slate-300 whitespace-pre-wrap">{di.remarks}</p>
            </div>
          )}

          {/* Quick Actions / Status Transition */}
          <div className="p-4 bg-slate-800/30 border border-slate-800 rounded-xl flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-slate-400">
              Update Dispatch Status:
            </div>
            <div className="flex items-center gap-2">
              {di.status !== 'Dispatched' && di.status !== 'Cancelled' && (
                <button
                  type="button"
                  onClick={() => handleStatusUpdate('Dispatched')}
                  className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Mark as Dispatched</span>
                </button>
              )}
              {di.status !== 'Cancelled' && (
                <button
                  type="button"
                  onClick={() => handleStatusUpdate('Cancelled')}
                  className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Cancel DI</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Record ID: {di.id} • Created: {di.createdAt}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
