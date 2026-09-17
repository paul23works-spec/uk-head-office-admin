'use client';

import React from 'react';
import { X, Receipt, CheckCircle, XCircle, Clock, Building2, Layers } from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { ProgressiveBillRecord, ProgressiveBillStatus } from '@/types';
import { DemoTag } from '../common/Badge';

interface ViewProgressiveBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: ProgressiveBillRecord | null;
}

export function ViewProgressiveBillModal({
  isOpen,
  onClose,
  bill,
}: ViewProgressiveBillModalProps) {
  const { updateProgressiveBill } = useProjects();

  if (!isOpen || !bill) return null;

  const handleStatusUpdate = (newStatus: ProgressiveBillStatus) => {
    updateProgressiveBill(bill.id, {
      status: newStatus,
      approvalDate: newStatus === 'Approved' ? new Date().toISOString().split('T')[0] : bill.approvalDate,
    });
  };

  const getStatusBadge = (status: ProgressiveBillStatus) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Partially Approved':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
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
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">{bill.billNumber}</h2>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${getStatusBadge(
                    bill.status
                  )}`}
                >
                  {bill.status}
                </span>
                <DemoTag text="DEMO / PHASE 4" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Stage 12: Progressive Billing Record & Certification
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
          {/* Financial Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-slate-800/60 border border-slate-700/80 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase">Claimed Amount</div>
              <div className="text-base font-bold text-white mt-0.5">
                ₹{bill.currentClaimedAmount.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-3 bg-slate-800/60 border border-emerald-500/30 bg-emerald-950/20 rounded-xl">
              <div className="text-[10px] text-emerald-300 uppercase font-semibold">Approved Amount</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">
                ₹{bill.currentApprovedAmount.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-3 bg-slate-800/60 border border-slate-700/80 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase">Cumulative Approved</div>
              <div className="text-base font-bold text-slate-200 mt-0.5">
                ₹{bill.cumulativeApprovedAmount.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-3 bg-slate-800/60 border border-slate-700/80 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase">Remaining Contract</div>
              <div className="text-base font-bold text-blue-400 mt-0.5">
                ₹{bill.remainingContractBalance.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Project & Dates Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-800/30 border border-slate-800 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                <strong className="text-white">{bill.projectName}</strong> ({bill.projectCode})
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Bill Date: <strong className="text-white">{bill.billDate}</strong> • Submission:{' '}
                <strong className="text-white">{bill.submissionDate || bill.billDate}</strong>
              </span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
              <Layers className="w-4 h-4 text-teal-400" />
              <span>Certified Line Items ({bill.lineItems.length})</span>
            </div>
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3">MICC Source</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right">Rate</th>
                    <th className="py-2.5 px-3 text-right">Claimed (₹)</th>
                    <th className="py-2.5 px-3 text-right">Approved (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {bill.lineItems.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-white">{line.description}</td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{line.miccNumber}</td>
                      <td className="py-2.5 px-3 text-right">
                        {line.claimedQuantity} {line.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right">₹{line.rate.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-white">
                        ₹{line.claimedAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-emerald-400">
                        ₹{(line.approvedAmount || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Remarks */}
          {bill.remarks && (
            <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                Progressive Billing Certification Notes
              </span>
              <p className="text-xs text-slate-300 whitespace-pre-wrap">{bill.remarks}</p>
            </div>
          )}

          {/* Quick Actions / Approval */}
          <div className="p-4 bg-slate-800/30 border border-slate-800 rounded-xl flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-slate-400">Update Bill Certification Status:</div>
            <div className="flex items-center gap-2">
              {bill.status !== 'Approved' && (
                <button
                  type="button"
                  onClick={() => handleStatusUpdate('Approved')}
                  className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Certify & Approve</span>
                </button>
              )}
              {bill.status !== 'Rejected' && (
                <button
                  type="button"
                  onClick={() => handleStatusUpdate('Rejected')}
                  className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject Bill</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Record ID: {bill.id} • Created: {bill.createdAt}
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
