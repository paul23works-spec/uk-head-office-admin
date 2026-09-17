'use client';

import React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lock,
  Circle,
  ChevronRight,
} from 'lucide-react';
import { ProjectStageStatusInfo, ProjectControlStageStatus } from '@/types';

interface ProjectStageTimelineProps {
  stages: ProjectStageStatusInfo[];
  currentStageNumber: string;
}

export function ProjectStageTimeline({
  stages,
  currentStageNumber,
}: ProjectStageTimelineProps) {
  const getStatusIcon = (status: ProjectControlStageStatus, isCurrent: boolean) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'In Progress':
        return <Clock className="w-4 h-4 text-blue-600 animate-pulse" />;
      case 'Attention Required':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'Locked':
        return <Lock className="w-3.5 h-3.5 text-slate-400" />;
      case 'Not Started':
      default:
        return isCurrent ? (
          <Clock className="w-4 h-4 text-blue-600" />
        ) : (
          <Circle className="w-3.5 h-3.5 text-slate-300" />
        );
    }
  };

  const getStatusBadge = (status: ProjectControlStageStatus) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Completed
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
            In Progress
          </span>
        );
      case 'Attention Required':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            Attention
          </span>
        );
      case 'Locked':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
            <Lock className="w-2.5 h-2.5" />
            Locked
          </span>
        );
      case 'Not Started':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            Not Started
          </span>
        );
    }
  };

  const getGroupHeader = (index: number) => {
    if (index === 0) {
      return {
        title: 'Group A: Administrative Foundation (Stages 01–04)',
        badge: 'ADMIN A',
        bg: 'bg-blue-50/60 text-blue-800 border-blue-200',
      };
    }
    if (index === 4) {
      return {
        title: 'Group B: Procurement & Inspection (Stages 05–09)',
        badge: 'ADMIN B',
        bg: 'bg-indigo-50/60 text-indigo-800 border-indigo-200',
      };
    }
    if (index === 9) {
      return {
        title: 'Group C: Dispatch, Verification & Billing (Stages 10–13)',
        badge: 'ADMIN C',
        bg: 'bg-teal-50/60 text-teal-800 border-teal-200',
      };
    }
    return null;
  };

  return (
    <div className="enterprise-card rounded-xl p-5 sm:p-6 border border-slate-200 bg-white space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              13-STAGE TIMELINE
            </span>
            <h3 className="text-base font-bold text-slate-900 font-editorial">
              Administrative Execution Pipeline
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status across all 13 authoritative project stages, derived directly from transactional records.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Current Workflow Focus:</span>
          <span className="font-mono font-bold text-blue-700 bg-blue-100/60 px-2.5 py-1 rounded border border-blue-200">
            Stage {currentStageNumber}
          </span>
        </div>
      </div>

      {/* Structured Grouped Stage List */}
      <div className="space-y-6">
        {stages.map((stage, idx) => {
          const groupHdr = getGroupHeader(idx);
          const isCurrent = stage.stageNumber === currentStageNumber;

          return (
            <React.Fragment key={stage.stageId}>
              {groupHdr && (
                <div className="pt-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      {groupHdr.title}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${groupHdr.bg}`}>
                      {groupHdr.badge}
                    </span>
                  </div>
                </div>
              )}

              <div
                className={`relative rounded-lg p-3.5 sm:p-4 border transition-all ${
                  isCurrent
                    ? 'border-blue-300 bg-blue-50/20 shadow-sm ring-1 ring-blue-500/20'
                    : stage.status === 'Completed'
                    ? 'border-slate-200 bg-white hover:border-slate-300'
                    : stage.status === 'Attention Required'
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-slate-200/80 bg-slate-50/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-xs shrink-0 mt-0.5 sm:mt-0">
                      {getStatusIcon(stage.status, isCurrent)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-700">
                          {stage.stageNumber}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">
                          {stage.name}
                        </h4>
                        {getStatusBadge(stage.status)}
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded">
                            CURRENT
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {stage.summary}
                      </p>
                    </div>
                  </div>

                  {/* Right side: Primary Reference, Date, Link */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      {stage.primaryReference && (
                        <div className="font-mono text-xs font-semibold text-slate-800">
                          {stage.primaryReference}
                        </div>
                      )}
                      {stage.date && (
                        <div className="text-[11px] text-slate-400 font-mono">
                          {stage.date}
                        </div>
                      )}
                    </div>

                    <Link
                      href={stage.navigationHref}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-colors shadow-2xs"
                      title={`Open Stage ${stage.stageNumber} (${stage.name}) module`}
                    >
                      <span>Open Module</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
