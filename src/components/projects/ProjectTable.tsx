'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  MapPin,
  FileText,
} from 'lucide-react';
import { Project } from '@/types';
import { StatusBadge } from '../common/Badge';

interface ProjectTableProps {
  projects: Project[];
}

export function ProjectTable({ projects }: ProjectTableProps) {
  if (projects.length === 0) {
    return (
      <div className="enterprise-card rounded-xl p-12 text-center border border-slate-200 bg-white">
        <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <h3 className="text-sm font-semibold text-slate-800 font-editorial">
          No Projects Found
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          No project records match the active search query or filter selection.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Desktop Table View */}
      <div className="hidden lg:block enterprise-card rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Project Name</th>
                <th className="py-3.5 px-4">Project Code</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Current Stage</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4">Last Updated</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {/* Project Name */}
                  <td className="py-3.5 px-4 font-medium text-slate-900 max-w-xs">
                    <Link
                      href={`/projects/${project.id}`}
                      className="font-semibold hover:text-blue-700 block truncate"
                    >
                      {project.name}
                    </Link>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      Val: {project.contractValue} • PM: {project.projectManager}
                    </span>
                  </td>

                  {/* Project Code */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {project.code}
                    </span>
                  </td>

                  {/* Client */}
                  <td className="py-3.5 px-4 max-w-[170px]">
                    <div className="truncate text-slate-800 font-medium" title={project.client}>
                      {project.client}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {project.department}
                    </div>
                  </td>

                  {/* Location */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[130px]">{project.location}</span>
                    </div>
                  </td>

                  {/* Current Stage */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                      <span>{project.currentStageName}</span>
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={project.status} size="sm" />
                  </td>

                  {/* Created Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                    {project.createdAt}
                  </td>

                  {/* Last Updated */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                    {project.updatedAt}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <Link
                      href={`/projects/${project.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white font-semibold transition-all shadow-2xs group-hover:bg-blue-600 group-hover:text-white"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile & Tablet Card View */}
      <div className="lg:hidden space-y-3">
        {projects.map((project) => (
          <div
            key={project.id}
            className="enterprise-card rounded-xl p-4 border border-slate-200 bg-white space-y-3 shadow-2xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {project.code}
                </span>
                <Link
                  href={`/projects/${project.id}`}
                  className="font-bold text-slate-900 hover:text-blue-700 block text-sm mt-1.5 font-editorial"
                >
                  {project.name}
                </Link>
              </div>
              <StatusBadge status={project.status} size="sm" />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Client</span>
                <span className="font-medium truncate block">{project.client}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Location</span>
                <span className="font-medium truncate block">{project.location}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Current Stage</span>
                <span className="font-medium text-blue-700 truncate block">
                  {project.currentStageName}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Contract Value</span>
                <span className="font-medium text-slate-900 truncate block">
                  {project.contractValue}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Updated: {project.updatedAt}
              </span>
              <Link
                href={`/projects/${project.id}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
