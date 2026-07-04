'use client';

import { Bell, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function TopNavbar({ title }: { title: string }) {
  const [merchantName, setMerchantName] = useState('Nomba Merchant');

  useEffect(() => {
    const session = localStorage.getItem('paypilot_demo_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.businessName) setMerchantName(parsed.businessName);
      } catch (e) {}
    }
  }, []);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8 shadow-sm">
      {/* Page Title */}
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>

      {/* Search & Actions */}
      <div className="flex items-center gap-6">
        {/* Search Bar */}
        <div className="relative w-64 hidden md:block">
          <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search transactions, bills..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
          />
        </div>

        {/* Notifications Button */}
        <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-indigo-600" />
        </button>

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-slate-200" />

        {/* User profile */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-600">
            {merchantName.substring(0, 2).toUpperCase()}
          </div>
          <div className="hidden lg:block text-left">
            <span className="block text-xs font-semibold text-slate-800">{merchantName}</span>
            <span className="block text-[10px] text-slate-400 font-medium">Standard Account</span>
          </div>
        </div>
      </div>
    </header>
  );
}
