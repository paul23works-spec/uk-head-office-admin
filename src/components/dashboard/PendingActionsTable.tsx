'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, ArrowUpRight } from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { PriorityBadge, DemoTag } from '../common/Badge';

export function PendingActionsTable() {
  const { pendingActions } = useProjects();

  return (
    <div className="enterprise-card rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 font-editorial">
              Pending Actions
            </h3>
            <DemoTag />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Administrative items requiring verification, approval, or follow-up
          </p>
        </div>
        <span className="text-xs font-medium text-slate-500">
          Showing <span className="font-semibold text-slate-900">{pendingActions.length}</span> demo entries
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Project</th>
              <th className="py-3 px-4">Action Item</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {pendingActions.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-4 font-medium text-slate-900 max-w-xs">
                  <Link
                    href={`/projects/${item.projectId}`}
                    className="hover:text-blue-700 flex flex-col group"
                  >
                    <span className="truncate group-hover:underline">{item.project}</span>
                    <span className="font-mono text-[10px] text-slate-400">{item.projectCode}</span>
                  </Link>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5">
                    <span>{item.action}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{item.category}</span>
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <PriorityBadge priority={item.priority} />
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.dueDate}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                      item.status === 'In Progress'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : item.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <Link
                    href={`/projects/${item.projectId}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    <span>View</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
