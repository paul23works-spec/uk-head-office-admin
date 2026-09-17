'use client';

import React, { useState } from 'react';
import { X, Plus, Calculator, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { FinalBillStatus } from '@/types';
import { calculateFinalBill, parseContractValue } from '@/lib/c-admin-engine';
import { DemoTag } from '../common/Badge';

interface CreateFinalBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  onSuccess?: (billId: string) => void;
}

export function CreateFinalBillModal({
  isOpen,
  onClose,
  defaultProjectId,
  onSuccess,
}: CreateFinalBillModalProps) {
  const {
    projects,
    finalBills,
    progressiveBills,
    createFinalBill,
  } = useProjects();

  // Eligible projects: Projects that do NOT already have an active Final Bill
  const eligibleProjects = projects.filter((p) => {
    const existing = finalBills.find(
      (fb) => fb.projectId === p.id && fb.status !== 'Rejected'
    );
    return !existing || (defaultProjectId && p.id === defaultProjectId);
  });

  const initialProject = defaultProjectId
    ? projects.find((p) => p.id === defaultProjectId || p.code === defaultProjectId) ||
      eligibleProjects[0] ||
      projects[0]
    : eligibleProjects[0] || projects[0];

  const [projectId, setProjectId] = useState(initialProject?.id || '');

  const initialBillNum = initialProject
    ? `FB/UK/${initialProject.code.split('-')[0]}/2024/${String(finalBills.length + 1).padStart(3, '0')}`
    : `FB/UK/2024/${String(finalBills.length + 1).padStart(3, '0')}`;

  const [billNumber, setBillNumber] = useState(initialBillNum);
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [adjustments, setAdjustments] = useState(0);
  const [status, setStatus] = useState<FinalBillStatus>('Submitted');
  const [approvedBy, setApprovedBy] = useState('Chief Financial Controller / Chief Engineer, APDCL');
  const [remarks, setRemarks] = useState(
    'Final contract reconciliation bill submitted after defect liability check and store reconciliation.'
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const currentProject = projects.find((p) => p.id === projectId || p.code === projectId);
  const contractValue = parseContractValue(currentProject?.contractValue);

  // Calculate total approved progressive bills for this project
  const projectApprovedBills = progressiveBills.filter(
    (b) =>
      b.projectId === projectId &&
      (b.status === 'Approved' || b.status === 'Partially Approved')
  );
  const totalApprovedProgressive = projectApprovedBills.reduce(
    (sum, b) => sum + (Number(b.currentApprovedAmount) || 0),
    0
  );

  const finalAmount = calculateFinalBill(contractValue, totalApprovedProgressive, adjustments);
  const isNegative = finalAmount < 0;

  // Check if this project already has an active final bill
  const existingFinalBill = finalBills.find(
    (fb) => fb.projectId === projectId && fb.status !== 'Rejected'
  );

  const handleProjectChange = (newProjectId: string) => {
    setProjectId(newProjectId);
    const p = projects.find((proj) => proj.id === newProjectId);
    if (p) {
      setBillNumber(
        `FB/UK/${p.code.split('-')[0]}/2024/${String(finalBills.length + 1).padStart(3, '0')}`
      );
    }
    setErrors({});
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!projectId) {
      newErrors.projectId = 'Target project selection is required';
    }

    if (existingFinalBill) {
      newErrors.projectId = `Duplicate Final Bill: Project already has an active Final Bill (${existingFinalBill.finalBillNumber}). Only one active final bill is permitted.`;
    }

    if (!billNumber.trim()) {
      newErrors.billNumber = 'Final Bill Number is required';
    }

    if (isNegative) {
      newErrors.adjustments = `Reconciliation error: Calculated final bill amount (₹${finalAmount.toLocaleString(
        'en-IN'
      )}) cannot be negative.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const prj = currentProject!;
      const newRecord = createFinalBill({
        finalBillNumber: billNumber.trim(),
        projectId: prj.id,
        projectCode: prj.code,
        projectName: prj.name,
        billDate,
        adjustments,
        status,
        approvedBy: status === 'Approved' ? approvedBy.trim() : undefined,
        approvalDate: status === 'Approved' ? billDate : undefined,
        remarks: remarks.trim(),
      });

      setSuccessMessage(`Final Bill ${newRecord.finalBillNumber} lodged successfully!`);
      setTimeout(() => {
        onSuccess?.(newRecord.id);
        onClose();
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create Final Bill';
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
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
                  Stage 13: Project Final Bill Reconciliation
                </h2>
                <DemoTag text="DEMO / PHASE 4" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Deterministic final contract settlement and accounting reconciliation
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errors.form && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          {existingFinalBill && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                Project {currentProject?.code} already has an active Final Bill ({existingFinalBill.finalBillNumber}).
                Only one active final bill is permitted per project.
              </span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Project Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Target Project <span className="text-rose-400">*</span>
            </label>
            <select
              value={projectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} • {p.name} ({p.contractValue})
                </option>
              ))}
            </select>
            {errors.projectId && <p className="text-xs text-rose-400 mt-1">{errors.projectId}</p>}
          </div>

          {/* Mathematical Reconciliation Box */}
          <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-xl space-y-3">
            <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Final Reconciliation Formula</span>
              <span className="text-amber-400 font-mono text-[11px]">
                Contract + Net Adjustments − Progressive Bills
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg">
                <div className="text-[10px] text-slate-400 uppercase">Contract Value</div>
                <div className="text-xs font-bold text-white mt-0.5">
                  ₹{contractValue.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg">
                <div className="text-[10px] text-slate-400 uppercase">Paid / Approved</div>
                <div className="text-xs font-bold text-emerald-400 mt-0.5">
                  − ₹{totalApprovedProgressive.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg">
                <div className="text-[10px] text-slate-400 uppercase">Adjustments</div>
                <div
                  className={`text-xs font-bold mt-0.5 ${
                    adjustments >= 0 ? 'text-teal-400' : 'text-rose-400'
                  }`}
                >
                  {adjustments >= 0 ? '+' : ''}₹{adjustments.toLocaleString('en-IN')}
                </div>
              </div>
              <div
                className={`p-2.5 rounded-lg border ${
                  isNegative
                    ? 'bg-rose-950/30 border-rose-500/50'
                    : 'bg-amber-500/10 border-amber-500/30'
                }`}
              >
                <div className="text-[10px] text-amber-300 uppercase font-semibold">
                  Final Payable
                </div>
                <div
                  className={`text-sm font-extrabold mt-0.5 ${
                    isNegative ? 'text-rose-400' : 'text-amber-400'
                  }`}
                >
                  ₹{finalAmount.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {isNegative && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>Calculated final bill amount is negative. Adjust deductions or check contract value.</span>
              </div>
            )}
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Final Bill Reference Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="FB/UK/APDCL/2024/001"
              />
              {errors.billNumber && <p className="text-xs text-rose-400 mt-1">{errors.billNumber}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Reconciliation Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Net Contract Adjustments (₹)
              </label>
              <input
                type="number"
                value={adjustments}
                onChange={(e) => setAdjustments(Number(e.target.value))}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="Enter +/- amount"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Positive for variation / extra works; negative for penalties or liquidated damages.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Reconciliation Status <span className="text-rose-400">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FinalBillStatus)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              >
                <option value="Submitted">Submitted (Formal reconciliation lodged)</option>
                <option value="Under Review">Under Review (Scrutiny by accounts branch)</option>
                <option value="Approved">Approved (Settlement certified)</option>
                <option value="Draft">Draft (Preliminary internal audit)</option>
              </select>
            </div>

            {status === 'Approved' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Approved By / Authority
                </label>
                <input
                  type="text"
                  value={approvedBy}
                  onChange={(e) => setApprovedBy(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Closing Remarks & Audit Notes
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="Defect liability notes, retention adjustments, final reconciliation details..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !!existingFinalBill || isNegative}
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-amber-600/20 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Lodging...' : 'Lodge Final Bill'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
