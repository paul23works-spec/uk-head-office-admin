'use client';

import React, { useState } from 'react';
import { X, Plus, FileSpreadsheet, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { TenderStatus, TenderL1Status, DocumentMetadata } from '@/types';
import { DemoTag } from '../common/Badge';

interface CreateTenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  onSuccess?: (tenderId: string) => void;
}

export function CreateTenderModal({
  isOpen,
  onClose,
  defaultProjectId,
  onSuccess,
}: CreateTenderModalProps) {
  const { projects, createTender } = useProjects();

  const selectedDefaultProject = defaultProjectId
    ? projects.find((p) => p.id === defaultProjectId)
    : undefined;

  const [formData, setFormData] = useState({
    projectId: selectedDefaultProject ? selectedDefaultProject.id : '',
    tenderNumber: '',
    tenderDate: new Date().toISOString().split('T')[0],
    tenderRef: selectedDefaultProject ? selectedDefaultProject.tenderRef : '',
    client: selectedDefaultProject ? selectedDefaultProject.client : '',
    department: selectedDefaultProject ? selectedDefaultProject.department : '',
    location: selectedDefaultProject ? selectedDefaultProject.location : '',
    tenderValue: selectedDefaultProject ? selectedDefaultProject.contractValue : '',
    estimatedValue: '',
    openingDate: new Date().toISOString().split('T')[0],
    closingDate: '',
    status: 'Published' as TenderStatus,
    l1Status: 'Not Determined' as TenderL1Status,
    remarks: '',
    docName: '',
    docType: 'PDF',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleProjectSelect = (projId: string) => {
    const proj = projects.find((p) => p.id === projId);
    if (proj) {
      setFormData((prev) => ({
        ...prev,
        projectId: proj.id,
        tenderRef: prev.tenderRef || proj.tenderRef,
        client: proj.client,
        department: proj.department,
        location: proj.location,
        tenderValue: prev.tenderValue || proj.contractValue,
      }));
    } else {
      setFormData((prev) => ({ ...prev, projectId: projId }));
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.projectId) errs.projectId = 'Please select a parent Project';
    if (!formData.tenderNumber.trim()) errs.tenderNumber = 'Tender Number / NIT Number is required';
    if (!formData.tenderRef.trim()) errs.tenderRef = 'Tender Reference is required';
    if (!formData.client.trim()) errs.client = 'Client name is required';
    if (!formData.department.trim()) errs.department = 'Department / Authority is required';
    if (!formData.location.trim()) errs.location = 'Location is required';
    if (!formData.tenderValue.trim()) errs.tenderValue = 'Tender Value is required (e.g. ₹ 28.40 Cr)';
    if (!formData.closingDate) errs.closingDate = 'Closing Date is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const selectedProj = projects.find((p) => p.id === formData.projectId)!;

      const docs: DocumentMetadata[] = [];
      if (formData.docName.trim()) {
        docs.push({
          id: `DOC-TND-${Date.now()}`,
          name: formData.docName.trim(),
          type: formData.docType,
          uploadedDate: new Date().toISOString().split('T')[0],
          remarks: 'Recorded document metadata (Phase 2 demo metadata record)',
        });
      }

      const created = createTender({
        tenderNumber: formData.tenderNumber.trim().toUpperCase(),
        tenderDate: formData.tenderDate,
        tenderRef: formData.tenderRef.trim(),
        projectId: selectedProj.id,
        projectCode: selectedProj.code,
        projectName: selectedProj.name,
        client: formData.client.trim(),
        department: formData.department.trim(),
        location: formData.location.trim(),
        tenderValue: formData.tenderValue.trim(),
        estimatedValue: formData.estimatedValue.trim() || undefined,
        openingDate: formData.openingDate,
        closingDate: formData.closingDate,
        status: formData.status,
        l1Status: formData.l1Status,
        remarks: formData.remarks.trim() || 'DEMO DATA: Tender record initiated in Phase 2.',
        documents: docs.length > 0 ? docs : undefined,
      });

      setSuccessMessage(`Tender "${created.tenderNumber}" registered successfully!`);
      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMessage('');
        onClose();
        if (onSuccess) onSuccess(created.id);
      }, 900);
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-tender-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#0A192F] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/30 text-blue-300 border border-blue-400/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="create-tender-title" className="text-base font-bold font-editorial tracking-tight text-white">
                  Stage 01 — Register Tender
                </h2>
                <DemoTag />
              </div>
              <p className="text-xs text-slate-300">
                Turnkey Tender Documentation &amp; Bid Identification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border-b border-emerald-200 flex items-center gap-2 text-emerald-800 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto text-xs">
          {/* Linked Project Selection */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-800">
              Parent Project <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.projectId}
              onChange={(e) => handleProjectSelect(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="">-- Select Registered Project --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name} ({p.client})
                </option>
              ))}
            </select>
            {errors.projectId && <p className="text-[11px] text-rose-600">{errors.projectId}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tender Number / NIT */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-800">
                Tender / NIT Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. NIT/APDCL/CGM(PP&D)/2024/09"
                value={formData.tenderNumber}
                onChange={(e) => setFormData({ ...formData, tenderNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 uppercase"
              />
              {errors.tenderNumber && <p className="text-[11px] text-rose-600">{errors.tenderNumber}</p>}
            </div>

            {/* Tender Date */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-800">
                Tender Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.tenderDate}
                onChange={(e) => setFormData({ ...formData, tenderDate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          {/* Tender Reference */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-800">
              Tender Reference / Subject <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Turnkey Construction of 33/11kV Substation including transformers"
              value={formData.tenderRef}
              onChange={(e) => setFormData({ ...formData, tenderRef: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
            {errors.tenderRef && <p className="text-[11px] text-rose-600">{errors.tenderRef}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Client */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-800">
                Client <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              {errors.client && <p className="text-[11px] text-rose-600">{errors.client}</p>}
            </div>

            {/* Department */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-800">
                Department / Wing <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              {errors.department && <p className="text-[11px] text-rose-600">{errors.department}</p>}
            </div>

            {/* Location */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-800">
                Location <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              {errors.location && <p className="text-[11px] text-rose-600">{errors.location}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tender Value */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-800">
                Tender Value <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. ₹ 28.40 Cr"
                value={formData.tenderValue}
                onChange={(e) => setFormData({ ...formData, tenderValue: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              {errors.tenderValue && <p className="text-[11px] text-rose-600">{errors.tenderValue}</p>}
            </div>

            {/* Estimated Value */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-800">
                Estimated / Budgeted Value (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. ₹ 29.00 Cr"
                value={formData.estimatedValue}
                onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Opening Date */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-800">
                Tender Opening Date
              </label>
              <input
                type="date"
                value={formData.openingDate}
                onChange={(e) => setFormData({ ...formData, openingDate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            {/* Closing Date */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-800">
                Tender Closing / Submission Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.closingDate}
                onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              {errors.closingDate && <p className="text-[11px] text-rose-600">{errors.closingDate}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tender Status */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-800">
                Tender Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TenderStatus })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Evaluation">Under Evaluation</option>
                <option value="L1">L1</option>
                <option value="Awarded">Awarded</option>
                <option value="Not Awarded">Not Awarded</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* L1 Status */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-800">
                L1 Status
              </label>
              <select
                value={formData.l1Status}
                onChange={(e) => setFormData({ ...formData, l1Status: e.target.value as TenderL1Status })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="Not Determined">Not Determined</option>
                <option value="L1">L1 (Lowest Bidder)</option>
                <option value="Not L1">Not L1</option>
              </select>
            </div>
          </div>

          {/* Document Metadata Placeholder */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Document Record (Demo Metadata)</span>
              <span className="text-[10px] text-slate-400">File upload engine reserved for future</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="e.g. NIT_Tender_Notice_APDCL.pdf"
                  value={formData.docName}
                  onChange={(e) => setFormData({ ...formData, docName: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white text-slate-700"
                />
              </div>
              <div>
                <select
                  value={formData.docType}
                  onChange={(e) => setFormData({ ...formData, docType: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white text-slate-700"
                >
                  <option value="PDF">PDF Document</option>
                  <option value="DWG">DWG Drawing</option>
                  <option value="DOCX">Word Document</option>
                  <option value="XLSX">Spreadsheet</option>
                </select>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-800">Administrative Remarks</label>
            <textarea
              rows={2}
              placeholder="Commercial or qualification remarks..."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Scope Notice */}
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-[11px]">
              <strong>Phase 2 Administrative Scope:</strong> Creating this tender record links directly to the project and initializes Stage 01 of the workflow. Data persists locally.
            </p>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering...' : 'Register Tender Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
