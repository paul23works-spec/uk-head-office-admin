'use client';

import React, { useState, useMemo } from 'react';
import { X, Plus, Receipt, AlertCircle, CheckCircle2, ShieldAlert, Trash2 } from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { ProgressiveBillStatus, ProgressiveBillLineItem } from '@/types';
import { DemoTag } from '../common/Badge';

interface CreateProgressiveBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  onSuccess?: (billId: string) => void;
}

interface DraftLineItem {
  miccId: string;
  claimedQuantity: number;
  rate: number;
  remarks?: string;
}

export function CreateProgressiveBillModal({
  isOpen,
  onClose,
  defaultProjectId,
  onSuccess,
}: CreateProgressiveBillModalProps) {
  const {
    projects,
    miccs,
    progressiveBills,
    createProgressiveBill,
    getBillableQuantityForMicc,
    getProjectBillingSummary,
  } = useProjects();

  const initialProject = defaultProjectId
    ? projects.find((p) => p.id === defaultProjectId || p.code === defaultProjectId) || projects[0]
    : projects[0];

  const [projectId, setProjectId] = useState(initialProject?.id || '');

  // Eligible MICCs for selected project
  const eligibleMiccs = useMemo(
    () => miccs.filter((m) => m.projectId === projectId && m.status === 'Verified'),
    [miccs, projectId]
  );

  const initialBillNum = `RA-${String(
    progressiveBills.filter((b) => b.projectId === projectId).length + 1
  ).padStart(2, '0')}/UK/${initialProject?.code.split('-')[0] || 'PRJ'}/2024`;

  const [billNumber, setBillNumber] = useState(initialBillNum);
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<ProgressiveBillStatus>('Submitted');
  const [remarks, setRemarks] = useState(
    'Running Account progressive bill submitted with verified site MICCs and delivery receipts.'
  );

  const [lines, setLines] = useState<DraftLineItem[]>(() => {
    if (eligibleMiccs.length > 0) {
      const first = eligibleMiccs[0];
      const rem = getBillableQuantityForMicc(first.id);
      return [
        {
          miccId: first.id,
          claimedQuantity: rem > 0 ? rem : 1,
          rate: 154000,
          remarks: 'Verified site delivery',
        },
      ];
    }
    return [];
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const currentProject = projects.find((p) => p.id === projectId || p.code === projectId);
  const billingSummary = getProjectBillingSummary(projectId);

  // Line calculations
  const calculatedLines = lines.map((l) => {
    const micc = miccs.find((m) => m.id === l.miccId);
    const claimedAmt = Math.round(l.claimedQuantity * l.rate);
    const remBillable = micc ? getBillableQuantityForMicc(micc.id) : 0;
    const isOver = l.claimedQuantity > remBillable;
    return {
      ...l,
      micc,
      claimedAmount: claimedAmt,
      remainingBillable: remBillable,
      isOver,
    };
  });

  const totalClaimed = calculatedLines.reduce((sum, l) => sum + l.claimedAmount, 0);
  const estimatedApproved =
    status === 'Approved' || status === 'Partially Approved' ? totalClaimed : 0;
  const newCumulativeApproved = billingSummary.cumulativeApprovedAmount + estimatedApproved;
  const isOverContract =
    estimatedApproved > 0 && newCumulativeApproved > billingSummary.contractValue;
  const anyLineOver = calculatedLines.some((l) => l.isOver);

  const handleAddLine = () => {
    const unusedMicc = eligibleMiccs.find((m) => !lines.some((l) => l.miccId === m.id));
    const target = unusedMicc || eligibleMiccs[0];
    if (target) {
      const rem = getBillableQuantityForMicc(target.id);
      setLines((prev) => [
        ...prev,
        {
          miccId: target.id,
          claimedQuantity: rem > 0 ? rem : 1,
          rate: 154000,
          remarks: 'Progressive invoice item',
        },
      ]);
    }
  };

  const handleRemoveLine = (idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx: number, field: keyof DraftLineItem, val: string | number) => {
    setLines((prev) =>
      prev.map((item, i) => {
        if (i === idx) {
          return { ...item, [field]: val };
        }
        return item;
      })
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!projectId) {
      newErrors.projectId = 'Project selection is required';
    }

    if (!billNumber.trim()) {
      newErrors.billNumber = 'Bill / Invoice number is required';
    }

    if (lines.length === 0) {
      newErrors.lines = 'At least one verified MICC line item is required for progressive billing';
    }

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (!l.miccId) {
        newErrors[`line_${i}`] = `Line #${i + 1} must reference a verified MICC`;
      }
      if (l.claimedQuantity <= 0) {
        newErrors[`line_qty_${i}`] = `Line #${i + 1} quantity must be greater than 0`;
      }
      const rem = getBillableQuantityForMicc(l.miccId);
      if (l.claimedQuantity > rem) {
        newErrors[`line_over_${i}`] = `Line #${i + 1} quantity (${l.claimedQuantity}) exceeds unbilled MICC balance (${rem})`;
      }
    }

    if (isOverContract) {
      newErrors.contract = `Contract limit exceeded: Cumulative approved billing (₹${newCumulativeApproved.toLocaleString(
        'en-IN'
      )}) exceeds total contract value (₹${billingSummary.contractValue.toLocaleString('en-IN')})`;
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
      const processedLineItems: ProgressiveBillLineItem[] = calculatedLines.map((line, idx) => {
        const m = line.micc!;
        return {
          id: `PBL-${String(idx + 1).padStart(3, '0')}`,
          billId: '',
          miccId: m.id,
          miccNumber: m.miccNumber,
          diId: m.diId,
          diNumber: m.diNumber,
          poId: m.poId,
          poNumber: m.poNumber,
          boqItemId: m.boqItemId,
          boqItemNumber: m.boqItemNumber,
          description: m.materialDescription,
          unit: m.unit,
          claimedQuantity: line.claimedQuantity,
          rate: line.rate,
          claimedAmount: line.claimedAmount,
          approvedQuantity:
            status === 'Approved' || status === 'Partially Approved' ? line.claimedQuantity : 0,
          approvedAmount:
            status === 'Approved' || status === 'Partially Approved' ? line.claimedAmount : 0,
          remarks: line.remarks,
        };
      });

      const newRecord = createProgressiveBill({
        billNumber: billNumber.trim(),
        billDate,
        projectId: prj.id,
        projectCode: prj.code,
        projectName: prj.name,
        status,
        lineItems: processedLineItems,
        submissionDate: billDate,
        approvalDate:
          status === 'Approved' || status === 'Partially Approved' ? billDate : undefined,
        remarks: remarks.trim(),
      });

      setSuccessMessage(`Progressive Bill ${newRecord.billNumber} created successfully!`);
      setTimeout(() => {
        onSuccess?.(newRecord.id);
        onClose();
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create Progressive Bill';
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
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
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Stage 12: Generate Progressive Bill (RA Bill)
                </h2>
                <DemoTag text="DEMO / PHASE 4" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Assemble verified site MICC line items into a certified interim progress invoice
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

          {errors.contract && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errors.contract}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Project Selection & Financial Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Target Project <span className="text-rose-400">*</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  setLines([]);
                }}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} • {p.name.substring(0, 25)}...
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 p-3 bg-slate-800/50 border border-slate-700/80 rounded-xl flex items-center justify-around text-center">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Contract Value</div>
                <div className="text-xs font-bold text-white mt-0.5">
                  ₹{billingSummary.contractValue.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="h-7 w-[1px] bg-slate-700" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Prior Approved</div>
                <div className="text-xs font-bold text-emerald-400 mt-0.5">
                  ₹{billingSummary.cumulativeApprovedAmount.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="h-7 w-[1px] bg-slate-700" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Unbilled Balance</div>
                <div className="text-xs font-bold text-blue-400 mt-0.5">
                  ₹{billingSummary.remainingContractBalance.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>

          {/* Bill Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Bill / Invoice Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="RA-01/UK/APDCL/2024"
              />
              {errors.billNumber && <p className="text-xs text-rose-400 mt-1">{errors.billNumber}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Bill Submission Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Bill Status <span className="text-rose-400">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProgressiveBillStatus)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="Submitted">Submitted (Claim lodged with employer / PMC)</option>
                <option value="Under Review">Under Review (Scrutiny by billing engineer)</option>
                <option value="Approved">Approved (Certified for payment disbursement)</option>
                <option value="Draft">Draft (Internal preparation)</option>
              </select>
            </div>
          </div>

          {/* Structured Line Items Linked to Verified MICCs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Progressive Bill Line Items ({lines.length})
              </span>
              <button
                type="button"
                onClick={handleAddLine}
                disabled={eligibleMiccs.length === 0}
                className="px-3 py-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add MICC Item</span>
              </button>
            </div>

            {eligibleMiccs.length === 0 ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  No verified MICCs found for this project. Materials must be verified under Stage 11 (MICC) before they can be billed.
                </span>
              </div>
            ) : lines.length === 0 ? (
              <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl text-xs text-slate-400 text-center">
                Click &quot;Add MICC Item&quot; above to add verified material items to this progressive invoice.
              </div>
            ) : (
              <div className="space-y-3">
                {lines.map((item, idx) => {
                  const calc = calculatedLines[idx];
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border transition-all ${
                        calc.isOver
                          ? 'bg-rose-950/20 border-rose-500/40'
                          : 'bg-slate-800/40 border-slate-700/80'
                      }`}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        {/* MICC Selector */}
                        <div className="sm:col-span-5">
                          <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">
                            Verified MICC Source #{idx + 1}
                          </label>
                          <select
                            value={item.miccId}
                            onChange={(e) => handleLineChange(idx, 'miccId', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                          >
                            {eligibleMiccs.map((m) => {
                              const unbilled = getBillableQuantityForMicc(m.id);
                              return (
                                <option key={m.id} value={m.id}>
                                  {m.miccNumber} — {m.materialDescription} ({unbilled} {m.unit} unbilled)
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* Claimed Qty */}
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">
                            Claim Qty (Max: {calc.remainingBillable})
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={calc.remainingBillable}
                            value={item.claimedQuantity}
                            onChange={(e) =>
                              handleLineChange(idx, 'claimedQuantity', Number(e.target.value))
                            }
                            className={`w-full bg-slate-800 border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none ${
                              calc.isOver ? 'border-rose-500 text-rose-300' : 'border-slate-700'
                            }`}
                          />
                        </div>

                        {/* Unit Rate */}
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">
                            Rate (₹)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.rate}
                            onChange={(e) => handleLineChange(idx, 'rate', Number(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                          />
                        </div>

                        {/* Line Total */}
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">
                            Line Total
                          </label>
                          <div className="text-xs font-bold text-emerald-400 py-1.5">
                            ₹{calc.claimedAmount.toLocaleString('en-IN')}
                          </div>
                        </div>

                        {/* Delete */}
                        <div className="sm:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {calc.isOver && (
                        <div className="mt-2 text-[11px] text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Claimed quantity exceeds unbilled balance by{' '}
                            {item.claimedQuantity - calc.remainingBillable} units.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {errors.lines && <p className="text-xs text-rose-400">{errors.lines}</p>}
          </div>

          {/* Invoice Financial Summary Box */}
          <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Total Current Claim Amount:</span>
              <span className="font-bold text-white text-sm">
                ₹{totalClaimed.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Approved Amount (Status: {status}):</span>
              <span className="font-semibold text-emerald-400">
                ₹{estimatedApproved.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Remaining Contract Balance After Approval:</span>
              <span className="font-mono text-blue-400">
                ₹{Math.max(0, billingSummary.contractValue - newCumulativeApproved).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Remarks & Certification Notes
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="Notes on measurements, joint check certifications, site verification references..."
            />
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
              disabled={isSubmitting || lines.length === 0 || anyLineOver || isOverContract}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating...' : 'Submit Progressive Bill'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
