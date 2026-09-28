'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProjects } from '@/lib/project-context';
import { ArrowLeft, Clock, Info } from 'lucide-react';
import Link from 'next/link';

export default function ProjectStagePage() {
  const params = useParams();
  const router = useRouter();
  const { getProject } = useProjects();
  
  const projectId = params.projectId as string;
  const stageId = params.stageId as string;
  
  const project = getProject(projectId);

  if (!project) return null; // handled by layout

  const stage = project.projectStages?.find(s => s.stageDefId === stageId);
  const stageDef = project.workflowTemplate?.stages.find(s => s.id === stageId);

  if (!stage || !stageDef) {
    return (
      <div className="p-8 text-center text-slate-500">
        Stage definition not found in this project's workflow template.
      </div>
    );
  }

  // Placeholder for component resolution based on stageDefId
  // In a fully dynamic system, this would load a dynamic component (e.g. TenderForm, PoList, etc.)
  // For now we'll just render a generic "Coming Soon" or generic placeholder.

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push(`/projects/${project.id}`)}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800 font-editorial">
              {stage.name}
            </h2>
            <p className="text-xs text-slate-500">
              {stageDef.groupTitle} &bull; {stageDef.phase}
            </p>
          </div>
        </div>
        
        <div>
          <span className={`text-[11px] px-3 py-1.5 rounded-md font-bold uppercase tracking-wider ${
            stage.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
            stage.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
            'bg-slate-100 text-slate-500'
          }`}>
            {stage.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="enterprise-card bg-white rounded-xl border border-slate-200 p-8 text-center">
            <Info className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-2">Dynamic Module Active</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              This is the new generic architecture route for <strong>{stage.name}</strong>.
              The specific form and data components for this stage will be dynamically loaded here.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700">
              <Clock className="w-4 h-4 text-blue-500" />
              Module Component Pending Migration
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Stage Guidelines */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-3 font-editorial">Stage Guidelines</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              {stageDef.description}
            </p>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Required Role:</span>
                <span className="font-semibold text-slate-700">{stageDef.adminGroup}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Execution:</span>
                <span className="font-semibold text-slate-700">{stageDef.isParallel ? 'Parallel' : 'Sequential'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Requirement:</span>
                <span className="font-semibold text-slate-700">{stageDef.isOptional ? 'Optional' : 'Mandatory'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
