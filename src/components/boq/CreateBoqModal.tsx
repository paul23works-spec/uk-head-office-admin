'use client';

import React, { useState } from 'react';
import { X, Plus, ListTree, CheckCircle2 } from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { DemoTag } from '../common/Badge';

interface CreateBoqModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  onSuccess?: (boqId: string) => void;
}

export function CreateBoqModal({
  isOpen,
  onClose,
  defaultProjectId,
  onSuccess,
}: CreateBoqModalProps) {
  const { projects, vendors, createBoqItem } = useProjects();

  const selectedDefaultProject = defaultProjectId
    ? projects.find((p) => p.id === defaultProjectId)
    : undefined;

  const [formData, setFormData] = useState({
    projectId: selectedDefaultProject ? selectedDefaultProject.id : projects[0]?.id || '',
    itemNumber: '',
    description: '',
    specification: '',
    category: 'Transformers',
    quantity: 1,
    unit: 'Nos',
    rate: 0,
    vendorId: '', // OPTIONAL at creation per Clarification 1
    remarks: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const calculatedAmount = Math.round(Number(formData.quantity || 0) * Number(formData.rate || 0));

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.projectId) newErrors.projectId = 'Project selection is required';
    if (!formData.itemNumber.trim()) newErrors.itemNumber = 'Item number is required (e.g. 1.01)';
    if (!formData.description.trim()) newErrors.description = 'Item description is required';
    if (Number(formData.quantity) <= 0) newErrors.quantity = 'Quantity must be greater than 0';
    if (Number(formData.rate) <= 0) newErrors.rate = 'Unit rate must be greater than 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const proj = projects.find((p) => p.id === formData.projectId);
      const selectedVendor = vendors.find((v) => v.id === formData.vendorId);

      const newRecord = createBoqItem({
        projectId: formData.projectId,
        projectCode: proj ? proj.code : 'PRJ-2024',
        projectName: proj ? proj.name : 'Unknown Project',
        itemNumber: formData.itemNumber.trim(),
        description: formData.description.trim(),
        specification: formData.specification.trim(),
        category: formData.category,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        rate: Number(formData.rate),
        vendorId: selectedVendor ? selectedVendor.id : undefined,
        vendorName: selectedVendor ? selectedVendor.name : undefined,
        remarks: formData.remarks.trim(),
      });

      setSuccessMessage(`BOQ Item ${newRecord.itemNumber} created successfully!`);
      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMessage('');
        onClose();
        if (onSuccess) onSuccess(newRecord.id);
      }, 700);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const errorMsg = err instanceof Error ? err.message : 'Failed to create BOQ item';
      setErrors({ form: errorMsg });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#0A192F] text-white flex items-center justify-between border-b border-[#152747]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 flex items-center justify-center text-blue-300 border border-blue-400/30">
              <ListTree className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-editorial">Add BOQ Line Item</h3>
                <DemoTag label="FOUNDATION DATA" />
              </div>
              <p className="text-xs text-slate-400">
                Register Bill of Quantities item with rate and deterministic amount.
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

        {/* Modal Body */}
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

          {/* Project & Item Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
              {errors.projectId && <p className="text-[11px] text-rose-500 mt-1">{errors.projectId}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                BOQ Item Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.itemNumber}
                onChange={(e) => setFormData({ ...formData, itemNumber: e.target.value })}
                placeholder="e.g. 1.01 or 2.04"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {errors.itemNumber && <p className="text-[11px] text-rose-500 mt-1">{errors.itemNumber}</p>}
            </div>
          </div>

          {/* Category & Vendor (Optional at BOQ Level) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Equipment / Material Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="Transformers">Transformers</option>
                <option value="Switchgear">Switchgear</option>
                <option value="Conductors & Cables">Conductors & Cables</option>
                <option value="Towers & Substation Structures">Towers & Substation Structures</option>
                <option value="Control & Relay Panels">Control & Relay Panels</option>
                <option value="Insulators & Hardware">Insulators & Hardware</option>
                <option value="Civil & Foundation">Civil & Foundation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Associated Vendor</span>
                <span className="text-[10px] font-normal text-slate-400">(Optional at BOQ creation)</span>
              </label>
              <select
                value={formData.vendorId}
                onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="">— Unassigned (Vendor linked at GTP/PO) —</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Item Description <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Supply and erection of 25 MVA 132/33 kV Power Transformer"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {errors.description && <p className="text-[11px] text-rose-500 mt-1">{errors.description}</p>}
          </div>

          {/* Technical Specifications */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Technical Specification
            </label>
            <input
              type="text"
              value={formData.specification}
              onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
              placeholder="e.g. Copper wound, ONAN/ONAF, with RTCC panel & OLTC per TS-2023-TRF"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Quantity, Unit, Rate & Auto Calculated Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-mono"
              />
              {errors.quantity && <p className="text-[10px] text-rose-500 mt-0.5">{errors.quantity}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Unit
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white"
              >
                <option value="Nos">Nos</option>
                <option value="Sets">Sets</option>
                <option value="Km">Km</option>
                <option value="Mtr">Mtr</option>
                <option value="MT">MT</option>
                <option value="Lot">Lot</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Unit Rate (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-mono"
              />
              {errors.rate && <p className="text-[10px] text-rose-500 mt-0.5">{errors.rate}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Total Amount (₹)
              </label>
              <div className="w-full text-xs px-2.5 py-1.5 bg-blue-50/70 border border-blue-200 rounded-md font-mono font-bold text-blue-900 truncate">
                ₹ {calculatedAmount.toLocaleString('en-IN')}
              </div>
              <p className="text-[9px] text-slate-400 mt-0.5 font-mono">Qty × Rate</p>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks</label>
            <textarea
              rows={2}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Optional notes or milestone link..."
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
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Add BOQ Item'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
