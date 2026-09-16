'use client';

import React, { useState } from 'react';
import { X, Plus, BellRing, CheckCircle2 } from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { InspectionCallStatus } from '@/types';
import { DemoTag } from '../common/Badge';

interface CreateInspectionCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  defaultPoId?: string;
  onSuccess?: (callId: string) => void;
}

export function CreateInspectionCallModal({
  isOpen,
  onClose,
  defaultProjectId,
  defaultPoId,
  onSuccess,
}: CreateInspectionCallModalProps) {
  const { projects, pos, getRemainingCallableQuantity, createInspectionCall } = useProjects();

  const initialProjectId = defaultProjectId || projects[0]?.id || '';
  const initialProjectPos = pos.filter((p) => p.projectId === initialProjectId && p.status !== 'Cancelled');
  const initialPo = defaultPoId ? pos.find((p) => p.id === defaultPoId) : initialProjectPos[0];
  const initialBoqItemId = initialPo?.items[0]?.boqItemId || '';

  const [formData, setFormData] = useState({
    projectId: initialProjectId,
    poId: initialPo?.id || '',
    boqItemId: initialBoqItemId,
    inspectionCallNumber: initialPo ? `IC/UK/${initialPo.projectCode.split('-')[0]}/041` : 'IC/UK/2024/041',
    quantity: 1,
    requestDate: new Date().toISOString().split('T')[0],
    proposedInspectionDate: '',
    inspectionLocation: 'Factory Works, Assam Electrical Industries Ltd, Guwahati',
    status: 'Submitted' as InspectionCallStatus,
    remarks: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Active POs for project
  const projectPos = pos.filter((p) => p.projectId === formData.projectId && p.status !== 'Cancelled');
  const selectedPo = pos.find((p) => p.id === formData.poId);

  if (!isOpen) return null;

  const selectedLine = selectedPo?.items.find((i) => i.boqItemId === formData.boqItemId);
  const remainingCallable = formData.poId && formData.boqItemId
    ? getRemainingCallableQuantity(formData.poId, formData.boqItemId)
    : 0;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.projectId) newErrors.projectId = 'Project selection is required';
    if (!formData.poId) newErrors.poId = 'Purchase Order selection is required';
    if (!formData.boqItemId) newErrors.boqItemId = 'Equipment line item selection is required';
    if (!formData.inspectionCallNumber.trim()) newErrors.inspectionCallNumber = 'Inspection Call Number is required';
    if (Number(formData.quantity) <= 0) newErrors.quantity = 'Call quantity must be greater than 0';

    // Clarification 3: Over-call prevention across all previous calls
    if (Number(formData.quantity) > remainingCallable) {
      newErrors.quantity = `Over-call error: Called quantity (${formData.quantity}) exceeds remaining callable quantity (${remainingCallable} ${selectedLine?.unit || 'Nos'})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const proj = projects.find((p) => p.id === formData.projectId);

      const newRecord = createInspectionCall({
        projectId: formData.projectId,
        projectCode: proj ? proj.code : 'PRJ-2024',
        projectName: proj ? proj.name : 'Unknown Project',
        vendorId: selectedPo!.vendorId,
        vendorName: selectedPo!.vendorName,
        poId: formData.poId,
        poNumber: selectedPo!.poNumber,
        boqItemId: formData.boqItemId,
        boqItemNumber: selectedLine ? selectedLine.boqItemNumber : '1.01',
        material: selectedLine ? selectedLine.description : 'Power Equipment',
        poQuantity: selectedLine ? selectedLine.quantity : Number(formData.quantity),
        quantity: Number(formData.quantity),
        unit: selectedLine ? selectedLine.unit : 'Nos',
        inspectionCallNumber: formData.inspectionCallNumber.trim(),
        requestDate: formData.requestDate,
        proposedInspectionDate: formData.proposedInspectionDate || formData.requestDate,
        inspectionLocation: formData.inspectionLocation.trim(),
        status: formData.status,
        remarks: formData.remarks.trim(),
      });

      setSuccessMessage(`Inspection Call ${newRecord.inspectionCallNumber} submitted successfully!`);
      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMessage('');
        onClose();
        if (onSuccess) onSuccess(newRecord.id);
      }, 700);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const errorMsg = err instanceof Error ? err.message : 'Failed to raise Inspection Call';
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
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-editorial">Raise Inspection Call</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  STAGE 07
                </span>
                <DemoTag label="QUALITY CONTROL" />
              </div>
              <p className="text-xs text-slate-400">
                Official factory inspection call to client quality engineers &amp; third-party inspection agency.
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

          {/* Project & PO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.projectId}
                onChange={(e) => {
                  const newProjId = e.target.value;
                  const relevantPos = pos.filter((p) => p.projectId === newProjId && p.status !== 'Cancelled');
                  const firstPo = relevantPos[0];
                  const firstBoq = firstPo?.items[0]?.boqItemId || '';
                  setFormData((prev) => ({
                    ...prev,
                    projectId: newProjId,
                    poId: firstPo ? firstPo.id : '',
                    boqItemId: firstBoq,
                  }));
                }}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Linked Purchase Order (PO) <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.poId}
                onChange={(e) => {
                  const newPoId = e.target.value;
                  const targetPo = pos.find((p) => p.id === newPoId);
                  const firstBoq = targetPo?.items[0]?.boqItemId || '';
                  setFormData((prev) => ({
                    ...prev,
                    poId: newPoId,
                    boqItemId: firstBoq,
                  }));
                }}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium"
              >
                {projectPos.length === 0 ? (
                  <option value="">No active POs for this project</option>
                ) : (
                  projectPos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.poNumber} — {p.vendorName}
                    </option>
                  ))
                )}
              </select>
              {errors.poId && <p className="text-[11px] text-rose-500 mt-1">{errors.poId}</p>}
            </div>
          </div>

          {/* Equipment Item from Selected PO */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              PO Equipment Line Item <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.boqItemId}
              onChange={(e) => setFormData({ ...formData, boqItemId: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              {selectedPo?.items.map((line) => {
                const rem = getRemainingCallableQuantity(selectedPo.id, line.boqItemId);
                return (
                  <option key={line.boqItemId} value={line.boqItemId}>
                    Item {line.boqItemNumber}: {line.description} (PO Total: {line.quantity} {line.unit} | Callable: {rem} {line.unit})
                  </option>
                );
              })}
            </select>
            {errors.boqItemId && <p className="text-[11px] text-rose-500 mt-1">{errors.boqItemId}</p>}
          </div>

          {/* Real-time Callable Quantity Breakdown (Clarification 3) */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Callable Quantity Limits (Multi-Call Aggregation)
            </span>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">PO Ordered Qty</span>
                <span className="text-sm font-bold font-mono text-slate-900">
                  {selectedLine?.quantity || 0} {selectedLine?.unit}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Previously Called</span>
                <span className="text-sm font-bold font-mono text-amber-700">
                  {(selectedLine?.quantity || 0) - remainingCallable} {selectedLine?.unit}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Remaining Callable</span>
                <span className="text-sm font-bold font-mono text-emerald-700">
                  {remainingCallable} {selectedLine?.unit}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center">
              Aggregates all previous non-cancelled inspection calls for this PO item.
            </p>
          </div>

          {/* Call Number, Quantity & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Inspection Call # <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.inspectionCallNumber}
                onChange={(e) => setFormData({ ...formData, inspectionCallNumber: e.target.value })}
                placeholder="e.g. IC/UK/2024/018"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
              {errors.inspectionCallNumber && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.inspectionCallNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Call Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono font-bold"
              />
              {errors.quantity && <p className="text-[11px] text-rose-500 mt-1">{errors.quantity}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Call Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as InspectionCallStatus })
                }
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="Submitted">Submitted to Client</option>
                <option value="Under Review">Under Review</option>
                <option value="Scheduled">Inspection Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Draft">Draft</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Dates & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Request Date
              </label>
              <input
                type="date"
                value={formData.requestDate}
                onChange={(e) => setFormData({ ...formData, requestDate: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Proposed Inspection Date
              </label>
              <input
                type="date"
                value={formData.proposedInspectionDate}
                onChange={(e) => setFormData({ ...formData, proposedInspectionDate: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Factory Inspection Location
            </label>
            <input
              type="text"
              value={formData.inspectionLocation}
              onChange={(e) => setFormData({ ...formData, inspectionLocation: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks</label>
            <textarea
              rows={2}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="e.g. Routine testing setup ready. Routine test certificate copies attached."
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
              disabled={isSubmitting || remainingCallable <= 0}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Inspection Call'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
