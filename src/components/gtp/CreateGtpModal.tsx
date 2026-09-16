'use client';

import React, { useState } from 'react';
import { X, Plus, Cpu, CheckCircle2, History } from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { GtpStatus } from '@/types';
import { DemoTag } from '../common/Badge';

interface CreateGtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  defaultBoqItemId?: string;
  onSuccess?: (gtpId: string) => void;
}

export function CreateGtpModal({
  isOpen,
  onClose,
  defaultProjectId,
  defaultBoqItemId,
  onSuccess,
}: CreateGtpModalProps) {
  const { projects, boqItems, vendors, gtps, createGtp } = useProjects();

  const computeBoqDefaults = (boqItemId: string, currentVendorId?: string) => {
    const boq = boqItems.find((b) => b.id === boqItemId);
    if (!boq) {
      return {
        boqItemId: '',
        materialItem: '',
        vendorId: currentVendorId || vendors[0]?.id || '',
        revision: 'R0',
        previousRevisionRef: '',
        gtpNumber: '',
      };
    }
    const existingForBoq = gtps.filter((g) => g.boqItemId === boqItemId);
    const resolvedVendorId = currentVendorId || boq.vendorId || vendors[0]?.id || '';
    if (existingForBoq.length > 0) {
      const sorted = [...existingForBoq].sort((a, b) => {
        const revA = parseInt(a.revision.replace(/\D/g, '') || '0', 10);
        const revB = parseInt(b.revision.replace(/\D/g, '') || '0', 10);
        return revB - revA;
      });
      const latest = sorted[0];
      const nextRevNum = parseInt(latest.revision.replace(/\D/g, '') || '0', 10) + 1;
      return {
        boqItemId: boq.id,
        materialItem: boq.description,
        vendorId: resolvedVendorId,
        revision: `R${nextRevNum}`,
        previousRevisionRef: `${latest.gtpNumber} (${latest.revision})`,
        gtpNumber: `GTP/${boq.projectCode.split('-')[0]}/${boq.itemNumber.replace('.', '')}/00${existingForBoq.length + 1}`,
      };
    } else {
      return {
        boqItemId: boq.id,
        materialItem: boq.description,
        vendorId: resolvedVendorId,
        revision: 'R0',
        previousRevisionRef: '',
        gtpNumber: `GTP/${boq.projectCode.split('-')[0]}/${boq.itemNumber.replace('.', '')}/001`,
      };
    }
  };

  const [formData, setFormData] = useState(() => {
    const initialProjectId = defaultProjectId || projects[0]?.id || '';
    const projBoqs = boqItems.filter((b) => b.projectId === initialProjectId);
    const targetBoq = defaultBoqItemId
      ? boqItems.find((b) => b.id === defaultBoqItemId)
      : projBoqs[0];

    let boqDefaults = {
      boqItemId: '',
      materialItem: '',
      vendorId: vendors[0]?.id || '',
      revision: 'R0',
      previousRevisionRef: '',
      gtpNumber: '',
    };

    if (targetBoq) {
      const existingForBoq = gtps.filter((g) => g.boqItemId === targetBoq.id);
      const resolvedVendorId = targetBoq.vendorId || vendors[0]?.id || '';
      if (existingForBoq.length > 0) {
        const sorted = [...existingForBoq].sort((a, b) => {
          const revA = parseInt(a.revision.replace(/\D/g, '') || '0', 10);
          const revB = parseInt(b.revision.replace(/\D/g, '') || '0', 10);
          return revB - revA;
        });
        const latest = sorted[0];
        const nextRevNum = parseInt(latest.revision.replace(/\D/g, '') || '0', 10) + 1;
        boqDefaults = {
          boqItemId: targetBoq.id,
          materialItem: targetBoq.description,
          vendorId: resolvedVendorId,
          revision: `R${nextRevNum}`,
          previousRevisionRef: `${latest.gtpNumber} (${latest.revision})`,
          gtpNumber: `GTP/${targetBoq.projectCode.split('-')[0]}/${targetBoq.itemNumber.replace('.', '')}/00${existingForBoq.length + 1}`,
        };
      } else {
        boqDefaults = {
          boqItemId: targetBoq.id,
          materialItem: targetBoq.description,
          vendorId: resolvedVendorId,
          revision: 'R0',
          previousRevisionRef: '',
          gtpNumber: `GTP/${targetBoq.projectCode.split('-')[0]}/${targetBoq.itemNumber.replace('.', '')}/001`,
        };
      }
    }

    return {
      projectId: initialProjectId,
      ...boqDefaults,
      submissionDate: new Date().toISOString().split('T')[0],
      status: 'Submitted' as GtpStatus,
      remarks: '',
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Available BOQ items for selected project
  const projectBoqItems = boqItems.filter((b) => b.projectId === formData.projectId);

  const handleProjectChange = (projectId: string) => {
    const projBoqs = boqItems.filter((b) => b.projectId === projectId);
    const firstBoq = projBoqs[0];
    if (firstBoq) {
      const defaults = computeBoqDefaults(firstBoq.id);
      setFormData((prev) => ({
        ...prev,
        projectId,
        ...defaults,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        projectId,
        boqItemId: '',
        materialItem: '',
        revision: 'R0',
        previousRevisionRef: '',
        gtpNumber: '',
      }));
    }
  };

  const handleBoqChange = (boqItemId: string) => {
    const defaults = computeBoqDefaults(boqItemId, formData.vendorId);
    setFormData((prev) => ({
      ...prev,
      ...defaults,
    }));
  };

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.projectId) newErrors.projectId = 'Project selection is required';
    if (!formData.boqItemId) newErrors.boqItemId = 'BOQ Item selection is required';
    if (!formData.gtpNumber.trim()) newErrors.gtpNumber = 'GTP Document Number is required';
    if (!formData.vendorId) newErrors.vendorId = 'Vendor selection is required for GTP submission';
    if (!formData.revision.trim()) newErrors.revision = 'Revision number is required (e.g. R0, R1)';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const proj = projects.find((p) => p.id === formData.projectId);
      const boq = boqItems.find((b) => b.id === formData.boqItemId);
      const vendor = vendors.find((v) => v.id === formData.vendorId);

      const newRecord = createGtp({
        projectId: formData.projectId,
        projectCode: proj ? proj.code : 'PRJ-2024',
        projectName: proj ? proj.name : 'Unknown Project',
        boqItemId: formData.boqItemId,
        boqItemNumber: boq ? boq.itemNumber : '1.01',
        materialItem: formData.materialItem.trim(),
        vendorId: formData.vendorId,
        vendorName: vendor ? vendor.name : 'Unknown Vendor',
        gtpNumber: formData.gtpNumber.trim(),
        submissionDate: formData.submissionDate,
        revision: formData.revision.trim(),
        previousRevisionRef: formData.previousRevisionRef || undefined,
        revisionDate: new Date().toISOString().split('T')[0],
        status: formData.status,
        remarks: formData.remarks.trim(),
      });

      setSuccessMessage(`GTP ${newRecord.gtpNumber} (${newRecord.revision}) submitted successfully!`);
      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMessage('');
        onClose();
        if (onSuccess) onSuccess(newRecord.id);
      }, 700);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const errorMsg = err instanceof Error ? err.message : 'Failed to submit GTP';
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
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-editorial">Submit GTP / Technical Particulars</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  STAGE 05
                </span>
                <DemoTag label="ENGINEERING" />
              </div>
              <p className="text-xs text-slate-400">
                Guaranteed Technical Particulars &amp; drawings clearance for equipment approval.
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

          {/* Project & BOQ Item */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.projectId}
                onChange={(e) => handleProjectChange(e.target.value)}
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
                BOQ Equipment Item <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.boqItemId}
                onChange={(e) => handleBoqChange(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                {projectBoqItems.length === 0 ? (
                  <option value="">No BOQ items for this project</option>
                ) : (
                  projectBoqItems.map((b) => (
                    <option key={b.id} value={b.id}>
                      Item {b.itemNumber} — {b.description.substring(0, 35)}...
                    </option>
                  ))
                )}
              </select>
              {errors.boqItemId && <p className="text-[11px] text-rose-500 mt-1">{errors.boqItemId}</p>}
            </div>
          </div>

          {/* GTP Number & Vendor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GTP Document Ref # <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.gtpNumber}
                onChange={(e) => setFormData({ ...formData, gtpNumber: e.target.value })}
                placeholder="e.g. GTP/BGA/TRF/001"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
              {errors.gtpNumber && <p className="text-[11px] text-rose-500 mt-1">{errors.gtpNumber}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Manufacturing Vendor <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.vendorId}
                onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="">— Select Manufacturer —</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.category})
                  </option>
                ))}
              </select>
              {errors.vendorId && <p className="text-[11px] text-rose-500 mt-1">{errors.vendorId}</p>}
            </div>
          </div>

          {/* Revision Tracking (User Clarification 4) */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
              <History className="w-3.5 h-3.5 text-blue-600" />
              <span>Revision Versioning</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Revision Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.revision}
                  onChange={(e) => setFormData({ ...formData, revision: e.target.value })}
                  placeholder="e.g. R0, R1, R2"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-mono font-bold"
                />
                {errors.revision && <p className="text-[10px] text-rose-500 mt-0.5">{errors.revision}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Submission Date
                </label>
                <input
                  type="date"
                  value={formData.submissionDate}
                  onChange={(e) => setFormData({ ...formData, submissionDate: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Previous Revision
                </label>
                <input
                  type="text"
                  readOnly
                  value={formData.previousRevisionRef || 'Initial (None)'}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-md bg-slate-100 text-slate-500 font-mono text-[11px]"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">
              Stage 05 approval status is determined strictly from the latest revision.
            </p>
          </div>

          {/* Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GTP Approval Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as GtpStatus })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium"
              >
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted to Client</option>
                <option value="Under Review">Under Review (CE QC / TPIA)</option>
                <option value="Clarification Required">Clarification Required</option>
                <option value="Approved">Approved by Utility</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Material Description
              </label>
              <input
                type="text"
                value={formData.materialItem}
                onChange={(e) => setFormData({ ...formData, materialItem: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks &amp; Compliance Notes</label>
            <textarea
              rows={2}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="e.g. Type test reports submitted. Clearances as per REC specifications."
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
              <span>{isSubmitting ? 'Submitting...' : 'Register GTP'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
