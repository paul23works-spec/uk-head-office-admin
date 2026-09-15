'use client';

import React, { useState } from 'react';
import { X, Plus, CheckCircle2 } from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { ProjectStatus } from '@/types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (projectId: string) => void;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateProjectModalProps) {
  const { createProject, projects } = useProjects();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    client: '',
    department: '',
    location: '',
    tenderRef: '',
    contractValue: '',
    startDate: new Date().toISOString().split('T')[0],
    expectedCompletion: '',
    projectManager: '',
    status: 'In Progress' as ProjectStatus,
    remarks: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Project Name is required';
    if (!formData.code.trim()) errs.code = 'Project Code is required';
    if (!formData.client.trim()) errs.client = 'Client name is required';
    if (!formData.department.trim()) errs.department = 'Department / Authority is required';
    if (!formData.location.trim()) errs.location = 'Location is required';
    if (!formData.tenderRef.trim()) errs.tenderRef = 'Tender Reference is required';
    if (!formData.contractValue.trim()) errs.contractValue = 'Contract Value is required (e.g. ₹ 25.00 Cr)';
    if (!formData.expectedCompletion.trim()) errs.expectedCompletion = 'Expected Completion Date is required';
    if (!formData.projectManager.trim()) errs.projectManager = 'Project Manager is required';

    // Duplicate check on project code
    const duplicate = projects.find(
      (p) => p.code.toLowerCase() === formData.code.trim().toLowerCase()
    );
    if (duplicate) {
      errs.code = 'A project with this project code already exists in demo records.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const created = createProject({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        client: formData.client.trim(),
        department: formData.department.trim(),
        location: formData.location.trim(),
        tenderRef: formData.tenderRef.trim(),
        contractValue: formData.contractValue.trim(),
        startDate: formData.startDate,
        expectedCompletion: formData.expectedCompletion,
        projectManager: formData.projectManager.trim(),
        status: formData.status,
        remarks: formData.remarks.trim() || 'Project registered in Phase 1 demo environment.',
      });

      setSuccessMessage(`Project "${created.code}" registered successfully!`);
      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMessage('');
        onClose();
        if (onSuccess) onSuccess(created.id);
      }, 1000);
    } catch {
      setIsSubmitting(false);
    }
  };

  const generateProjectCode = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    setFormData((prev) => ({
      ...prev,
      code: `UK-DEMO-${randomNum}`,
    }));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-project-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <h2
                id="create-project-title"
                className="text-lg font-bold text-slate-900 font-editorial"
              >
                Register New Project
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                DEMO ENTRY
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter official administrative parameters to initialize the project lifecycle
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="m-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Field 1: Project Name */}
            <div className="md:col-span-2 space-y-1">
              <label
                htmlFor="create-name"
                className="block font-semibold text-slate-700"
              >
                Project Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="create-name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. Kokrajhar 33kV Substation & Power Evacuation Line"
                className={`w-full px-3 py-2 rounded-lg border ${
                  errors.name ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600`}
              />
              {errors.name && (
                <p className="text-[11px] text-rose-600">{errors.name}</p>
              )}
            </div>

            {/* Field 2: Project Code */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="create-code"
                  className="block font-semibold text-slate-700"
                >
                  Project Code <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={generateProjectCode}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Auto-generate
                </button>
              </div>
              <input
                id="create-code"
                type="text"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                placeholder="e.g. UK-KKR-33KV"
                className={`w-full font-mono uppercase px-3 py-2 rounded-lg border ${
                  errors.code ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600`}
              />
              {errors.code && (
                <p className="text-[11px] text-rose-600">{errors.code}</p>
              )}
            </div>

            {/* Field 3: Client */}
            <div className="space-y-1">
              <label
                htmlFor="create-client"
                className="block font-semibold text-slate-700"
              >
                Client Organization <span className="text-rose-500">*</span>
              </label>
              <input
                id="create-client"
                type="text"
                value={formData.client}
                onChange={(e) =>
                  setFormData({ ...formData, client: e.target.value })
                }
                placeholder="e.g. Assam Power Distribution Co. Ltd. (APDCL)"
                className={`w-full px-3 py-2 rounded-lg border ${
                  errors.client ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600`}
              />
              {errors.client && (
                <p className="text-[11px] text-rose-600">{errors.client}</p>
              )}
            </div>

            {/* Field 4: Department / Authority */}
            <div className="space-y-1">
              <label
                htmlFor="create-dept"
                className="block font-semibold text-slate-700"
              >
                Department / Authority <span className="text-rose-500">*</span>
              </label>
              <input
                id="create-dept"
                type="text"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                placeholder="e.g. CGM (PP&D) / Transmission Circle"
                className={`w-full px-3 py-2 rounded-lg border ${
                  errors.department
                    ? 'border-rose-300 bg-rose-50/30'
                    : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600`}
              />
              {errors.department && (
                <p className="text-[11px] text-rose-600">{errors.department}</p>
              )}
            </div>

            {/* Field 5: Location */}
            <div className="space-y-1">
              <label
                htmlFor="create-loc"
                className="block font-semibold text-slate-700"
              >
                Location <span className="text-rose-500">*</span>
              </label>
              <input
                id="create-loc"
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="e.g. Kokrajhar, Bodoland Territorial Region"
                className={`w-full px-3 py-2 rounded-lg border ${
                  errors.location ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600`}
              />
              {errors.location && (
                <p className="text-[11px] text-rose-600">{errors.location}</p>
              )}
            </div>

            {/* Field 6: Tender Reference */}
            <div className="space-y-1">
              <label
                htmlFor="create-tender"
                className="block font-semibold text-slate-700"
              >
                Tender Reference <span className="text-rose-500">*</span>
              </label>
              <input
                id="create-tender"
                type="text"
                value={formData.tenderRef}
                onChange={(e) =>
                  setFormData({ ...formData, tenderRef: e.target.value })
                }
                placeholder="e.g. APDCL/CGM(PP&D)/T-55/2024"
                className={`w-full px-3 py-2 rounded-lg border ${
                  errors.tenderRef
                    ? 'border-rose-300 bg-rose-50/30'
                    : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600`}
              />
              {errors.tenderRef && (
                <p className="text-[11px] text-rose-600">{errors.tenderRef}</p>
              )}
            </div>

            {/* Field 7: Contract Value */}
            <div className="space-y-1">
              <label
                htmlFor="create-value"
                className="block font-semibold text-slate-700"
              >
                Contract Value <span className="text-rose-500">*</span>
              </label>
              <input
                id="create-value"
                type="text"
                value={formData.contractValue}
                onChange={(e) =>
                  setFormData({ ...formData, contractValue: e.target.value })
                }
                placeholder="e.g. ₹ 32.80 Cr"
                className={`w-full px-3 py-2 rounded-lg border ${
                  errors.contractValue
                    ? 'border-rose-300 bg-rose-50/30'
                    : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600`}
              />
              {errors.contractValue && (
                <p className="text-[11px] text-rose-600">{errors.contractValue}</p>
              )}
            </div>

            {/* Field 8: Start Date */}
            <div className="space-y-1">
              <label
                htmlFor="create-start-date"
                className="block font-semibold text-slate-700"
              >
                Start Date
              </label>
              <input
                id="create-start-date"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            {/* Field 9: Expected Completion */}
            <div className="space-y-1">
              <label
                htmlFor="create-completion"
                className="block font-semibold text-slate-700"
              >
                Expected Completion <span className="text-rose-500">*</span>
              </label>
              <input
                id="create-completion"
                type="date"
                value={formData.expectedCompletion}
                onChange={(e) =>
                  setFormData({ ...formData, expectedCompletion: e.target.value })
                }
                className={`w-full px-3 py-2 rounded-lg border ${
                  errors.expectedCompletion
                    ? 'border-rose-300 bg-rose-50/30'
                    : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600`}
              />
              {errors.expectedCompletion && (
                <p className="text-[11px] text-rose-600">
                  {errors.expectedCompletion}
                </p>
              )}
            </div>

            {/* Field 10: Project Manager */}
            <div className="space-y-1">
              <label
                htmlFor="create-pm"
                className="block font-semibold text-slate-700"
              >
                Project Manager <span className="text-rose-500">*</span>
              </label>
              <input
                id="create-pm"
                type="text"
                value={formData.projectManager}
                onChange={(e) =>
                  setFormData({ ...formData, projectManager: e.target.value })
                }
                placeholder="e.g. Er. Sanjib Baruah"
                className={`w-full px-3 py-2 rounded-lg border ${
                  errors.projectManager
                    ? 'border-rose-300 bg-rose-50/30'
                    : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600`}
              />
              {errors.projectManager && (
                <p className="text-[11px] text-rose-600">{errors.projectManager}</p>
              )}
            </div>

            {/* Field 11: Status */}
            <div className="space-y-1">
              <label
                htmlFor="create-status"
                className="block font-semibold text-slate-700"
              >
                Initial Status
              </label>
              <select
                id="create-status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as ProjectStatus,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="In Progress">In Progress</option>
                <option value="Not Started">Not Started</option>
                <option value="Attention Required">Attention Required</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Field 12: Remarks */}
            <div className="md:col-span-2 space-y-1">
              <label
                htmlFor="create-remarks"
                className="block font-semibold text-slate-700"
              >
                Remarks &amp; Scope Summary
              </label>
              <textarea
                id="create-remarks"
                rows={3}
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                placeholder="Brief administrative description, scope details, or package specifics..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          {/* Dialog Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering...' : 'Save & Initialize Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
