'use client';

import React, { useState } from 'react';
import { X, Plus, ScrollText, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { AgreementStatus, DocumentMetadata } from '@/types';
import { DemoTag } from '../common/Badge';

interface CreateAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  onSuccess?: (agreementId: string) => void;
}

export function CreateAgreementModal({
  isOpen,
  onClose,
  defaultProjectId,
  onSuccess,
}: CreateAgreementModalProps) {
  const { projects, loiLoas, createAgreement, getLoiLoaByProjectId } = useProjects();

  const defaultProj = defaultProjectId ? projects.find((p) => p.id === defaultProjectId) : undefined;
  const defaultLoi = defaultProjectId ? getLoiLoaByProjectId(defaultProjectId) : undefined;
  const defaultPNum = defaultProj ? defaultProj.code.split('-').pop() || '101' : '101';

  const [formData, setFormData] = useState({
    projectId: defaultProj ? defaultProj.id : defaultProjectId || '',
    loiLoaId: defaultLoi ? defaultLoi.id : '',
    agreementRef: defaultProj
      ? `AGR/${defaultProj.client.split(' ')[0] || 'CL'}/${new Date().getFullYear()}/${defaultPNum}`
      : '',
    agreementDate: new Date().toISOString().split('T')[0],
    status: 'Executed' as AgreementStatus,
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
    const loi = getLoiLoaByProjectId(projId);

    if (proj) {
      const pNum = proj.code.split('-').pop() || '101';
      setFormData((prev) => ({
        ...prev,
        projectId: proj.id,
        loiLoaId: loi ? loi.id : '',
        agreementRef: prev.agreementRef || `AGR/${proj.client.split(' ')[0] || 'CL'}/${new Date().getFullYear()}/${pNum}`,
      }));
    } else {
      setFormData((prev) => ({ ...prev, projectId: projId, loiLoaId: '' }));
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.projectId) errs.projectId = 'Please select a parent Project';
    if (!formData.agreementRef.trim()) errs.agreementRef = 'Agreement Reference is required';
    if (!formData.agreementDate) errs.agreementDate = 'Agreement Date is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const selectedProj = projects.find((p) => p.id === formData.projectId)!;
      const selectedLoi = loiLoas.find((l) => l.id === formData.loiLoaId) || getLoiLoaByProjectId(selectedProj.id);

      const docs: DocumentMetadata[] = [];
      if (formData.docName.trim()) {
        docs.push({
          id: `DOC-AGR-${Date.now()}`,
          name: formData.docName.trim(),
          type: formData.docType,
          uploadedDate: new Date().toISOString().split('T')[0],
          fileSize: '3.4 MB',
        });
      }

      const newAgr = createAgreement({
        agreementRef: formData.agreementRef.trim(),
        agreementDate: formData.agreementDate,
        projectId: selectedProj.id,
        projectCode: selectedProj.code,
        projectName: selectedProj.name,
        loiLoaId: selectedLoi ? selectedLoi.id : '',
        loiLoaNumber: selectedLoi ? selectedLoi.loiNumber : 'Direct Contract',
        status: formData.status,
        remarks: formData.remarks.trim() || 'Contract Agreement executed with client.',
        documents: docs,
      });

      setSuccessMessage(`Contract Agreement ${newAgr.agreementRef} successfully registered.`);
      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMessage('');
        onClose();
        if (onSuccess) onSuccess(newAgr.id);
      }, 1000);
    } catch {
      setIsSubmitting(false);
      setErrors({ form: 'Failed to record Agreement. Please verify inputs.' });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-agr-title"
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
            <div className="p-2 rounded-lg bg-teal-600/30 text-teal-300 border border-teal-400/30">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="create-agr-title" className="text-base font-bold font-editorial tracking-tight text-white">
                  Register Contract Agreement
                </h2>
                <DemoTag />
              </div>
              <p className="text-xs text-slate-300">
                Stage 04: Contract Agreement Execution
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

        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Error */}
        {errors.form && (
          <div className="p-4 bg-red-50 border-b border-red-200 text-red-800 text-sm font-medium flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Project & LOI Linking */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Project <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.projectId}
                onChange={(e) => handleProjectSelect(e.target.value)}
                disabled={Boolean(defaultProjectId)}
                className={`w-full text-xs px-3 py-2 border rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors ${
                  errors.projectId ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                }`}
              >
                <option value="">-- Select Project --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
              {errors.projectId && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.projectId}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Associated LOI / LOA
              </label>
              <select
                value={formData.loiLoaId}
                onChange={(e) => setFormData((prev) => ({ ...prev, loiLoaId: e.target.value }))}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
              >
                <option value="">-- Direct Award / None --</option>
                {loiLoas
                  .filter((l) => !formData.projectId || l.projectId === formData.projectId)
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.loiNumber} ({l.status} - {l.projectCode})
                    </option>
                  ))}
              </select>
              <p className="mt-1 text-[10px] text-slate-400">
                Auto-links to Stage 02 contract reference if available
              </p>
            </div>
          </div>

          {/* Agreement Ref & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Agreement Reference Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. AGR/APDCL/2024/019"
                value={formData.agreementRef}
                onChange={(e) => setFormData((prev) => ({ ...prev, agreementRef: e.target.value }))}
                className={`w-full text-xs px-3 py-2 border rounded-lg bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors ${
                  errors.agreementRef ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                }`}
              />
              {errors.agreementRef && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.agreementRef}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Agreement Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.agreementDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, agreementDate: e.target.value }))}
                className={`w-full text-xs px-3 py-2 border rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors ${
                  errors.agreementDate ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                }`}
              />
              {errors.agreementDate && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.agreementDate}</p>
              )}
            </div>
          </div>

          {/* Status & Contract Phase */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Agreement Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, status: e.target.value as AgreementStatus }))
                }
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
              >
                <option value="Draft">Draft</option>
                <option value="Under Preparation">Under Preparation</option>
                <option value="Executed">Executed</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Supporting Agreement File (Demo)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Executed_Contract_Agreement_Signed.pdf"
                  value={formData.docName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, docName: e.target.value }))}
                  className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
                />
                <select
                  value={formData.docType}
                  onChange={(e) => setFormData((prev) => ({ ...prev, docType: e.target.value }))}
                  className="w-24 text-xs px-2 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
                >
                  <option value="PDF">PDF</option>
                  <option value="DOCX">DOCX</option>
                  <option value="SCAN">SCAN</option>
                </select>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Executive Remarks & Terms Note
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Bilateral agreement executed on non-judicial stamp paper with full GCC/SCC terms."
              value={formData.remarks}
              onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white text-xs font-semibold rounded-lg shadow-sm shadow-teal-500/20 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering...' : 'Register Agreement'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
