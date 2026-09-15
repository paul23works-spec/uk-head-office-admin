'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { useProjects } from '@/lib/project-context';

export function NotificationsPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadNotificationCount, markNotificationAsRead } = useProjects();
  const popoverRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = (id: string, link?: string) => {
    markNotificationAsRead(id);
    setIsOpen(false);
    if (link) {
      router.push(link);
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        aria-expanded={isOpen}
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadNotificationCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/75">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-slate-900">Notifications</h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {unreadNotificationCount} New
              </span>
            </div>
            <span className="text-[10px] uppercase font-semibold text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded">
              Demo Feed
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item.id, item.link)}
                className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${
                  !item.read ? 'bg-blue-50/40' : ''
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {item.type === 'alert' ? (
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  ) : item.type === 'update' ? (
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Info className="w-4 h-4 text-slate-500" />
                  )}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs ${!item.read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {item.title}
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0">{item.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{item.message}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-center">
            <span className="text-[11px] text-slate-500">Internal Office Administration System • Phase 1</span>
          </div>
        </div>
      )}
    </div>
  );
}
