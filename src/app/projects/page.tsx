'use client';

import React, { useState, useMemo } from 'react';
import { Search, Plus } from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { ProjectTable } from '@/components/projects/ProjectTable';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { DemoTag } from '@/components/common/Badge';

export default function ProjectsPage() {
  const { projects } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [stageGroupFilter, setStageGroupFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'updated' | 'name' | 'value'>('updated');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filtered and sorted projects
  const filteredProjects = useMemo(() => {
    return projects
      .filter((project) => {
        // Search query match
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          project.name.toLowerCase().includes(q) ||
          project.code.toLowerCase().includes(q) ||
          project.client.toLowerCase().includes(q) ||
          project.location.toLowerCase().includes(q) ||
          project.currentStageName.toLowerCase().includes(q);

        // Status filter
        const matchesStatus =
          statusFilter === 'ALL' || project.status === statusFilter;

        // Stage group filter
        const matchesGroup =
          stageGroupFilter === 'ALL' || project.stageGroup === stageGroupFilter;

        return matchesSearch && matchesStatus && matchesGroup;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'value') {
          return b.contractValue.localeCompare(a.contractValue);
        }
        // default: updated date descending
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [projects, searchQuery, statusFilter, stageGroupFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-editorial">
              Projects Directory
            </h1>
            <DemoTag />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Central register of turnkey infrastructure, substation construction, and power delivery contracts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Search & Filter Controls */}
      <div className="enterprise-card rounded-xl p-4 border border-slate-200 bg-white space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by project, code, client, or site..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Filter by Status */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Attention Required">Attention Required</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
              <option value="Not Started">Not Started</option>
            </select>
          </div>

          {/* Filter by Workflow Stage Group */}
          <div className="md:col-span-2">
            <select
              value={stageGroupFilter}
              onChange={(e) => setStageGroupFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium text-slate-700"
            >
              <option value="ALL">All Workflow Stages</option>
              <option value="A">Stages 01 — 04</option>
              <option value="B">Stages 05 — 09</option>
              <option value="C">Stages 10 — 13</option>
            </select>
          </div>

          {/* Sort Control */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'updated' | 'name' | 'value')
              }
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium text-slate-700"
            >
              <option value="updated">Sort: Last Updated</option>
              <option value="name">Sort: Project Name</option>
              <option value="value">Sort: Contract Value</option>
            </select>
          </div>
        </div>

        {/* Counter and Active Filter Feedback */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{filteredProjects.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{projects.length}</span> demo projects
          </div>
          {(searchQuery || statusFilter !== 'ALL' || stageGroupFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setStageGroupFilter('ALL');
              }}
              className="text-blue-600 hover:text-blue-800 font-medium hover:underline text-[11px]"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Projects Table */}
      <ProjectTable projects={filteredProjects} />

      {/* Create Project Modal Dialog */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
