'use client';

import React, { useState } from 'react';
import { X, Plus, ClipboardCheck, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { MiccStatus } from '@/types';
import { DemoTag } from '../common/Badge';

interface CreateMiccModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDiId?: string;
  onSuccess?: (miccId: string) => void;
}

export function CreateMiccModal({
  isOpen,
  onClose,
  defaultDiId,
  onSuccess,
}: CreateMiccModalProps) {
  const { dis, miccs, createMicc, getRemainingMiccQuantity } = useProjects();

  // Eligible DIs: Active non-cancelled DIs
  const activeDis = dis.filter((d) => d.status !== 'Cancelled');
  const initialDi = defaultDiId
    ? activeDis.find((d) => d.id === defaultDiId) || activeDis[0]
    : activeDis[0];

  const initialRemaining = initialDi ? getRemainingMiccQuantity(initialDi.id) : 0;
  const initialQuantity = initialRemaining > 0 ? initialRemaining : 0;
  const initialMiccNum = initialDi
    ? `MICC/${initialDi.projectCode.split('-')[0]}/2024/${String(miccs.length + 1).padStart(3, '0')}`
    : `MICC/UK/2024/${String(miccs.length + 1).padStart(3, '0')}`;

  const [formData, setFormData] = useState({
    diId: initialDi?.id || '',
    miccNumber: initialMiccNum,
    miccDate: new Date().toISOString().split('T')[0],
    quantity: initialQuantity,
    fieldOffice: 'Bongaigaon Site Circle Office, APDCL',
    verifiedBy: 'B. C. Roy, Resident Engineer / TPIA Site In-charge',
    status: 'Verified' as MiccStatus,
    remarks: 'Physical consignment verified on site. Quantities received in intact condition.',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const selectedDi = activeDis.find((d) => d.id === formData.diId);
  const remainingMicc = selectedDi ? getRemainingMiccQuantity(selectedDi.id) : 0;
  const enteredQuantity = Number(formData.quantity) || 0;
  const balanceAfter = Math.max(0, remainingMicc - enteredQuantity);
  const isOverVerification = enteredQuantity > remainingMicc;

  const handleDiChange = (newDiId: string) => {
    const target = activeDis.find((d) => d.id === newDiId);
    const targetRemaining = target ? getRemainingMiccQuantity(target.id) : 0;
    setFormData((prev) => ({
      ...prev,
      diId: newDiId,
      quantity: targetRemaining > 0 ? targetRemaining : 0,
      miccNumber: target
        ? `MICC/${target.projectCode.split('-')[0]}/2024/${String(miccs.length + 1).padStart(3, '0')}`
        : prev.miccNumber,
    }));
    setErrors({});
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Orphan prevention
    if (!formData.diId) {
      newErrors.diId = 'Orphan Prevention: MICC must link to a valid Dispatch Instruction (DI)';
    } else if (!selectedDi) {
      newErrors.diId = 'Referenced DI does not exist or is cancelled';
    }

    if (!formData.miccNumber.trim()) {
      newErrors.miccNumber = 'MICC Certificate Number is required';
    }

    if (!formData.miccDate) {
      newErrors.miccDate = 'Inspection & Inward Date is required';
    }

    if (enteredQuantity <= 0) {
      newErrors.quantity = 'Verified quantity must be greater than 0';
    } else if (isOverVerification) {
      newErrors.quantity = `Over-verification error: Verified quantity (${enteredQuantity}) exceeds available DI balance (${remainingMicc})`;
    }

    if (!formData.fieldOffice.trim()) {
      newErrors.fieldOffice = 'Field office / site receiving authority is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const di = selectedDi!;
      const newRecord = createMicc({
        miccNumber: formData.miccNumber.trim(),
        miccDate: formData.miccDate,
        projectId: di.projectId,
        projectCode: di.projectCode,
        projectName: di.projectName,
        diId: di.id,
        diNumber: di.diNumber,
        poId: di.poId,
        poNumber: di.poNumber,
        jirId: di.jirId,
        jirNumber: di.jirNumber,
        boqItemId: di.boqItemId,
        vendorId: di.vendorId,
        vendorName: di.vendorName,
        materialDescription: di.materialDescription,
        quantity: enteredQuantity,
        unit: di.unit,
        fieldOffice: formData.fieldOffice.trim(),
        verifiedBy: formData.verifiedBy.trim(),
        verificationDate: formData.miccDate,
        status: formData.status,
        remarks: formData.remarks.trim(),
      });

      setSuccessMessage(`MICC ${newRecord.miccNumber} recorded successfully!`);
      setTimeout(() => {
        onSuccess?.(newRecord.id);
        onClose();
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create MICC record';
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
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
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Stage 11: Issue Material Inward & Clearance (MICC)
                </h2>
                <DemoTag text="DEMO / PHASE 4" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Verify receipt of dispatched consignment at site before progressive billing
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

          {successMessage && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* DI Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Source Dispatch Instruction (Stage 10 DI) <span className="text-rose-400">*</span>
            </label>
            {activeDis.length === 0 ? (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  No active DI records available. Issue a Dispatch Instruction under Stage 10 first.
                </span>
              </div>
            ) : (
              <select
                value={formData.diId}
                onChange={(e) => handleDiChange(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
              >
                {activeDis.map((d) => {
                  const rem = getRemainingMiccQuantity(d.id);
                  return (
                    <option key={d.id} value={d.id}>
                      {d.diNumber} — {d.materialDescription} ({rem} {d.unit} unverified) • {d.projectCode}
                    </option>
                  );
                })}
              </select>
            )}
            {errors.diId && <p className="text-xs text-rose-400 mt-1">{errors.diId}</p>}
          </div>

          {/* Real-Time Balance Calculator Card */}
          {selectedDi && (
            <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-xl">
              <div className="text-xs font-semibold text-slate-300 mb-2.5 flex items-center justify-between">
                <span>Multi-MICC Verification Balance Engine</span>
                <span className="text-purple-400 font-mono text-[11px]">{selectedDi.materialDescription}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">DI Quantity</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {selectedDi.quantity} {selectedDi.unit}
                  </div>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Prior Verified</div>
                  <div className="text-sm font-bold text-slate-300 mt-0.5">
                    {selectedDi.quantity - remainingMicc} {selectedDi.unit}
                  </div>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-purple-500/30 bg-purple-950/20">
                  <div className="text-[10px] text-purple-300 uppercase font-semibold">Available</div>
                  <div className="text-sm font-bold text-purple-400 mt-0.5">
                    {remainingMicc} {selectedDi.unit}
                  </div>
                </div>
                <div
                  className={`p-2 rounded-lg border ${
                    isOverVerification
                      ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="text-[10px] uppercase font-semibold">Balance After</div>
                  <div className="text-sm font-bold mt-0.5">
                    {isOverVerification ? 'OVER CAPPED' : `${balanceAfter} ${selectedDi.unit}`}
                  </div>
                </div>
              </div>
              {isOverVerification && (
                <div className="mt-2.5 p-2 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Verified quantity exceeds available DI balance by {enteredQuantity - remainingMicc} {selectedDi.unit}.</span>
                </div>
              )}
            </div>
          )}

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                MICC Certificate Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.miccNumber}
                onChange={(e) => setFormData({ ...formData, miccNumber: e.target.value })}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="MICC/APDCL/BGA/2024/018"
              />
              {errors.miccNumber && <p className="text-xs text-rose-400 mt-1">{errors.miccNumber}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Quantity Verified on Site ({selectedDi?.unit || 'Nos'}) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={remainingMicc}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                className={`w-full bg-slate-800/90 border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none transition-colors ${
                  isOverVerification ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700 focus:border-purple-500'
                }`}
              />
              {errors.quantity && <p className="text-xs text-rose-400 mt-1">{errors.quantity}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Site Verification Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={formData.miccDate}
                onChange={(e) => setFormData({ ...formData, miccDate: e.target.value })}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
              />
              {errors.miccDate && <p className="text-xs text-rose-400 mt-1">{errors.miccDate}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Field Office / Site In-charge <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.fieldOffice}
                onChange={(e) => setFormData({ ...formData, fieldOffice: e.target.value })}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="e.g. Bongaigaon Site Circle Office"
              />
              {errors.fieldOffice && <p className="text-xs text-rose-400 mt-1">{errors.fieldOffice}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Inspecting Officer / Engineer Signature
              </label>
              <input
                type="text"
                value={formData.verifiedBy}
                onChange={(e) => setFormData({ ...formData, verifiedBy: e.target.value })}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="e.g. B. C. Roy, Resident Engineer / TPIA"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Certificate Status <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as MiccStatus })}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="Verified">Verified (Clearance issued for progressive billing)</option>
                <option value="Under Verification">Under Verification (Site unloading inspection in progress)</option>
                <option value="Draft">Draft (Preliminary site entry)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Verification Remarks & Inward Observations
              </label>
              <textarea
                rows={2}
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Notes on packaging, transit damages (if any), store entry register details..."
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
              disabled={isSubmitting || activeDis.length === 0 || isOverVerification}
              className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-purple-600/20 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording...' : 'Issue Material Clearance (MICC)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
