'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { DelegationToast } from '../common/DelegationToast';
import { BrandIntro } from '../common/BrandIntro';
import { useAuth } from '@/lib/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { sessionStore } from '@/lib/session-store';

interface AppShellProps {
  children: React.ReactNode;
}

const formatStageName = (pathname: string): string => {
  if (pathname === '/') return 'Dashboard';
  if (pathname.startsWith('/projects')) return 'Projects';
  if (pathname.startsWith('/boq')) return 'BOQ Master';
  if (pathname.startsWith('/tenders')) return 'Tender — Stage 01';
  if (pathname.startsWith('/loi-loa')) return 'LOI / LOA — Stage 02';
  if (pathname.startsWith('/acceptance')) return 'Acceptance — Stage 03';
  if (pathname.startsWith('/cpg-agreement')) return 'CPG + Agreement — Stage 04';
  if (pathname.startsWith('/gtp')) return 'GTP — Stage 05';
  if (pathname.startsWith('/po')) return 'PO — Stage 06';
  if (pathname.startsWith('/inspection-call')) return 'Inspection Call — Stage 07';
  if (pathname.startsWith('/inspection-order')) return 'Inspection Order — Stage 08';
  if (pathname.startsWith('/jir')) return 'JIR — Stage 09';
  if (pathname.startsWith('/di')) return 'DI — Stage 10';
  if (pathname.startsWith('/micc')) return 'MICC — Stage 11';
  if (pathname.startsWith('/progressive-bill')) return 'Progressive Bill — Stage 12';
  if (pathname.startsWith('/final-bill')) return 'Final Bill — Stage 13';
  if (pathname.startsWith('/management/activity')) return 'Management Activity';
  return 'Unknown Stage';
};

export function AppShell({ children }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showBrandIntro, setShowBrandIntro] = useState(false);
  const { user, sessionId, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user && pathname !== '/login') {
      try {
        const isPending = sessionStorage.getItem('ukg_brand_intro_pending');
        if (isPending === 'true') {
          sessionStorage.removeItem('ukg_brand_intro_pending');
          setShowBrandIntro(true);
        }
      } catch (e) {
        // Safe fallback
      }
    }
  }, [user, pathname]);

  useEffect(() => {
    if (!isLoading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, isLoading, pathname, router]);

  useEffect(() => {
    if (user && sessionId && pathname !== '/login') {
      sessionStore.updateSessionActivity(sessionId, formatStageName(pathname));
    }
  }, [pathname, user, sessionId]);

  if (isLoading) return null;

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (!user) return null;

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
            <span className="font-semibold text-slate-700 font-editorial">UK ENTERPRISE</span>
            <span>—</span>
            <span>Office Administration System (Phase 6.2 — Activity Tracking)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            {/* hidden demo marker */}
          </div>
        </footer>
      </div>

      {/* Global Quick Search Modal */}
      <GlobalSearchModal />

      {/* Global Delegation Notification Toast */}
      <DelegationToast />

      {/* UK GROUP Brand Introduction Overlay */}
      {showBrandIntro && (
        <BrandIntro onComplete={() => setShowBrandIntro(false)} />
      )}
    </div>
  );
}
