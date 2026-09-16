'use client';

import React, { useState } from 'react';
import { X, Plus, ShoppingCart, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { PoStatus } from '@/types';
import { DemoTag } from '../common/Badge';

interface CreatePoModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  onSuccess?: (poId: string) => void;
}

interface DraftLineItem {
  boqItemId: string;
  quantity: number;
  rate: number;
}

export function CreatePoModal({
  isOpen,
  onClose,
  defaultProjectId,
  onSuccess,
}: CreatePoModalProps) {
  const { projects, boqItems, vendors, getRemainingBoqQuantity, createPo } = useProjects();

  const [formData, setFormData] = useState({
    projectId: defaultProjectId || projects[0]?.id || '',
    vendorId: '',
    poNumber: '',
    poDate: new Date().toISOString().split('T')[0],
    status: 'Issued' as PoStatus,
    remarks: '',
  });

  const [selectedLines, setSelectedLines] = useState<DraftLineItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const projectBoqItems = boqItems.filter((b) => b.projectId === formData.projectId);

  const handleAddLine = (boqItemId: string) => {
    if (!boqItemId) return;
    if (selectedLines.some((l) => l.boqItemId === boqItemId)) return;
    const boq = boqItems.find((b) => b.id === boqItemId);
    if (!boq) return;

    const remaining = getRemainingBoqQuantity(boqItemId);
    const initialQty = Math.min(remaining, boq.quantity);

    setSelectedLines((prev) => [
      ...prev,
      {
        boqItemId,
        quantity: initialQty > 0 ? initialQty : 1,
        rate: boq.rate,
      },
    ]);
  };

  const handleRemoveLine = (boqItemId: string) => {
    setSelectedLines((prev) => prev.filter((l) => l.boqItemId !== boqItemId));
  };

  const handleLineQtyChange = (boqItemId: string, qty: number) => {
    setSelectedLines((prev) =>
      prev.map((l) => (l.boqItemId === boqItemId ? { ...l, quantity: qty } : l))
    );
  };

  const totalCalculatedAmount = selectedLines.reduce((sum, line) => {
    return sum + Math.round((line.quantity || 0) * (line.rate || 0));
  }, 0);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.projectId) newErrors.projectId = 'Project selection is required';
    if (!formData.vendorId) newErrors.vendorId = 'Vendor selection is strictly required for PO issuance';
    if (!formData.poNumber.trim()) newErrors.poNumber = 'Purchase Order Number is required';
    if (selectedLines.length === 0) newErrors.lines = 'At least one BOQ line item must be added';

    // Clarification 2 & 5: Over-order prevention across ALL relevant active/non-cancelled POs
    for (const line of selectedLines) {
      const boq = boqItems.find((b) => b.id === line.boqItemId);
      const remaining = getRemainingBoqQuantity(line.boqItemId);
      if (line.quantity <= 0) {
        newErrors.lines = `Quantity for Item ${boq?.itemNumber} must be greater than 0`;
        break;
      }
      if (line.quantity > remaining) {
        newErrors.lines = `Over-order prevented: Ordered qty (${line.quantity}) exceeds remaining BOQ balance (${remaining} ${boq?.unit}) for Item ${boq?.itemNumber}`;
        break;
      }
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
      const vendor = vendors.find((v) => v.id === formData.vendorId);

      const items = selectedLines.map((l, idx) => {
        const boq = boqItems.find((b) => b.id === l.boqItemId)!;
        const lineRemaining = getRemainingBoqQuantity(l.boqItemId);
        return {
          id: `POL-${String(idx + 1).padStart(3, '0')}`,
          poId: '',
          boqItemId: l.boqItemId,
          boqItemNumber: boq.itemNumber,
          description: boq.description,
          boqQuantity: boq.quantity,
          quantity: l.quantity,
          balanceQuantity: lineRemaining - l.quantity,
          unit: boq.unit,
          rate: l.rate,
          amount: Math.round(l.quantity * l.rate),
        };
      });

      const newRecord = createPo({
        projectId: formData.projectId,
        projectCode: proj ? proj.code : 'PRJ-2024',
        projectName: proj ? proj.name : 'Unknown Project',
        vendorId: formData.vendorId,
        vendorName: vendor ? vendor.name : 'Unknown Vendor',
        poNumber: formData.poNumber.trim(),
        poDate: formData.poDate,
        items,
        status: formData.status,
        remarks: formData.remarks.trim(),
      });

      setSuccessMessage(`Purchase Order ${newRecord.poNumber} issued successfully!`);
      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMessage('');
        onClose();
        if (onSuccess) onSuccess(newRecord.id);
      }, 700);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const errorMsg = err instanceof Error ? err.message : 'Failed to issue Purchase Order';
      setErrors({ form: errorMsg });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0A192F] text-white flex items-center justify-between border-b border-[#152747]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 flex items-center justify-center text-blue-300 border border-blue-400/30">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-editorial">Issue Purchase Order (PO)</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  STAGE 06
                </span>
                <DemoTag label="PROCUREMENT" />
              </div>
              <p className="text-xs text-slate-400">
                Issue official PO to manufacturing vendor against BOQ line items with over-order prevention.
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

          {(errors.form || errors.lines) && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errors.form || errors.lines}</span>
            </div>
          )}

          {/* Project & Vendor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.projectId}
                onChange={(e) => {
                  setFormData({ ...formData, projectId: e.target.value });
                  setSelectedLines([]);
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
                Vendor / Manufacturer <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.vendorId}
                onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium"
              >
                <option value="">— Select Required Vendor —</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.category})
                  </option>
                ))}
              </select>
              {errors.vendorId && <p className="text-[11px] text-rose-500 mt-1">{errors.vendorId}</p>}
            </div>
          </div>

          {/* PO Number & PO Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PO Reference Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.poNumber}
                onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                placeholder="e.g. PO/UK/APDCL/2024/045"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
              {errors.poNumber && <p className="text-[11px] text-rose-500 mt-1">{errors.poNumber}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PO Date
              </label>
              <input
                type="date"
                value={formData.poDate}
                onChange={(e) => setFormData({ ...formData, poDate: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PO Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as PoStatus })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="Issued">Issued to Vendor</option>
                <option value="Acknowledged">Acknowledged by Vendor</option>
                <option value="In Progress">In Progress (Manufacturing)</option>
                <option value="Closed">Closed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Line Items Section (Clarification 2: Multi-PO aggregation & over-order prevention) */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                PO Equipment Line Items
              </span>
              <div className="flex items-center gap-2">
                <select
                  id="add-boq-select"
                  className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-white text-slate-700"
                  onChange={(e) => {
                    handleAddLine(e.target.value);
                    e.target.value = '';
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    + Add BOQ Item to PO
                  </option>
                  {projectBoqItems.map((b) => {
                    const rem = getRemainingBoqQuantity(b.id);
                    return (
                      <option key={b.id} value={b.id} disabled={rem === 0}>
                        Item {b.itemNumber} (Available: {rem} {b.unit}) — {b.description.substring(0, 30)}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {selectedLines.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-6 text-center text-xs text-slate-500">
                No items added yet. Select a BOQ item above to add it to this Purchase Order.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-600 uppercase">
                    <tr>
                      <th className="px-3 py-2">Item # &amp; Description</th>
                      <th className="px-3 py-2 text-right">BOQ Total</th>
                      <th className="px-3 py-2 text-right">Available Balance</th>
                      <th className="px-3 py-2 text-right w-28">Order Qty</th>
                      <th className="px-3 py-2 text-right">Rate (₹)</th>
                      <th className="px-3 py-2 text-right">Line Amount (₹)</th>
                      <th className="px-2 py-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedLines.map((line) => {
                      const boq = boqItems.find((b) => b.id === line.boqItemId)!;
                      const remaining = getRemainingBoqQuantity(line.boqItemId);
                      const isOverOrdered = line.quantity > remaining;
                      const lineAmount = Math.round(line.quantity * line.rate);

                      return (
                        <tr key={line.boqItemId} className={isOverOrdered ? 'bg-rose-50/50' : 'bg-white'}>
                          <td className="px-3 py-2.5">
                            <span className="font-mono font-bold text-slate-800 mr-1.5">
                              {boq.itemNumber}
                            </span>
                            <span className="text-slate-600 truncate max-w-xs inline-block align-bottom">
                              {boq.description}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-slate-500">
                            {boq.quantity} {boq.unit}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-700">
                            {remaining} {boq.unit}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              value={line.quantity}
                              onChange={(e) =>
                                handleLineQtyChange(line.boqItemId, parseFloat(e.target.value) || 0)
                              }
                              className={`w-20 text-xs px-2 py-1 text-right border rounded font-mono font-bold ${
                                isOverOrdered
                                  ? 'border-rose-500 text-rose-700 bg-rose-50 focus:ring-rose-500'
                                  : 'border-slate-300 text-slate-900 bg-white'
                              }`}
                            />
                            {isOverOrdered && (
                              <span className="block text-[9px] text-rose-600 font-semibold mt-0.5">
                                Exceeds {remaining}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-slate-600">
                            ₹ {line.rate.toLocaleString('en-IN')}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-blue-900">
                            ₹ {lineAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(line.boqItemId)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200">
                    <tr>
                      <td colSpan={5} className="px-3 py-2 text-right text-xs font-bold text-slate-700">
                        Total PO Contract Value:
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-sm text-blue-950">
                        ₹ {totalCalculatedAmount.toLocaleString('en-IN')}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Remarks &amp; Delivery Milestones
            </label>
            <textarea
              rows={2}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="e.g. Delivery required within 12 weeks from GTP clearance. Payment terms: 70% against dispatch."
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
              disabled={isSubmitting || selectedLines.length === 0}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Issuing...' : 'Issue Purchase Order'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
