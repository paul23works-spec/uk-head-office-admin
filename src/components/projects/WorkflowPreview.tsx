'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Project, WorkflowStageDefinition, WorkflowStageStatus } from '@/types';
import { WORKFLOW_STAGES } from '@/lib/constants';
import { DemoTag } from '../common/Badge';

interface WorkflowPreviewProps {
  project: Project;
}

export function WorkflowPreview({ project }: WorkflowPreviewProps) {
  const getStageStatus = (stageId: string): WorkflowStageStatus => {
    const stageState = project.workflow?.find((w) => w.stageId === stageId);
    if (stageState) return stageState.status;

    // Fallback based on currentStageId
    const currentNum = parseInt(project.currentStageId, 10);
    const stageNum = parseInt(stageId, 10);
    if (stageNum < currentNum) return 'Completed';
    if (stageNum === currentNum) return 'In Progress';
    return 'Not Started';
  };

  const renderStageItem = (stage: WorkflowStageDefinition) => {
    const status = getStageStatus(stage.id);

    return (
      <div
        key={stage.id}
        className={`p-3.5 rounded-lg border transition-all ${
          status === 'Completed'
            ? 'bg-emerald-50/50 border-emerald-200'
            : status === 'In Progress'
            ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-400/30'
            : 'bg-slate-50/50 border-slate-200 opacity-70'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-[11px] font-bold ${
                status === 'Completed'
                  ? 'bg-emerald-600 text-white'
                  : status === 'In Progress'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {stage.id}
            </span>
            <h4
              className={`text-xs font-bold ${
                status === 'In Progress' ? 'text-blue-900' : 'text-slate-900'
              }`}
            >
              {stage.name}
            </h4>
          </div>

          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              status === 'Completed'
                ? 'bg-emerald-100 text-emerald-800'
                : status === 'In Progress'
                ? 'bg-blue-100 text-blue-800 animate-pulse'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {status}
          </span>
        </div>

        <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">
          {stage.description}
        </p>

        <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
          <span>Stage {stage.id} of 13</span>
          <span className="font-semibold text-slate-500">Preview Only</span>
        </div>
      </div>
    );
  };

  return (
    <div className="enterprise-card rounded-xl p-6 border border-slate-200 bg-white space-y-6">
      {/* Header & Scope Disclaimer */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 font-editorial">
                Project Workflow Preview
              </h3>
              <DemoTag />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Authoritative 13-stage turnkey project administration pipeline (01 Tender to 13 Final Bill)
            </p>
          </div>
          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 shrink-0">
            Current: {project.currentStageName}
          </span>
        </div>

        {/* Phase 1 Preview Notice */}
        <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2.5 text-xs text-slate-600">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong className="text-slate-800">Phase 1 Specification:</strong> Individual module execution engines are scheduled for subsequent phases. This view illustrates continuous stage progression and demo status.
          </span>
        </div>
      </div>

      {/* Continuous 13-Stage Grid (No A / B / C labels) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-slate-200">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-800 font-editorial">
            Project Workflow Stages
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
            13 Total Stages
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {WORKFLOW_STAGES.map(renderStageItem)}
        </div>
      </div>
    </div>
  );
}
