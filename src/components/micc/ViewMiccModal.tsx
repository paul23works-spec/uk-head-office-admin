'use client';

import React from 'react';
import { X, ClipboardCheck, Calendar, MapPin, Building2, Package, ShieldCheck, XCircle, FileText } from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { MiccRecord, MiccStatus } from '@/types';
import { DemoTag } from '../common/Badge';

interface ViewMiccModalProps {
  isOpen: boolean;
  onClose: () => void;
  micc: MiccRecord | null;
}

export function ViewMiccModal({ isOpen, onClose, micc }: ViewMiccModalProps) {
  const { updateMicc } = useProjects();

  if (!isOpen || !micc) return null;

  const handleStatusUpdate = (newStatus: MiccStatus) => {
    updateMicc(micc.id, { status: newStatus });
  };

  const getStatusBadge = (status: MiccStatus) => {
    switch (status) {
      case 'Verified':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Under Verification':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'Rejected':
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
        <div className="px-6 py-5 bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">{micc.miccNumber}</h2>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${getStatusBadge(
                    micc.status
                  )}`}
                >
                  {micc.status}
                </span>
                <DemoTag text="DEMO / PHASE 4" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Stage 11: Material Inspection and Clearance Certificate
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
                  Verified Material Description
                </span>
                <div className="text-base font-bold text-white mt-0.5">{micc.materialDescription}</div>
                <div className="text-xs text-purple-400 font-mono mt-0.5">
                  Ref DI: {micc.diNumber} • PO: {micc.poNumber}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Verified Quantity
                </span>
                <div className="text-xl font-bold text-emerald-400 mt-0.5">
                  {micc.quantity.toLocaleString('en-IN')} {micc.unit}
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
              <div className="text-sm font-semibold text-white">{micc.projectName}</div>
              <div className="text-xs text-slate-400 font-mono">{micc.projectCode}</div>
            </div>

            <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Package className="w-3.5 h-3.5 text-indigo-400" />
                <span>Supplier / Vendor</span>
              </div>
              <div className="text-sm font-semibold text-white">{micc.vendorName}</div>
              <div className="text-xs text-slate-400 font-mono">Vendor ID: {micc.vendorId}</div>
            </div>

            <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Inspection & Verification Date</span>
              </div>
              <div className="text-xs text-slate-300">
                Inward Date: <span className="font-semibold text-white">{micc.miccDate}</span>
              </div>
              <div className="text-xs text-slate-300">
                Verified On: <span className="font-semibold text-white">{micc.verificationDate || micc.miccDate}</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Field Office / Receiving Site</span>
              </div>
              <div className="text-sm font-semibold text-white">{micc.fieldOffice}</div>
              <div className="text-xs text-slate-400">{micc.verifiedBy || 'Site Engineer'}</div>
            </div>

            <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1 sm:col-span-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span>Progressive Billing Prerequisite (Stage 12)</span>
              </div>
              <div className="text-xs text-slate-300">
                This verified MICC certificate authorizes progressive billing invoice submission under Stage 12.
              </div>
            </div>
          </div>

          {/* Remarks */}
          {micc.remarks && (
            <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                Verification Remarks & Observations
              </span>
              <p className="text-xs text-slate-300 whitespace-pre-wrap">{micc.remarks}</p>
            </div>
          )}

          {/* Quick Actions / Status Transition */}
          <div className="p-4 bg-slate-800/30 border border-slate-800 rounded-xl flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-slate-400">
              Update Certificate Status:
            </div>
            <div className="flex items-center gap-2">
              {micc.status !== 'Verified' && (
                <button
                  type="button"
                  onClick={() => handleStatusUpdate('Verified')}
                  className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Mark as Verified</span>
                </button>
              )}
              {micc.status !== 'Rejected' && (
                <button
                  type="button"
                  onClick={() => handleStatusUpdate('Rejected')}
                  className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject Consignment</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Record ID: {micc.id} • Created: {micc.createdAt}
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
