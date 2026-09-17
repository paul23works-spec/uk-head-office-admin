'use client';

import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { ProjectHealthSummary } from '@/types';

interface ProjectHealthProps {
  health: ProjectHealthSummary;
}

export function ProjectHealth({ health }: ProjectHealthProps) {
  const getHealthBadge = (status: ProjectHealthSummary['healthStatus']) => {
    switch (status) {
      case 'Completed':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Project Completed & Financially Closed
            </span>
          </div>
        );
      case 'On Track':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Workflow On Track
            </span>
          </div>
        );
      case 'Attention Needed':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Attention Required ({health.exceptionsCount} items)
            </span>
          </div>
        );
      case 'Critical Attention':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Action Required Immediately
            </span>
          </div>
        );
    }
  };

  return (
    <div className="enterprise-card rounded-xl p-5 sm:p-6 border border-slate-200 bg-white space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              OPERATIONAL HEALTH
            </span>
            <h3 className="text-base font-bold text-slate-900 font-editorial">
              Deterministic Progress & State
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Formula: Stage Progress = (Completed Stages / 13) × 100% | Billing Progress = (Approved Billing / Contract Value) × 100%
          </p>
        </div>

        {getHealthBadge(health.healthStatus)}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Workflow Progress */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">13-Stage Completion</span>
            <span className="font-bold text-slate-900 font-mono">
              {health.completedStagesCount} / 13 Stages
            </span>
          </div>
          <div className="text-xl font-bold font-editorial text-slate-900">
            {health.workflowProgressPercent}%
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${health.workflowProgressPercent}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500">
            {13 - health.completedStagesCount} stages remaining or in progress
          </div>
        </div>

        {/* Group A Admin Foundation */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Group A (01–04)</span>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded">
              ADMIN A
            </span>
          </div>
          <div className="text-xl font-bold font-editorial text-slate-900">
            {health.adminAProgress}%
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${health.adminAProgress}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500">
            Tender, LOI/LOA, Acceptance, CPG + Agreement
          </div>
        </div>

        {/* Group B Procurement & Inspection */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Group B (05–09)</span>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/60 px-1.5 py-0.5 rounded">
              ADMIN B
            </span>
          </div>
          <div className="text-xl font-bold font-editorial text-slate-900">
            {health.adminBProgress}%
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${health.adminBProgress}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500">
            GTP, PO, Inspection Call, Order, JIR Report
          </div>
        </div>

        {/* Group C Dispatch & Billing */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Group C (10–13)</span>
            <span className="text-[10px] font-bold text-teal-700 bg-teal-100/60 px-1.5 py-0.5 rounded">
              ADMIN C
            </span>
          </div>
          <div className="text-xl font-bold font-editorial text-slate-900">
            {health.adminCProgress}%
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-teal-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${health.adminCProgress}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500">
            DI Clearance, MICC, Progressive & Final Bill
          </div>
        </div>
      </div>
    </div>
  );
}
