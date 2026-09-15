'use client';

import React, { useState } from 'react';
import { X, Plus, FileCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { LoiLoaStatus, DocumentMetadata } from '@/types';
import { DemoTag } from '../common/Badge';

interface CreateLoiLoaModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  onSuccess?: (loiId: string) => void;
}

export function CreateLoiLoaModal({
  isOpen,
  onClose,
  defaultProjectId,
  onSuccess,
}: CreateLoiLoaModalProps) {
  const { projects, tenders, createLoiLoa, getTenderByProjectId } = useProjects();

  const defaultProj = defaultProjectId ? projects.find((p) => p.id === defaultProjectId) : undefined;
  const defaultTnd = defaultProjectId ? getTenderByProjectId(defaultProjectId) : undefined;

  const [formData, setFormData] = useState({
    projectId: defaultProj ? defaultProj.id : defaultProjectId || '',
    tenderId: defaultTnd ? defaultTnd.id : '',
    loiNumber: '',
    date: new Date().toISOString().split('T')[0],
    client: defaultProj ? defaultProj.client : '',
    contractValue: defaultProj ? defaultProj.contractValue : '',
    referenceDetails: defaultTnd ? `Award against Tender NIT ref: ${defaultTnd.tenderNumber}` : '',
    status: 'Received' as LoiLoaStatus,
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
    const tnd = getTenderByProjectId(projId);

    if (proj) {
      setFormData((prev) => ({
        ...prev,
        projectId: proj.id,
        tenderId: tnd ? tnd.id : '',
        client: proj.client,
        contractValue: prev.contractValue || proj.contractValue,
        referenceDetails: tnd ? `Issued against Tender ${tnd.tenderNumber}` : prev.referenceDetails,
      }));
    } else {
      setFormData((prev) => ({ ...prev, projectId: projId, tenderId: '' }));
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.projectId) errs.projectId = 'Please select a parent Project';
    if (!formData.loiNumber.trim()) errs.loiNumber = 'LOI / LOA Number is required';
    if (!formData.date) errs.date = 'Issuance Date is required';
    if (!formData.client.trim()) errs.client = 'Client is required';
    if (!formData.contractValue.trim()) errs.contractValue = 'Contract Value is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const selectedProj = projects.find((p) => p.id === formData.projectId)!;
      const selectedTender = tenders.find((t) => t.id === formData.tenderId) || getTenderByProjectId(selectedProj.id);

      const docs: DocumentMetadata[] = [];
      if (formData.docName.trim()) {
        docs.push({
          id: `DOC-LOI-${Date.now()}`,
          name: formData.docName.trim(),
          type: formData.docType,
          uploadedDate: new Date().toISOString().split('T')[0],
          remarks: 'Recorded LOI document metadata (Phase 2 demo)',
        });
      }

      const created = createLoiLoa({
        loiNumber: formData.loiNumber.trim().toUpperCase(),
        date: formData.date,
        projectId: selectedProj.id,
        projectCode: selectedProj.code,
        projectName: selectedProj.name,
        tenderId: selectedTender ? selectedTender.id : 'TND-AUTO',
        tenderNumber: selectedTender ? selectedTender.tenderNumber : selectedProj.tenderRef,
        client: formData.client.trim(),
        contractValue: formData.contractValue.trim(),
        referenceDetails: formData.referenceDetails.trim() || `Official award letter issued by ${formData.client.trim()}.`,
        remarks: formData.remarks.trim() || 'DEMO DATA: Letter of Award registered and filed.',
        status: formData.status,
        documents: docs.length > 0 ? docs : undefined,
      });

      setSuccessMessage(`LOI / LOA "${created.loiNumber}" registered successfully!`);
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
      aria-labelledby="create-loi-title"
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
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="create-loi-title" className="text-base font-bold font-editorial tracking-tight text-white">
                  Stage 02 — Register LOI / LOA
                </h2>
                <DemoTag />
              </div>
              <p className="text-xs text-slate-300">
                Letter of Intent / Letter of Award Administrative Processing
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
          {/* Linked Parent Project */}
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
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
            {errors.projectId && <p className="text-[11px] text-rose-600">{errors.projectId}</p>}
          </div>

          {/* Related Upstream Tender */}
          <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200 space-y-1">
            <span className="font-bold text-blue-900 block text-[11px]">
              Upstream Stage 01 Connection: Tender
            </span>
            <p className="text-slate-600 text-[11px]">
              {formData.projectId ? (
                tenders.find((t) => t.projectId === formData.projectId) ? (
                  <>
                    Linked Tender:{' '}
                    <strong>
                      {tenders.find((t) => t.projectId === formData.projectId)?.tenderNumber}
                    </strong>{' '}
                    (Status: {tenders.find((t) => t.projectId === formData.projectId)?.status})
                  </>
                ) : (
                  'No explicit tender record registered for this project yet. Will associate automatically.'
                )
              ) : (
                'Select a project above to resolve the related tender.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* LOI / LOA Number */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-800">
                LOI / LOA Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. LOA/APDCL/CGM(PP&D)/2024/119"
                value={formData.loiNumber}
                onChange={(e) => setFormData({ ...formData, loiNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 uppercase"
              />
              {errors.loiNumber && <p className="text-[11px] text-rose-600">{errors.loiNumber}</p>}
            </div>

            {/* Issuance Date */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-800">
                Date of Issuance <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              {errors.date && <p className="text-[11px] text-rose-600">{errors.date}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Client */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-800">
                Client Organization <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              {errors.client && <p className="text-[11px] text-rose-600">{errors.client}</p>}
            </div>

            {/* Contract Value */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-800">
                Awarded Contract Value <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. ₹ 28.40 Cr"
                value={formData.contractValue}
                onChange={(e) => setFormData({ ...formData, contractValue: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              {errors.contractValue && <p className="text-[11px] text-rose-600">{errors.contractValue}</p>}
            </div>
          </div>

          {/* Reference Details */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-800">Reference Details</label>
            <input
              type="text"
              placeholder="e.g. Issued by APDCL Secretariat Bijulee Bhawan under notification..."
              value={formData.referenceDetails}
              onChange={(e) => setFormData({ ...formData, referenceDetails: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-800">LOI / LOA Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as LoiLoaStatus })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="Draft">Draft</option>
              <option value="Received">Received</option>
              <option value="Under Review">Under Review</option>
              <option value="Accepted">Accepted (Formal Acceptance Pending / Done)</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Document Record (Demo metadata) */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-semibold text-slate-700 block">LOA Document Record (Demo Metadata)</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="e.g. Signed_Letter_of_Award_APDCL_889.pdf"
                  value={formData.docName}
                  onChange={(e) => setFormData({ ...formData, docName: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white"
                />
              </div>
              <div>
                <select
                  value={formData.docType}
                  onChange={(e) => setFormData({ ...formData, docType: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white"
                >
                  <option value="PDF">PDF Document</option>
                  <option value="DOCX">Word Document</option>
                </select>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-800">Administrative Remarks</label>
            <textarea
              rows={2}
              placeholder="Commercial or administrative conditions..."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Notice */}
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-[11px]">
              <strong>Connected Workflow:</strong> Recording this LOI/LOA updates Stage 02 for the linked project and enables downstream Acceptance (Stage 03) and CPG / Agreement (Stage 04).
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
              <span>{isSubmitting ? 'Registering...' : 'Register LOI / LOA Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
