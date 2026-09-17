'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { ProjectPendingAction } from '@/types';
import { PriorityBadge } from '@/components/common/Badge';

interface ProjectPendingActionsProps {
  actions: ProjectPendingAction[];
}

export function ProjectPendingActions({ actions }: ProjectPendingActionsProps) {
  return (
    <div className="enterprise-card rounded-xl p-5 sm:p-6 border border-slate-200 bg-white space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              PENDING ACTIONS
            </span>
            <h3 className="text-base font-bold text-slate-900 font-editorial">
              Actionable Operational Tasks
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Logically identified pending steps derived strictly from current stage balances and workflow prerequisites.
          </p>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto">
          {actions.length} Action{actions.length === 1 ? '' : 's'} Required
        </span>
      </div>

      {actions.length === 0 ? (
        <div className="py-8 text-center space-y-2 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-800">
            No Pending Administrative Actions
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All current workflow prerequisites have been satisfied. No outstanding actions require immediate attention.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map((action) => (
            <div
              key={action.id}
              className="p-3.5 rounded-lg border border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/10 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    Stage {action.stageNumber}
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {action.title}
                  </span>
                  <PriorityBadge priority={action.priority} />
                  <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100">
                    {action.category}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {action.description}
                </p>
              </div>

              <Link
                href={action.actionUrl}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shrink-0 shadow-xs self-start sm:self-auto"
              >
                <span>{action.actionText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
