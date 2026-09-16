'use client';

import React, { useState } from 'react';
import { X, Plus, ClipboardCheck, CheckCircle2 } from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { InspectionOrderStatus } from '@/types';
import { DemoTag } from '../common/Badge';

interface CreateInspectionOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCallId?: string;
  onSuccess?: (orderId: string) => void;
}

export function CreateInspectionOrderModal({
  isOpen,
  onClose,
  defaultCallId,
  onSuccess,
}: CreateInspectionOrderModalProps) {
  const { inspectionCalls, createInspectionOrder } = useProjects();

  const activeCalls = inspectionCalls.filter((c) => c.status !== 'Cancelled');

  const initialCall = defaultCallId ? activeCalls.find((c) => c.id === defaultCallId) : activeCalls[0];
  const initialOrderNum = initialCall ? `IO/${initialCall.projectCode.split('-')[0]}/2024/051` : 'IO/UK/2024/051';
  const initialInspectionDate = initialCall?.proposedInspectionDate || new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    inspectionCallId: initialCall?.id || '',
    inspectionOrderNumber: initialOrderNum,
    orderDate: new Date().toISOString().split('T')[0],
    inspectionDate: initialInspectionDate,
    assignedAuthority: 'Chief General Manager (QC) / TPIA - RITES Ltd.',
    assignedPerson: 'P. K. Sarmah, Dy. General Manager (QC)',
    status: 'Issued' as InspectionOrderStatus,
    remarks: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const selectedCall = activeCalls.find((c) => c.id === formData.inspectionCallId);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    // Clarification 5: Orphan Inspection Order prevention
    if (!formData.inspectionCallId) {
      newErrors.inspectionCallId = 'Orphan prevention: Inspection Order must be linked to a valid Inspection Call';
    } else if (!activeCalls.some((c) => c.id === formData.inspectionCallId)) {
      newErrors.inspectionCallId = 'Referenced Inspection Call does not exist or is cancelled';
    }

    if (!formData.inspectionOrderNumber.trim()) {
      newErrors.inspectionOrderNumber = 'Inspection Order Number is required';
    }
    if (!formData.assignedAuthority.trim()) {
      newErrors.assignedAuthority = 'Assigned Authority / Inspection Agency is required';
    }
    if (!formData.inspectionDate) {
      newErrors.inspectionDate = 'Formal Inspection Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const call = selectedCall!;

      const newRecord = createInspectionOrder({
        inspectionCallId: call.id,
        inspectionCallNumber: call.inspectionCallNumber,
        projectId: call.projectId,
        projectCode: call.projectCode,
        projectName: call.projectName,
        vendorId: call.vendorId,
        vendorName: call.vendorName,
        poId: call.poId,
        poNumber: call.poNumber,
        boqItemId: call.boqItemId,
        material: call.material,
        quantity: call.quantity,
        unit: call.unit,
        inspectionOrderNumber: formData.inspectionOrderNumber.trim(),
        orderDate: formData.orderDate,
        inspectionDate: formData.inspectionDate,
        inspectionLocation: call.inspectionLocation,
        assignedAuthority: formData.assignedAuthority.trim(),
        assignedPerson: formData.assignedPerson.trim(),
        status: formData.status,
        remarks: formData.remarks.trim(),
      });

      setSuccessMessage(`Inspection Order ${newRecord.inspectionOrderNumber} issued successfully!`);
      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMessage('');
        onClose();
        if (onSuccess) onSuccess(newRecord.id);
      }, 700);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const errorMsg = err instanceof Error ? err.message : 'Failed to issue Inspection Order';
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
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-editorial">Issue Inspection Order</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  STAGE 08
                </span>
                <DemoTag label="QUALITY ASSURANCE" />
              </div>
              <p className="text-xs text-slate-400">
                Official authorization order &amp; inspector deputation linked to valid Inspection Call.
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

          {/* Linked Inspection Call (Orphan prevention) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Linked Inspection Call <span className="text-rose-500">*</span></span>
              <span className="text-[10px] text-blue-600 font-mono">Strict Parent Linkage</span>
            </label>
            <select
              value={formData.inspectionCallId}
              onChange={(e) => {
                const callId = e.target.value;
                const call = activeCalls.find((c) => c.id === callId);
                setFormData((prev) => ({
                  ...prev,
                  inspectionCallId: callId,
                  inspectionOrderNumber: call
                    ? `IO/${call.projectCode.split('-')[0]}/2024/051`
                    : prev.inspectionOrderNumber,
                  inspectionDate: call?.proposedInspectionDate || prev.inspectionDate,
                }));
              }}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium"
            >
              {activeCalls.length === 0 ? (
                <option value="">No active Inspection Calls available</option>
              ) : (
                activeCalls.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.inspectionCallNumber} — {c.material} ({c.quantity} {c.unit}) against {c.poNumber}
                  </option>
                ))
              )}
            </select>
            {errors.inspectionCallId && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.inspectionCallId}</p>
            )}
          </div>

          {/* Call Metadata Display */}
          {selectedCall && (
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 block">Project</span>
                  <span className="font-semibold text-slate-800">{selectedCall.projectCode}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Manufacturer</span>
                  <span className="font-semibold text-slate-800 truncate block">{selectedCall.vendorName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Equipment</span>
                  <span className="font-semibold text-slate-800 truncate block">{selectedCall.material}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Offered Quantity</span>
                  <span className="font-bold font-mono text-blue-900">
                    {selectedCall.quantity} {selectedCall.unit}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Order Ref & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Inspection Order # <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.inspectionOrderNumber}
                onChange={(e) => setFormData({ ...formData, inspectionOrderNumber: e.target.value })}
                placeholder="e.g. IO/APDCL/2024/085"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
              {errors.inspectionOrderNumber && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.inspectionOrderNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Order Date
              </label>
              <input
                type="date"
                value={formData.orderDate}
                onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Scheduled Inspection Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.inspectionDate}
                onChange={(e) => setFormData({ ...formData, inspectionDate: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
              {errors.inspectionDate && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.inspectionDate}</p>
              )}
            </div>
          </div>

          {/* Assigned Authority & Inspecting Officer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Inspection Authority <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.assignedAuthority}
                onChange={(e) => setFormData({ ...formData, assignedAuthority: e.target.value })}
                placeholder="e.g. CGM (Quality Assurance) / RITES Ltd."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {errors.assignedAuthority && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.assignedAuthority}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deputed Inspecting Officer
              </label>
              <input
                type="text"
                value={formData.assignedPerson}
                onChange={(e) => setFormData({ ...formData, assignedPerson: e.target.value })}
                placeholder="e.g. P. K. Sarmah, Dy. General Manager"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status & Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Order Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as InspectionOrderStatus })
                }
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="Issued">Issued / Deputed</option>
                <option value="Scheduled">Scheduled at Factory</option>
                <option value="Completed">Completed (JIR Signed)</option>
                <option value="Draft">Draft</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Special Instructions</label>
              <input
                type="text"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="e.g. Conduct witness of lightning impulse test & temperature rise test."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
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
              disabled={isSubmitting || !selectedCall}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Issuing...' : 'Issue Inspection Order'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
