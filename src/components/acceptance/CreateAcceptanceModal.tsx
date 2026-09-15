'use client';

import React, { useState } from 'react';
import { X, Plus, FileSignature, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { AcceptanceStatus, DocumentMetadata } from '@/types';
import { DemoTag } from '../common/Badge';

interface CreateAcceptanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  onSuccess?: (accId: string) => void;
}

export function CreateAcceptanceModal({
  isOpen,
  onClose,
  defaultProjectId,
  onSuccess,
}: CreateAcceptanceModalProps) {
  const { projects, loiLoas, createAcceptance, getLoiLoaByProjectId } = useProjects();

  const defaultProj = defaultProjectId ? projects.find((p) => p.id === defaultProjectId) : undefined;
  const defaultLoi = defaultProjectId ? getLoiLoaByProjectId(defaultProjectId) : undefined;

  const [formData, setFormData] = useState({
    projectId: defaultProj ? defaultProj.id : defaultProjectId || '',
    loiLoaId: defaultLoi ? defaultLoi.id : '',
    acceptanceRef: defaultProj
      ? `UK/HO/ACC/${new Date().getFullYear()}/${defaultProj.code.split('-').pop() || '101'}`
      : '',
    acceptanceDate: new Date().toISOString().split('T')[0],
    client: defaultProj ? defaultProj.client : '',
    status: 'Accepted' as AcceptanceStatus,
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
        client: proj.client,
        acceptanceRef: prev.acceptanceRef || `UK/HO/ACC/${new Date().getFullYear()}/${proj.code.split('-').pop() || '101'}`,
      }));
    } else {
      setFormData((prev) => ({ ...prev, projectId: projId, loiLoaId: '' }));
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.projectId) errs.projectId = 'Please select a parent Project';
    if (!formData.acceptanceRef.trim()) errs.acceptanceRef = 'Acceptance Reference number is required';
    if (!formData.acceptanceDate) errs.acceptanceDate = 'Acceptance Date is required';
    if (!formData.client.trim()) errs.client = 'Client is required';

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
          id: `DOC-ACC-${Date.now()}`,
          name: formData.docName.trim(),
          type: formData.docType,
          uploadedDate: new Date().toISOString().split('T')[0],
          remarks: 'Formal Acceptance Document metadata (Demo)',
        });
      }

      const created = createAcceptance({
        acceptanceRef: formData.acceptanceRef.trim().toUpperCase(),
        acceptanceDate: formData.acceptanceDate,
        projectId: selectedProj.id,
        projectCode: selectedProj.code,
        projectName: selectedProj.name,
        loiLoaId: selectedLoi ? selectedLoi.id : 'LOI-AUTO',
        loiLoaNumber: selectedLoi ? selectedLoi.loiNumber : 'LOA/PENDING',
        client: formData.client.trim(),
        remarks: formData.remarks.trim() || 'DEMO DATA: Contract acceptance documentation filed and acknowledged.',
        status: formData.status,
        documents: docs.length > 0 ? docs : undefined,
      });

      setSuccessMessage(`Acceptance "${created.acceptanceRef}" logged successfully!`);
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
      aria-labelledby="create-acceptance-title"
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
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="create-acceptance-title" className="text-base font-bold font-editorial tracking-tight text-white">
                  Stage 03 — Record Acceptance
                </h2>
                <DemoTag />
              </div>
              <p className="text-xs text-slate-300">
                Formal Contract Acceptance Submission &amp; Acknowledgement
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

          {/* Upstream LOI Reference */}
          <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200 space-y-1">
            <span className="font-bold text-blue-900 block text-[11px]">
              Upstream Stage 02 Connection: LOI / LOA
            </span>
            <p className="text-slate-600 text-[11px]">
              {formData.projectId ? (
                loiLoas.find((l) => l.projectId === formData.projectId) ? (
                  <>
                    Linked LOI/LOA:{' '}
                    <strong>
                      {loiLoas.find((l) => l.projectId === formData.projectId)?.loiNumber}
                    </strong>{' '}
                    (Status: {loiLoas.find((l) => l.projectId === formData.projectId)?.status})
                  </>
                ) : (
                  'No LOI/LOA found for this project yet. Can record acceptance preemptively.'
                )
              ) : (
                'Select a project to resolve linked award.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Acceptance Reference */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-800">
                Acceptance Reference <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. UK/HO/ACC/2024/104"
                value={formData.acceptanceRef}
                onChange={(e) => setFormData({ ...formData, acceptanceRef: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 uppercase"
              />
              {errors.acceptanceRef && <p className="text-[11px] text-rose-600">{errors.acceptanceRef}</p>}
            </div>

            {/* Date */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-800">
                Acceptance Submission Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.acceptanceDate}
                onChange={(e) => setFormData({ ...formData, acceptanceDate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              {errors.acceptanceDate && <p className="text-[11px] text-rose-600">{errors.acceptanceDate}</p>}
            </div>
          </div>

          {/* Client */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-800">
              Client Authority <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
            {errors.client && <p className="text-[11px] text-rose-600">{errors.client}</p>}
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-800">Acceptance Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as AcceptanceStatus })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted (Awaiting Client Counter-Stamp)</option>
              <option value="Accepted">Accepted (Officially Acknowledged)</option>
              <option value="Returned">Returned / Clarification Sought</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Document metadata */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-semibold text-slate-700 block">Formal Letter Record (Demo Metadata)</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="e.g. Formal_Acceptance_Letter_104.pdf"
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
              placeholder="Filing references, receipt numbers..."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Notice */}
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-[11px]">
              <strong>Phase 2 Stage 03:</strong> Formal acceptance marks conclusion of contract award formalities before CPG guarantee submission and agreement execution (Stage 04).
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
              <span>{isSubmitting ? 'Recording...' : 'Record Acceptance'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
