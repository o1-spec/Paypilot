'use client';

import React, { useEffect, useState } from 'react';
import SearchBar from './SearchBar';
import NotificationDropdown from './NotificationDropdown';
import { 
  fetchNotifications, 
  markNotificationRead, 
  markAllNotificationsRead, 
  NotificationItem 
} from '@/lib/api';

export default function TopNavbar({ title }: { title: string }) {
  const [merchantName, setMerchantName] = useState('Nomba Merchant');
  const [searchVal, setSearchVal] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications();
      // Keep only first 10 for dropdown length efficiency
      setNotifications(data.slice(0, 10));
    } catch (e) {}
  };

  useEffect(() => {
    const session = localStorage.getItem('paypilot_demo_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.businessName) setMerchantName(parsed.businessName);
      } catch (e) {}
    }

    loadNotifications();
    // Poll notifications every 10 seconds for real-time sandbox events mapping updates
    const timer = setInterval(loadNotifications, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (e) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {}
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
      {/* Page Title */}
      <h1 className="text-base font-bold text-slate-900 tracking-tight hidden sm:block">{title}</h1>

      {/* Search & Actions */}
      <div className="flex items-center gap-5 w-full sm:w-auto justify-between sm:justify-end ml-auto">
        {/* Search Bar */}
        <SearchBar
          value={searchVal}
          onChange={setSearchVal}
          placeholder="Search collections, customers..."
          className="hidden md:flex"
        />

        <div className="flex items-center gap-4.5 ml-auto">
          {/* Notifications Dropdown */}
          <NotificationDropdown
            notifications={notifications}
            onMarkRead={handleMarkRead}
            onMarkAllRead={handleMarkAllRead}
          />

          {/* Vertical Divider */}
          <div className="h-5 w-px bg-slate-200" />

          {/* User profile */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-600 shadow-sm border border-indigo-100">
              {merchantName.substring(0, 2).toUpperCase()}
            </div>
            <div className="hidden lg:block text-left">
              <span className="block text-xs font-semibold text-slate-800 tracking-tight leading-tight">{merchantName}</span>
              <span className="block text-[10px] text-slate-400 font-semibold mt-0.5 tracking-wide">Developer Sandbox</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
