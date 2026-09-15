'use client';

import React, { useState } from 'react';
import { X, Plus, ShieldCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { CpgStatus, DocumentMetadata } from '@/types';
import { DemoTag } from '../common/Badge';

interface CreateCpgModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  onSuccess?: (cpgId: string) => void;
}

export function CreateCpgModal({
  isOpen,
  onClose,
  defaultProjectId,
  onSuccess,
}: CreateCpgModalProps) {
  const { projects, loiLoas, createCpg, getLoiLoaByProjectId } = useProjects();

  const defaultProj = defaultProjectId ? projects.find((p) => p.id === defaultProjectId) : undefined;
  const defaultLoi = defaultProjectId ? getLoiLoaByProjectId(defaultProjectId) : undefined;

  const [formData, setFormData] = useState({
    projectId: defaultProj ? defaultProj.id : defaultProjectId || '',
    loiLoaId: defaultLoi ? defaultLoi.id : '',
    cpgRef: defaultProj
      ? `BG/SBI/${new Date().getFullYear()}/${defaultProj.code.split('-').pop() || '701'}`
      : '',
    cpgDate: new Date().toISOString().split('T')[0],
    cpgAmount: defaultProj ? defaultProj.contractValue : '',
    submissionDate: new Date().toISOString().split('T')[0],
    validityDate: '',
    bankName: 'State Bank of India',
    status: 'Valid' as CpgStatus,
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
      setFormData((prev) => ({
        ...prev,
        projectId: proj.id,
        loiLoaId: loi ? loi.id : '',
        cpgRef: prev.cpgRef || `BG/SBI/${new Date().getFullYear()}/${proj.code.split('-').pop() || '701'}`,
      }));
    } else {
      setFormData((prev) => ({ ...prev, projectId: projId, loiLoaId: '' }));
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.projectId) errs.projectId = 'Please select a parent Project';
    if (!formData.cpgRef.trim()) errs.cpgRef = 'CPG Bank Guarantee Reference is required';
    if (!formData.cpgAmount.trim()) errs.cpgAmount = 'CPG Amount is required (e.g. ₹ 2.84 Cr)';
    if (!formData.validityDate) errs.validityDate = 'Validity Date is required';
    if (!formData.bankName.trim()) errs.bankName = 'Issuing Bank Name is required';

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
          id: `DOC-CPG-${Date.now()}`,
          name: formData.docName.trim(),
          type: formData.docType,
          uploadedDate: new Date().toISOString().split('T')[0],
          remarks: 'Bank Guarantee Confirmation slip (Demo)',
        });
      }

      const created = createCpg({
        cpgRef: formData.cpgRef.trim().toUpperCase(),
        cpgDate: formData.cpgDate,
        cpgAmount: formData.cpgAmount.trim(),
        submissionDate: formData.submissionDate,
        validityDate: formData.validityDate,
        projectId: selectedProj.id,
        projectCode: selectedProj.code,
        projectName: selectedProj.name,
        loiLoaId: selectedLoi ? selectedLoi.id : 'LOI-AUTO',
        loiLoaNumber: selectedLoi ? selectedLoi.loiNumber : 'LOA/RECORDED',
        bankName: formData.bankName.trim(),
        status: formData.status,
        remarks: formData.remarks.trim() || 'DEMO DATA: Contract Performance Guarantee submitted and validated.',
        documents: docs.length > 0 ? docs : undefined,
      });

      setSuccessMessage(`CPG "${created.cpgRef}" registered successfully!`);
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
      aria-labelledby="create-cpg-title"
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
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="create-cpg-title" className="text-base font-bold font-editorial tracking-tight text-white">
                  Stage 04A — Register CPG (Bank Guarantee)
                </h2>
                <DemoTag />
              </div>
              <p className="text-xs text-slate-300">
                Contract Performance Guarantee Submission &amp; SFMS Verification
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
          {/* Parent Project */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CPG Ref */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-800">
                CPG / Bank Guarantee Reference <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. BG/SBI/2024/771"
                value={formData.cpgRef}
                onChange={(e) => setFormData({ ...formData, cpgRef: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 uppercase"
              />
              {errors.cpgRef && <p className="text-[11px] text-rose-600">{errors.cpgRef}</p>}
            </div>

            {/* Issuing Bank */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-800">
                Issuing Bank Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. State Bank of India, Commercial Branch"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              {errors.bankName && <p className="text-[11px] text-rose-600">{errors.bankName}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CPG Amount */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-800">
                Guarantee Amount (10%) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. ₹ 2.84 Cr"
                value={formData.cpgAmount}
                onChange={(e) => setFormData({ ...formData, cpgAmount: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              {errors.cpgAmount && <p className="text-[11px] text-rose-600">{errors.cpgAmount}</p>}
            </div>

            {/* CPG Date */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-800">
                Guarantee Issue Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.cpgDate}
                onChange={(e) => setFormData({ ...formData, cpgDate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Submission Date */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-800">Client Submission Date</label>
              <input
                type="date"
                value={formData.submissionDate}
                onChange={(e) => setFormData({ ...formData, submissionDate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            {/* Validity Date */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-800">
                Validity Expiry Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.validityDate}
                onChange={(e) => setFormData({ ...formData, validityDate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              {errors.validityDate && <p className="text-[11px] text-rose-600">{errors.validityDate}</p>}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-800">CPG Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as CpgStatus })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="Valid">Valid (Confirmed via SFMS)</option>
              <option value="Submitted">Submitted (Under Client Verification)</option>
              <option value="Under Verification">Under Verification with Issuing Bank</option>
              <option value="Pending">Pending Bank Issuance</option>
              <option value="Expired">Expired</option>
              <option value="Released">Released (Upon Project Finalization)</option>
            </select>
          </div>

          {/* Document metadata */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-semibold text-slate-700 block">Bank Guarantee Document Record (Demo Metadata)</span>
            <input
              type="text"
              placeholder="e.g. CPG_Bank_Guarantee_Bond_SBI_771.pdf"
              value={formData.docName}
              onChange={(e) => setFormData({ ...formData, docName: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white"
            />
          </div>

          {/* Remarks */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-800">Administrative Remarks</label>
            <textarea
              rows={2}
              placeholder="Claim period, SFMS confirmation details, branch ref..."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Notice */}
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-[11px]">
              <strong>Stage 04 Integrity:</strong> CPG forms the financial guarantee component of Stage 04. Once both CPG and Contract Agreement are verified, Stage 04 transitions to Completed.
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
              <span>{isSubmitting ? 'Registering...' : 'Register CPG'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
