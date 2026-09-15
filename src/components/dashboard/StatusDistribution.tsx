'use client';

import React from 'react';
import { useProjects } from '@/lib/project-context';
import { DemoTag } from '../common/Badge';

export function StatusDistribution() {
  const { stats } = useProjects();
  const total = stats.total || 1;

  const statuses = [
    {
      label: 'In Progress',
      count: stats.active,
      percentage: Math.round((stats.active / total) * 100),
      color: 'bg-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
    },
    {
      label: 'Attention Required',
      count: stats.attentionRequired,
      percentage: Math.round((stats.attentionRequired / total) * 100),
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-800',
      borderColor: 'border-amber-200',
    },
    {
      label: 'Completed',
      count: stats.completed,
      percentage: Math.round((stats.completed / total) * 100),
      color: 'bg-emerald-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-800',
      borderColor: 'border-emerald-200',
    },
    {
      label: 'On Hold',
      count: stats.onHold,
      percentage: Math.round((stats.onHold / total) * 100),
      color: 'bg-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200',
    },
    {
      label: 'Not Started',
      count: stats.notStarted,
      percentage: Math.round((stats.notStarted / total) * 100),
      color: 'bg-slate-400',
      bgColor: 'bg-slate-50',
      textColor: 'text-slate-700',
      borderColor: 'border-slate-200',
    },
  ];

  return (
    <div className="enterprise-card rounded-xl p-6 border border-slate-200 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 font-editorial">
              Project Status Distribution
            </h3>
            <DemoTag />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Active portfolio breakdown across operational lifecycle phases
          </p>
        </div>
        <div className="text-xs text-slate-500">
          Total Tracked: <span className="font-semibold text-slate-900">{total} Projects</span>
        </div>
      </div>

      {/* Proportional Segmented Progress Bar */}
      <div className="h-3 w-full rounded-full bg-slate-100 flex overflow-hidden p-0.5 gap-0.5 my-4 border border-slate-200/60">
        {statuses.map(
          (st) =>
            st.count > 0 && (
              <div
                key={st.label}
                title={`${st.label}: ${st.count} (${st.percentage}%)`}
                style={{ width: `${Math.max(st.percentage, 4)}%` }}
                className={`h-full rounded-xs transition-all duration-300 ${st.color}`}
              />
            )
        )}
      </div>

      {/* Status Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
        {statuses.map((item) => (
          <div
            key={item.label}
            className={`p-3 rounded-lg border ${item.borderColor} ${item.bgColor} flex flex-col justify-between`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="text-xs font-semibold text-slate-700 truncate">{item.label}</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className={`text-xl font-bold font-editorial ${item.textColor}`}>
                {item.count}
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
