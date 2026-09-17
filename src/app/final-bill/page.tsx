'use client';

import React, { useState } from 'react';
import { useProjects } from '@/lib/project-context';
import { FinalBillRecord, FinalBillStatus } from '@/types';
import { DemoTag, EnvironmentBadge } from '@/components/common/Badge';
import { CreateFinalBillModal } from '@/components/final-bill/CreateFinalBillModal';
import { ViewFinalBillModal } from '@/components/final-bill/ViewFinalBillModal';
import Link from 'next/link';

export default function FinalBillPage() {
  const { finalBills, projects, progressiveBills } = useProjects();
  const [selectedBill, setSelectedBill] = useState<FinalBillRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Filter bills
  const filteredBills = finalBills.filter((bill) => {
    const matchesSearch =
      bill.finalBillNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.projectId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.remarks?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = projectFilter === 'ALL' || bill.projectId === projectFilter;
    const matchesStatus = statusFilter === 'ALL' || bill.status === statusFilter;
    return matchesSearch && matchesProject && matchesStatus;
  });

  // Calculate KPIs
  const totalBills = finalBills.length;
  const approvedBills = finalBills.filter((b) => b.status === 'Approved');
  const totalSettledPayable = approvedBills.reduce((sum, b) => sum + (b.finalBillAmount || 0), 0);
  const totalApprovedProgressive = progressiveBills
    .filter((pb) => pb.status === 'Approved')
    .reduce((sum, pb) => sum + (pb.currentApprovedAmount || 0), 0);

  const handleOpenView = (bill: FinalBillRecord) => {
    setSelectedBill(bill);
    setIsViewOpen(true);
  };

  const getStatusBadgeClass = (status: FinalBillStatus) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Submitted':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Under Review':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Rejected':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wider">
              Stage 13
            </span>
            <DemoTag label="STAGE 13 DATA" />
            <EnvironmentBadge phase="PHASE 4" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Final Bill Reconciliation & Settlement
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Stage 13 financial closure — Final Contract Reconciliation = Contract Value + Adjustments - Approved Progressive Bills.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="create-final-bill-btn"
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Lodge Final Bill
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-border bg-card shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Final Bills</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-foreground">{totalBills}</span>
            <span className="text-xs text-muted-foreground">{approvedBills.length} approved</span>
          </div>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Settled & Approved</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              ₹{(totalSettledPayable / 100000).toFixed(2)} L
            </span>
            <span className="text-xs text-muted-foreground">{approvedBills.length} project(s) closed</span>
          </div>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Progressive Cleared</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ₹{(totalApprovedProgressive / 100000).toFixed(2)} L
            </span>
            <span className="text-xs text-muted-foreground">Across all stages</span>
          </div>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Closure Ratio</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-foreground">
              {projects.length > 0 ? `${Math.round((approvedBills.length / projects.length) * 100)}%` : '0%'}
            </span>
            <span className="text-xs text-muted-foreground">{projects.length} Total Projects</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-lg border border-border bg-card shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
        <div className="flex-1 relative">
          <input
            id="search-final-bill-input"
            type="text"
            placeholder="Search by Bill #, Project, or Remarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <svg className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center gap-3">
          <select
            id="filter-project-select"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="text-sm rounded-md border border-input bg-background px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} - {p.name}
              </option>
            ))}
          </select>

          <select
            id="filter-status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm rounded-md border border-input bg-background px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Final Bills Table */}
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground font-semibold">
              <tr>
                <th className="px-4 py-3">Bill Number</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3 text-right">Contract Value</th>
                <th className="px-4 py-3 text-right">Progressive Bills Paid</th>
                <th className="px-4 py-3 text-right">Adjustments</th>
                <th className="px-4 py-3 text-right font-bold text-foreground">Final Payable</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    No final bills found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {bill.finalBillNumber}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/projects/${bill.projectId}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {bill.projectId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                      ₹{bill.contractValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-blue-600 dark:text-blue-400">
                      ₹{bill.totalApprovedProgressiveBills.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono ${bill.adjustments >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {bill.adjustments >= 0 ? '+' : ''}₹{bill.adjustments.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                      ₹{bill.finalBillAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {bill.billDate}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getStatusBadgeClass(bill.status)}`}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleOpenView(bill)}
                        className="px-2.5 py-1 text-xs font-medium rounded border border-border bg-background hover:bg-muted text-foreground transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {isCreateOpen && (
        <CreateFinalBillModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
        />
      )}

      {isViewOpen && selectedBill && (
        <ViewFinalBillModal
          isOpen={isViewOpen}
          onClose={() => {
            setIsViewOpen(false);
            setSelectedBill(null);
          }}
          finalBill={selectedBill}
        />
      )}
    </div>
  );
}
