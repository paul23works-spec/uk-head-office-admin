'use client';

import React from 'react';
import { X, Calculator, CheckCircle, XCircle, Clock, Building2, ShieldCheck } from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { FinalBillRecord, FinalBillStatus } from '@/types';
import { DemoTag } from '../common/Badge';

interface ViewFinalBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  finalBill: FinalBillRecord | null;
}

export function ViewFinalBillModal({
  isOpen,
  onClose,
  finalBill,
}: ViewFinalBillModalProps) {
  const { updateFinalBill } = useProjects();

  if (!isOpen || !finalBill) return null;

  const handleStatusUpdate = (newStatus: FinalBillStatus) => {
    updateFinalBill(finalBill.id, {
      status: newStatus,
      approvalDate: newStatus === 'Approved' ? new Date().toISOString().split('T')[0] : finalBill.approvalDate,
    });
  };

  const getStatusBadge = (status: FinalBillStatus) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Submitted':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Under Review':
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
        <div className="px-6 py-5 bg-gradient-to-r from-amber-950/80 via-slate-900 to-orange-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  {finalBill.finalBillNumber}
                </h2>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${getStatusBadge(
                    finalBill.status
                  )}`}
                >
                  {finalBill.status}
                </span>
                <DemoTag text="DEMO / PHASE 4" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Stage 13: Project Final Bill Reconciliation & Settlement
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
          {/* Highlight Settlement Card */}
          <div className="p-5 bg-gradient-to-br from-amber-950/30 via-slate-800/60 to-slate-900/60 border border-amber-500/30 rounded-2xl text-center space-y-2">
            <span className="text-[11px] text-amber-400 uppercase tracking-widest font-bold">
              Net Final Settlement Payable Amount
            </span>
            <div className="text-3xl font-black text-amber-400 tracking-tight">
              ₹{finalBill.finalBillAmount.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-slate-400">
              Contract value fully reconciled against all approved progressive invoices.
            </p>
          </div>

          {/* Detailed Math Breakdown Grid */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-800/60 border border-slate-700/80 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase">Agreed Contract Value</div>
              <div className="text-sm font-bold text-white mt-1">
                ₹{finalBill.contractValue.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-3 bg-slate-800/60 border border-slate-700/80 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase">Progressive Billed</div>
              <div className="text-sm font-bold text-emerald-400 mt-1">
                − ₹{finalBill.totalApprovedProgressiveBills.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-3 bg-slate-800/60 border border-slate-700/80 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase">Net Adjustments</div>
              <div
                className={`text-sm font-bold mt-1 ${
                  finalBill.adjustments >= 0 ? 'text-teal-400' : 'text-rose-400'
                }`}
              >
                {finalBill.adjustments >= 0 ? '+' : ''}₹{finalBill.adjustments.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Project & Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-800/30 border border-slate-800 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                <strong className="text-white">{finalBill.projectName}</strong> ({finalBill.projectCode})
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Bill Date: <strong className="text-white">{finalBill.billDate}</strong>
              </span>
            </div>
            {finalBill.approvedBy && (
              <div className="flex items-center gap-2 text-slate-300 sm:col-span-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Approved By: <strong className="text-white">{finalBill.approvedBy}</strong> •{' '}
                  {finalBill.approvalDate}
                </span>
              </div>
            )}
          </div>

          {/* Remarks */}
          {finalBill.remarks && (
            <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                Closing Remarks & Reconciliation Notes
              </span>
              <p className="text-xs text-slate-300 whitespace-pre-wrap">{finalBill.remarks}</p>
            </div>
          )}

          {/* Quick Actions / Approval */}
          <div className="p-4 bg-slate-800/30 border border-slate-800 rounded-xl flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-slate-400">Update Final Bill Status:</div>
            <div className="flex items-center gap-2">
              {finalBill.status !== 'Approved' && (
                <button
                  type="button"
                  onClick={() => handleStatusUpdate('Approved')}
                  className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Certify Final Settlement</span>
                </button>
              )}
              {finalBill.status !== 'Rejected' && (
                <button
                  type="button"
                  onClick={() => handleStatusUpdate('Rejected')}
                  className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject Final Bill</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Record ID: {finalBill.id} • Created: {finalBill.createdAt}
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
