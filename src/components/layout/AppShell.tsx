'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { GlobalSearchModal } from '../common/GlobalSearchModal';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Top Header */}
        <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

        {/* Dynamic Main Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Global Enterprise Footer */}
        <footer className="border-t border-slate-200 bg-white px-6 py-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 font-editorial">UK HEAD OFFICE</span>
            <span>•</span>
            <span>Office Administration System (Phase 4 — C Admin Modules: DI → MICC → Progressive Bill → Final Bill)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded border border-amber-200">
              DEMO ENVIRONMENT
            </span>
            <span>No Production Database Connected</span>
          </div>
        </footer>
      </div>

      {/* Global Quick Search Modal */}
      <GlobalSearchModal />
    </div>
  );
}
