'use client';

import React, { useState } from 'react';
import { X, Plus, Truck, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { DiStatus } from '@/types';
import { DemoTag } from '../common/Badge';

interface CreateDiModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultJirId?: string;
  onSuccess?: (diId: string) => void;
}

export function CreateDiModal({
  isOpen,
  onClose,
  defaultJirId,
  onSuccess,
}: CreateDiModalProps) {
  const { jirs, dis, createDi, getRemainingDispatchQuantity } = useProjects();

  // Eligible JIRs: must have accepted quantity > 0
  const eligibleJirs = jirs.filter(
    (j) => (j.status === 'Accepted' || j.status === 'Completed' || j.acceptedQuantity > 0)
  );

  const initialJir = defaultJirId
    ? eligibleJirs.find((j) => j.id === defaultJirId) || eligibleJirs[0]
    : eligibleJirs[0];

  const initialRemaining = initialJir ? getRemainingDispatchQuantity(initialJir.id) : 0;
  const initialQuantity = initialRemaining > 0 ? initialRemaining : 0;
  const initialDiNum = initialJir
    ? `DI/UK/${initialJir.projectCode.split('-')[0]}/2024/${String(dis.length + 1).padStart(3, '0')}`
    : `DI/UK/2024/${String(dis.length + 1).padStart(3, '0')}`;

  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    jirId: initialJir?.id || '',
    diNumber: initialDiNum,
    diDate: todayStr,
    dispatchDate: todayStr,
    quantity: initialQuantity,
    destination: 'APDCL Central Stores, Guwahati, Assam',
    vehicleReference: 'AS-01-GC-4481 (16-Wheeler Multi-Axle)',
    lrTransportReference: 'LR/AS-LOG/2024/884',
    status: 'Dispatched' as DiStatus,
    remarks: 'Material cleared under Stage 09 JIR. Road transit permit attached.',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const selectedJir = eligibleJirs.find((j) => j.id === formData.jirId);
  const remainingDispatch = selectedJir ? getRemainingDispatchQuantity(selectedJir.id) : 0;
  const enteredQuantity = Number(formData.quantity) || 0;
  const balanceAfter = Math.max(0, remainingDispatch - enteredQuantity);
  const isOverDispatch = enteredQuantity > remainingDispatch;

  const handleJirChange = (newJirId: string) => {
    const target = eligibleJirs.find((j) => j.id === newJirId);
    const targetRemaining = target ? getRemainingDispatchQuantity(target.id) : 0;
    setFormData((prev) => ({
      ...prev,
      jirId: newJirId,
      quantity: targetRemaining > 0 ? targetRemaining : 0,
      diNumber: target
        ? `DI/UK/${target.projectCode.split('-')[0]}/2024/${String(dis.length + 1).padStart(3, '0')}`
        : prev.diNumber,
    }));
    setErrors({});
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Orphan prevention
    if (!formData.jirId) {
      newErrors.jirId = 'Orphan Prevention: DI must link to a valid Joint Inspection Report (JIR)';
    } else if (!selectedJir) {
      newErrors.jirId = 'Referenced JIR does not exist or has zero accepted balance';
    }

    if (!formData.diNumber.trim()) {
      newErrors.diNumber = 'DI Number is required';
    }

    if (!formData.diDate) {
      newErrors.diDate = 'DI Clearance Date is required';
    }

    if (enteredQuantity <= 0) {
      newErrors.quantity = 'Dispatch quantity must be greater than 0';
    } else if (isOverDispatch) {
      newErrors.quantity = `Over-dispatch error: Quantity (${enteredQuantity}) exceeds available JIR balance (${remainingDispatch})`;
    }

    if (!formData.destination.trim()) {
      newErrors.destination = 'Delivery destination / site store is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const jir = selectedJir!;
      const newRecord = createDi({
        diNumber: formData.diNumber.trim(),
        diDate: formData.diDate,
        dispatchDate: formData.dispatchDate,
        projectId: jir.projectId,
        projectCode: jir.projectCode,
        projectName: jir.projectName,
        poId: jir.poId,
        poNumber: jir.poNumber,
        jirId: jir.id,
        jirNumber: jir.jirNumber,
        boqItemId: jir.boqItemId,
        vendorId: jir.vendorId,
        vendorName: jir.vendorName,
        materialDescription: jir.material,
        quantity: enteredQuantity,
        unit: jir.unit,
        destination: formData.destination.trim(),
        vehicleReference: formData.vehicleReference.trim(),
        lrTransportReference: formData.lrTransportReference.trim(),
        status: formData.status,
        remarks: formData.remarks.trim(),
      });

      setSuccessMessage(`Dispatch Instruction ${newRecord.diNumber} issued successfully!`);
      setTimeout(() => {
        onSuccess?.(newRecord.id);
        onClose();
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to issue Dispatch Instruction';
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
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
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Stage 10: Issue Dispatch Instruction (DI)
                </h2>
                <DemoTag text="DEMO / PHASE 4" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Authorize factory clearance and road transit for accepted JIR materials
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

          {/* JIR Linkage (Authoritative Parent) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Source JIR (Stage 09 Inspection Report) <span className="text-rose-400">*</span>
            </label>
            {eligibleJirs.length === 0 ? (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  No approved JIR records found with remaining accepted quantities. Create an accepted JIR under Stage 09 first.
                </span>
              </div>
            ) : (
              <select
                value={formData.jirId}
                onChange={(e) => handleJirChange(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                {eligibleJirs.map((j) => {
                  const rem = getRemainingDispatchQuantity(j.id);
                  return (
                    <option key={j.id} value={j.id}>
                      {j.jirNumber} — {j.material} ({rem} {j.unit} available for dispatch) • {j.projectCode}
                    </option>
                  );
                })}
              </select>
            )}
            {errors.jirId && <p className="text-xs text-rose-400 mt-1">{errors.jirId}</p>}
          </div>

          {/* Real-Time Balance Calculator Card */}
          {selectedJir && (
            <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-xl">
              <div className="text-xs font-semibold text-slate-300 mb-2.5 flex items-center justify-between">
                <span>Multi-DI Dispatch Balance Engine</span>
                <span className="text-blue-400 font-mono text-[11px]">{selectedJir.material}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">JIR Accepted</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {selectedJir.acceptedQuantity} {selectedJir.unit}
                  </div>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Prior Dispatches</div>
                  <div className="text-sm font-bold text-slate-300 mt-0.5">
                    {selectedJir.acceptedQuantity - remainingDispatch} {selectedJir.unit}
                  </div>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-blue-500/30 bg-blue-950/20">
                  <div className="text-[10px] text-blue-300 uppercase font-semibold">Available</div>
                  <div className="text-sm font-bold text-blue-400 mt-0.5">
                    {remainingDispatch} {selectedJir.unit}
                  </div>
                </div>
                <div
                  className={`p-2 rounded-lg border ${
                    isOverDispatch
                      ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="text-[10px] uppercase font-semibold">Balance After</div>
                  <div className="text-sm font-bold mt-0.5">
                    {isOverDispatch ? 'OVER CAPPED' : `${balanceAfter} ${selectedJir.unit}`}
                  </div>
                </div>
              </div>
              {isOverDispatch && (
                <div className="mt-2.5 p-2 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Dispatched quantity exceeds available balance by {enteredQuantity - remainingDispatch} {selectedJir.unit}.</span>
                </div>
              )}
            </div>
          )}

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                DI Reference Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.diNumber}
                onChange={(e) => setFormData({ ...formData, diNumber: e.target.value })}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="DI/UK/APDCL/2024/025"
              />
              {errors.diNumber && <p className="text-xs text-rose-400 mt-1">{errors.diNumber}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Quantity to Dispatch ({selectedJir?.unit || 'Nos'}) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={remainingDispatch}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                className={`w-full bg-slate-800/90 border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none transition-colors ${
                  isOverDispatch ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700 focus:border-blue-500'
                }`}
              />
              {errors.quantity && <p className="text-xs text-rose-400 mt-1">{errors.quantity}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Clearance / DI Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={formData.diDate}
                onChange={(e) => setFormData({ ...formData, diDate: e.target.value })}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
              {errors.diDate && <p className="text-xs text-rose-400 mt-1">{errors.diDate}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Scheduled Dispatch Date
              </label>
              <input
                type="date"
                value={formData.dispatchDate}
                onChange={(e) => setFormData({ ...formData, dispatchDate: e.target.value })}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Destination Site / Store <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="e.g. APDCL Central Stores, Guwahati / Bongaigaon Site Office"
              />
              {errors.destination && <p className="text-xs text-rose-400 mt-1">{errors.destination}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Vehicle Reference
              </label>
              <input
                type="text"
                value={formData.vehicleReference}
                onChange={(e) => setFormData({ ...formData, vehicleReference: e.target.value })}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="e.g. AS-01-GC-4481"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                LR / Transport Reference
              </label>
              <input
                type="text"
                value={formData.lrTransportReference}
                onChange={(e) => setFormData({ ...formData, lrTransportReference: e.target.value })}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="e.g. LR/AS-LOG/2024/884"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Dispatch Clearance Status <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as DiStatus })}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="Ready for Dispatch">Ready for Dispatch (Authorized, pending vehicle departure)</option>
                <option value="Dispatched">Dispatched (Vehicles departed factory / in transit)</option>
                <option value="Partially Dispatched">Partially Dispatched (Partial consignment cleared)</option>
                <option value="Draft">Draft (Internal clearance review)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Remarks & Dispatch Instructions
              </label>
              <textarea
                rows={2}
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Instructions for site unloader, gate pass notes, transit insurance info..."
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
              disabled={isSubmitting || eligibleJirs.length === 0 || isOverDispatch}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Issuing...' : 'Issue Dispatch Instruction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
