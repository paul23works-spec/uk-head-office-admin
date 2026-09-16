'use client';

import React, { useState } from 'react';
import { X, Plus, FileBadge, CheckCircle2, Calculator } from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { JirStatus } from '@/types';
import { DemoTag } from '../common/Badge';

interface CreateJirModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultOrderId?: string;
  onSuccess?: (jirId: string) => void;
}

export function CreateJirModal({
  isOpen,
  onClose,
  defaultOrderId,
  onSuccess,
}: CreateJirModalProps) {
  const { inspectionOrders, createJir } = useProjects();

  const activeOrders = inspectionOrders.filter((o) => o.status !== 'Cancelled');
  const initialOrder = defaultOrderId ? activeOrders.find((o) => o.id === defaultOrderId) : activeOrders[0];
  const initialOffered = initialOrder ? initialOrder.quantity : 0;
  const initialJirNum = initialOrder ? `JIR/${initialOrder.projectCode.split('-')[0]}/2024/011` : 'JIR/UK/2024/011';
  const initialInspectionDate = initialOrder?.inspectionDate || new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    inspectionOrderId: initialOrder?.id || '',
    jirNumber: initialJirNum,
    inspectionDate: initialInspectionDate,
    inspectedQuantity: initialOffered,
    acceptedQuantity: initialOffered,
    rejectedQuantity: 0,
    observations: 'All routine electrical and mechanical tests witnessed as per approved GTP & IS specifications.',
    testResults: 'Insulation Resistance: Satisfactory • High Voltage Test: Passed • Temperature Rise: Within limits',
    status: 'Accepted' as JirStatus,
    remarks: 'Clearance recommended for Stage 10 Dispatch Instruction.',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const selectedOrder = activeOrders.find((o) => o.id === formData.inspectionOrderId);

  if (!isOpen) return null;

  const offered = selectedOrder?.quantity || 0;
  const inspected = Number(formData.inspectedQuantity || 0);
  const accepted = Number(formData.acceptedQuantity || 0);
  const rejected = Number(formData.rejectedQuantity || 0);
  const balance = Math.max(0, offered - accepted);

  // Real-time arithmetic checks
  const isInspectedValid = inspected >= 0 && inspected <= offered;
  const isAcceptedRejectedValid = accepted >= 0 && rejected >= 0 && (accepted + rejected) <= inspected;
  const isArithmeticValid = isInspectedValid && isAcceptedRejectedValid;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    // Clarification 5: Orphan JIR prevention
    if (!formData.inspectionOrderId) {
      newErrors.inspectionOrderId = 'Orphan prevention: JIR must be linked to a valid Inspection Order';
    } else if (!activeOrders.some((o) => o.id === formData.inspectionOrderId)) {
      newErrors.inspectionOrderId = 'Referenced Inspection Order does not exist or is cancelled';
    }

    if (!formData.jirNumber.trim()) {
      newErrors.jirNumber = 'JIR Number is required';
    }

    // Clarification 5: Boundary conditions
    if (inspected > offered) {
      newErrors.inspectedQuantity = `Inspected quantity (${inspected}) cannot exceed offered quantity (${offered})`;
    }
    if (inspected <= 0) {
      newErrors.inspectedQuantity = 'Inspected quantity must be greater than 0';
    }
    if (accepted + rejected > inspected) {
      newErrors.acceptedQuantity = `Sum of accepted (${accepted}) and rejected (${rejected}) = ${accepted + rejected}, which exceeds inspected quantity (${inspected})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const order = selectedOrder!;

      const newRecord = createJir({
        inspectionOrderId: order.id,
        inspectionOrderNumber: order.inspectionOrderNumber,
        inspectionCallId: order.inspectionCallId,
        inspectionCallNumber: order.inspectionCallNumber,
        projectId: order.projectId,
        projectCode: order.projectCode,
        projectName: order.projectName,
        vendorId: order.vendorId,
        vendorName: order.vendorName,
        poId: order.poId,
        poNumber: order.poNumber,
        boqItemId: order.boqItemId,
        material: order.material,
        unit: order.unit,
        offeredQuantity: offered,
        inspectedQuantity: inspected,
        acceptedQuantity: accepted,
        rejectedQuantity: rejected,
        inspectionDate: formData.inspectionDate,
        observations: formData.observations.trim(),
        testResults: formData.testResults.trim(),
        status: formData.status,
        remarks: formData.remarks.trim(),
        jirNumber: formData.jirNumber.trim(),
      });

      setSuccessMessage(`Joint Inspection Report ${newRecord.jirNumber} recorded successfully!`);
      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMessage('');
        onClose();
        if (onSuccess) onSuccess(newRecord.id);
      }, 700);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const errorMsg = err instanceof Error ? err.message : 'Failed to record JIR';
      setErrors({ form: errorMsg });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0A192F] text-white flex items-center justify-between border-b border-[#152747]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 flex items-center justify-center text-blue-300 border border-blue-400/30">
              <FileBadge className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-editorial">Record Joint Inspection Report (JIR)</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  STAGE 09
                </span>
                <DemoTag label="QUALITY SIGN-OFF" />
              </div>
              <p className="text-xs text-slate-400">
                Joint quality sign-off with strict quantity arithmetic boundary enforcement.
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errors.form && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-sm">
              {errors.form}
            </div>
          )}

          {/* Linked Inspection Order */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Linked Inspection Order <span className="text-rose-500">*</span></span>
              <span className="text-[10px] text-blue-600 font-mono">Strict Parent Linkage</span>
            </label>
            <select
              value={formData.inspectionOrderId}
              onChange={(e) => {
                const orderId = e.target.value;
                const order = activeOrders.find((o) => o.id === orderId);
                const off = order ? order.quantity : 0;
                setFormData((prev) => ({
                  ...prev,
                  inspectionOrderId: orderId,
                  jirNumber: order ? `JIR/${order.projectCode.split('-')[0]}/2024/011` : prev.jirNumber,
                  inspectedQuantity: off,
                  acceptedQuantity: off,
                  rejectedQuantity: 0,
                  inspectionDate: order?.inspectionDate || prev.inspectionDate,
                }));
              }}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium"
            >
              {activeOrders.length === 0 ? (
                <option value="">No active Inspection Orders available</option>
              ) : (
                activeOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.inspectionOrderNumber} — {o.material} ({o.quantity} {o.unit}) [{o.assignedAuthority}]
                  </option>
                ))
              )}
            </select>
            {errors.inspectionOrderId && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.inspectionOrderId}</p>
            )}
          </div>

          {/* Order Metadata */}
          {selectedOrder && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <span className="text-[10px] text-slate-500 block">Project</span>
                <span className="font-semibold text-slate-800">{selectedOrder.projectCode}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Manufacturer</span>
                <span className="font-semibold text-slate-800 truncate block">{selectedOrder.vendorName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Equipment</span>
                <span className="font-semibold text-slate-800 truncate block">{selectedOrder.material}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Offered Qty</span>
                <span className="font-mono font-bold text-blue-900">{offered} {selectedOrder.unit}</span>
              </div>
            </div>
          )}

          {/* JIR Number & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                JIR Document Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.jirNumber}
                onChange={(e) => setFormData({ ...formData, jirNumber: e.target.value })}
                placeholder="e.g. JIR/APDCL/2024/108"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
              {errors.jirNumber && <p className="text-[11px] text-rose-500 mt-1">{errors.jirNumber}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Inspection Date
              </label>
              <input
                type="date"
                value={formData.inspectionDate}
                onChange={(e) => setFormData({ ...formData, inspectionDate: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Arithmetic Boundary Condition Card (Clarification 5) */}
          <div
            className={`p-4 rounded-lg border ${
              isArithmeticValid ? 'bg-slate-50 border-slate-200' : 'bg-rose-50 border-rose-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-blue-600" />
                <span>Quantity Arithmetic Bounds</span>
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  isArithmeticValid
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                }`}
              >
                {isArithmeticValid ? '✓ Bounds Satisfied' : '✕ Arithmetic Violation'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Offered */}
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Offered Qty</span>
                <span className="text-sm font-bold font-mono text-slate-800 block mt-1">
                  {offered} {selectedOrder?.unit || 'Nos'}
                </span>
                <span className="text-[9px] text-slate-400">Fixed from IO</span>
              </div>

              {/* Inspected */}
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <label className="text-[10px] text-slate-700 font-semibold block mb-0.5">
                  Inspected Qty <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.inspectedQuantity}
                  onChange={(e) =>
                    setFormData({ ...formData, inspectedQuantity: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full text-xs px-2 py-1 border border-slate-300 rounded font-mono font-bold text-slate-900"
                />
                <span className="text-[9px] text-slate-400 block mt-0.5">Must be ≤ Offered</span>
              </div>

              {/* Accepted */}
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <label className="text-[10px] text-slate-700 font-semibold block mb-0.5">
                  Accepted Qty <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.acceptedQuantity}
                  onChange={(e) =>
                    setFormData({ ...formData, acceptedQuantity: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full text-xs px-2 py-1 border border-slate-300 rounded font-mono font-bold text-emerald-800 bg-emerald-50/50"
                />
                <span className="text-[9px] text-slate-400 block mt-0.5">Cleared for DI</span>
              </div>

              {/* Rejected */}
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <label className="text-[10px] text-slate-700 font-semibold block mb-0.5">
                  Rejected Qty
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.rejectedQuantity}
                  onChange={(e) =>
                    setFormData({ ...formData, rejectedQuantity: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full text-xs px-2 py-1 border border-slate-300 rounded font-mono font-bold text-rose-800 bg-rose-50/50"
                />
                <span className="text-[9px] text-slate-400 block mt-0.5">Accepted + Rej ≤ Insp</span>
              </div>
            </div>

            {/* Real-time Math Feedback */}
            <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs gap-2">
              <span className="font-mono text-slate-600">
                Formula: {accepted} (Acc) + {rejected} (Rej) = {accepted + rejected} ≤ {inspected} (Insp) ≤ {offered} (Offered)
              </span>
              <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                Unaccepted Balance = {balance} {selectedOrder?.unit}
              </span>
            </div>

            {(errors.inspectedQuantity || errors.acceptedQuantity) && (
              <div className="mt-2 text-xs text-rose-700 font-semibold">
                {errors.inspectedQuantity || errors.acceptedQuantity}
              </div>
            )}
          </div>

          {/* Test Results & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                JIR Verdict Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as JirStatus })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-semibold text-slate-900"
              >
                <option value="Accepted">Accepted (100% Cleared)</option>
                <option value="Partially Accepted">Partially Accepted</option>
                <option value="Completed">Completed</option>
                <option value="Under Inspection">Under Inspection (Witness In Progress)</option>
                <option value="Rejected">Rejected (Retest Required)</option>
                <option value="Draft">Draft</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Witnessed Test Results Summary
              </label>
              <input
                type="text"
                value={formData.testResults}
                onChange={(e) => setFormData({ ...formData, testResults: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Observations */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Inspection Observations &amp; Joint Findings
            </label>
            <textarea
              rows={2}
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Recommendations &amp; Remarks</label>
            <input
              type="text"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isArithmeticValid}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording...' : 'Record JIR Sign-Off'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
