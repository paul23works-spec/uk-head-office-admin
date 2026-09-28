'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProjects } from '@/lib/project-context';
import { PlayCircle, CheckCircle2, Circle } from 'lucide-react';

export default function ProjectDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { getProject } = useProjects();
  const projectId = params.projectId as string;
  
  const project = getProject(projectId);

  if (!project) return null; // handled by layout

  const stages = project.projectStages || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800 font-editorial">
          Workflow Status
        </h2>
        <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full font-medium">
          {project.workflowTemplate?.name || 'Standard Pipeline'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-1">
            {stages.map((stage, index) => {
              const isCompleted = stage.status === 'Completed';
              const isInProgress = stage.status === 'In Progress';
              
              return (
                <div 
                  key={stage.id} 
                  onClick={() => router.push(`/projects/${project.id}/stage/${stage.stageDefId}`)}
                  className={`flex items-center p-4 cursor-pointer transition-all border-b border-slate-100 last:border-0 hover:bg-slate-50 ${isInProgress ? 'bg-blue-50/30' : ''}`}
                >
                  <div className="flex-shrink-0 mr-4">
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    ) : isInProgress ? (
                      <PlayCircle className="w-6 h-6 text-blue-600" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-grow">
                    <h3 className={`text-sm font-semibold ${isCompleted ? 'text-slate-700' : isInProgress ? 'text-blue-900' : 'text-slate-500'}`}>
                      {stage.name}
                    </h3>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Stage definition ID: {stage.stageDefId}
                    </div>
                  </div>
                  <div>
                    <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider ${
                      isCompleted ? 'bg-emerald-100 text-emerald-700' :
                      isInProgress ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {stage.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Project Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Project Manager</span>
                <span className="font-medium text-slate-800">{project.projectManager}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Start Date</span>
                <span className="font-medium text-slate-800">{project.startDate}</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-slate-500">Expected Completion</span>
                <span className="font-medium text-slate-800">{project.expectedCompletion}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
