'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  CheckCircle,
  Truck,
  CreditCard,
  ArrowUpRight,
} from 'lucide-react';
import {
  ProjectProcurementSummary,
  ProjectInspectionSummary,
  ProjectDispatchSummary,
  ProjectMiccSummary,
  ProjectControlBillingSummary,
} from '@/types';

interface ProjectOperationalSummaryProps {
  procurement: ProjectProcurementSummary;
  inspection: ProjectInspectionSummary;
  dispatch: ProjectDispatchSummary;
  micc: ProjectMiccSummary;
  billing: ProjectControlBillingSummary;
}

export function ProjectOperationalSummary({
  procurement,
  inspection,
  dispatch,
  micc,
  billing,
}: ProjectOperationalSummaryProps) {
  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `₹ ${(amount / 100000).toFixed(2)} L`;
    }
    return `₹ ${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 font-editorial">
            Core Operational Performance
          </h3>
          <p className="text-xs text-slate-500">
            Real-time factual operational state across Procurement, Quality Inspection, Logistics, and Financial Billing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* CARD 1: PROCUREMENT */}
        <div className="enterprise-card rounded-xl p-5 border border-slate-200 bg-white flex flex-col justify-between space-y-4 hover:shadow-xs transition-shadow">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Procurement
                </span>
              </div>
              <Link
                href="/po"
                className="text-slate-400 hover:text-blue-600 transition-colors"
                title="View POs"
              >
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div>
              <div className="text-2xl font-bold font-editorial text-slate-900">
                {procurement.totalOrderedQuantity}
                <span className="text-xs font-sans font-medium text-slate-500 ml-1.5">
                  / {procurement.totalBoqQuantity} ordered
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {procurement.remainingQuantity} units remaining in BOQ
              </div>
            </div>

            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${
                    procurement.totalBoqQuantity > 0
                      ? Math.min(
                          100,
                          Math.round((procurement.totalOrderedQuantity / procurement.totalBoqQuantity) * 100)
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Active POs</span>
              <span className="font-semibold text-slate-800">
                {procurement.activePoCount} orders ({formatCurrency(procurement.totalPoAmount)})
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">GTP Approvals</span>
              <span className="font-semibold text-slate-800">
                {procurement.approvedGtpCount} of {procurement.gtpCount} approved
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: INSPECTION */}
        <div className="enterprise-card rounded-xl p-5 border border-slate-200 bg-white flex flex-col justify-between space-y-4 hover:shadow-xs transition-shadow">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Inspection
                </span>
              </div>
              <Link
                href="/jir"
                className="text-slate-400 hover:text-indigo-600 transition-colors"
                title="View JIRs"
              >
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div>
              <div className="text-2xl font-bold font-editorial text-slate-900">
                {inspection.acceptedQuantity}
                <span className="text-xs font-sans font-medium text-slate-500 ml-1.5">
                  / {inspection.offeredQuantity} accepted
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {inspection.rejectedQuantity > 0 ? (
                  <span className="text-amber-700 font-medium">
                    {inspection.rejectedQuantity} rejected | {inspection.balanceQuantity} balance
                  </span>
                ) : (
                  <span>{inspection.balanceQuantity} balance awaiting clearance</span>
                )}
              </div>
            </div>

            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${
                    inspection.offeredQuantity > 0
                      ? Math.min(
                          100,
                          Math.round((inspection.acceptedQuantity / inspection.offeredQuantity) * 100)
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Calls & Orders</span>
              <span className="font-semibold text-slate-800">
                {inspection.callCount} calls / {inspection.orderCount} orders
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">JIR Reports</span>
              <span className="font-semibold text-slate-800">
                {inspection.jirCount} reports filed
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: DISPATCH & FIELD */}
        <div className="enterprise-card rounded-xl p-5 border border-slate-200 bg-white flex flex-col justify-between space-y-4 hover:shadow-xs transition-shadow">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
                  <Truck className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Dispatch & MICC
                </span>
              </div>
              <Link
                href="/di"
                className="text-slate-400 hover:text-teal-600 transition-colors"
                title="View DIs"
              >
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div>
              <div className="text-2xl font-bold font-editorial text-slate-900">
                {dispatch.dispatchedQuantity}
                <span className="text-xs font-sans font-medium text-slate-500 ml-1.5">
                  / {dispatch.acceptedQuantity} dispatched
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {dispatch.remainingDispatchQuantity} remain dispatchable
              </div>
            </div>

            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-teal-600 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${
                    dispatch.acceptedQuantity > 0
                      ? Math.min(
                          100,
                          Math.round((dispatch.dispatchedQuantity / dispatch.acceptedQuantity) * 100)
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Site Verified (MICC)</span>
              <span className="font-semibold text-slate-800">
                {micc.verifiedQuantity} verified ({micc.pendingVerificationQuantity} pending)
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Active DIs</span>
              <span className="font-semibold text-slate-800">
                {dispatch.activeDiCount} DIs issued
              </span>
            </div>
          </div>
        </div>

        {/* CARD 4: BILLING & FINANCIALS */}
        <div className="enterprise-card rounded-xl p-5 border border-slate-200 bg-white flex flex-col justify-between space-y-4 hover:shadow-xs transition-shadow">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Billing
                </span>
              </div>
              <Link
                href="/progressive-bill"
                className="text-slate-400 hover:text-emerald-600 transition-colors"
                title="View Bills"
              >
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div>
              <div className="text-2xl font-bold font-editorial text-slate-900">
                {formatCurrency(billing.cumulativeApprovedBilling)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Balance: {formatCurrency(billing.remainingContractBalance)}
              </div>
            </div>

            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${
                    billing.contractValue > 0
                      ? Math.min(
                          100,
                          Math.round(
                            (billing.cumulativeApprovedBilling / billing.contractValue) * 100
                          )
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Pending Claimed</span>
              <span className="font-semibold text-slate-800">
                {formatCurrency(billing.pendingClaimedBilling)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Final Bill</span>
              <span className="font-semibold text-slate-800">
                {billing.isFinanciallyClosed
                  ? 'Closed'
                  : billing.finalBillStatus
                  ? billing.finalBillStatus
                  : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
