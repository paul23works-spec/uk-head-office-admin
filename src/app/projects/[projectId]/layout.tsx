'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useProjects } from '@/lib/project-context';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const { getProject } = useProjects();
  const projectId = params.projectId as string;
  
  const project = getProject(projectId);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 pt-10">
        <AlertCircle className="w-12 h-12 text-slate-400" />
        <h2 className="text-xl font-semibold text-slate-800">Project Not Found</h2>
        <p className="text-sm text-slate-500">The project you are looking for does not exist or has been removed.</p>
        <Link
          href="/projects"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Return to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Project Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-bold tracking-wider">
                {project.code}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                project.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                project.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                project.status === 'Attention Required' ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {project.status}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 font-editorial mb-1">
              {project.name}
            </h1>
            <p className="text-xs text-slate-500">
              {project.client} &bull; {project.location}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 mb-1">Contract Value</div>
            <div className="text-lg font-bold text-slate-900 font-mono">
              {project.contractValue}
            </div>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
