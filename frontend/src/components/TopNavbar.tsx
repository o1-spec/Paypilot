'use client';

import React, { useEffect, useState } from 'react';
import SearchBar from './SearchBar';
import NotificationDropdown from './NotificationDropdown';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  NotificationItem,
} from '@/lib/api';

export default function TopNavbar({ title }: { title: string }) {
  const [merchantName, setMerchantName] = useState('Nomba Merchant');
  const [searchVal, setSearchVal] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data.slice(0, 10));
    } catch {}
  };

  useEffect(() => {
    const session = localStorage.getItem('paypilot_demo_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.businessName) setMerchantName(parsed.businessName);
      } catch {}
    }
    loadNotifications();
    const timer = setInterval(loadNotifications, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const initials = merchantName.substring(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[#E5E2DC] bg-white/95 backdrop-blur-sm lg:px-8 pl-16 pr-6 gap-4">
      {/* Page Title */}
      <h1 className="text-sm font-bold text-[#0F172A] tracking-tight hidden sm:block shrink-0">{title}</h1>

      {/* Right side controls */}
      <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
        <SearchBar
          value={searchVal}
          onChange={setSearchVal}
          placeholder="Search collections, customers…"
          className="hidden md:flex"
        />

        <div className="flex items-center gap-3">
          <NotificationDropdown
            notifications={notifications}
            onMarkRead={handleMarkRead}
            onMarkAllRead={handleMarkAllRead}
          />

          <div className="h-5 w-px bg-[#E5E2DC]" />

          {/* User chip */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 font-bold text-amber-600 text-xs shadow-sm border border-amber-200">
              {initials}
            </div>
            <div className="hidden lg:block text-left shrink-0">
              <span className="block text-xs font-semibold text-[#0F172A] tracking-tight leading-tight max-w-[140px] truncate" title={merchantName}>
                {merchantName}
              </span>
              <span className="block text-[10px] text-[#94A3B8] font-semibold mt-0.5">Developer Workspace</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
