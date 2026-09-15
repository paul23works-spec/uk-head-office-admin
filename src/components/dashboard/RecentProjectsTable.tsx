'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, MapPin } from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { StatusBadge, DemoTag } from '../common/Badge';

export function RecentProjectsTable() {
  const { projects } = useProjects();
  // Display recent 5 projects
  const recentProjects = projects.slice(0, 5);

  return (
    <div className="enterprise-card rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 font-editorial">
              Recent Projects
            </h3>
            <DemoTag />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of recently updated administrative records and contracts
          </p>
        </div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          <span>View All Projects</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Project</th>
              <th className="py-3 px-4">Project Code</th>
              <th className="py-3 px-4">Client</th>
              <th className="py-3 px-4">Current Stage</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Last Updated</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {recentProjects.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                {/* Project */}
                <td className="py-3.5 px-4 font-medium text-slate-900 max-w-xs">
                  <Link
                    href={`/projects/${p.id}`}
                    className="hover:text-blue-700 font-semibold block truncate"
                  >
                    {p.name}
                  </Link>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {p.location}
                  </span>
                </td>

                {/* Project Code */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {p.code}
                  </span>
                </td>

                {/* Client */}
                <td className="py-3.5 px-4 max-w-[180px]">
                  <div className="truncate text-slate-700" title={p.client}>
                    {p.client}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{p.department}</div>
                </td>

                {/* Current Stage */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                    <span>{p.currentStageName}</span>
                  </span>
                </td>

                {/* Status */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <StatusBadge status={p.status} size="sm" />
                </td>

                {/* Last Updated */}
                <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{p.updatedAt}</span>
                  </div>
                </td>

                {/* Action */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <Link
                    href={`/projects/${p.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-semibold border border-slate-200 hover:border-blue-200 transition-colors"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3 h-3" />
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
