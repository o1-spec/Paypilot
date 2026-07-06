'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  DollarSign, 
  BarChart3, 
  LogOut,
  Zap,
  Send,
  Settings,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Payments Feed', href: '/payments', icon: DollarSign },
  { name: 'Reports & Audit', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Webhook Simulator', href: '/webhook-demo', icon: Send },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('paypilot_demo_session');
    window.location.href = '/';
  };

  const navContent = (
    <div className="flex h-full flex-col justify-between">
      <div>
        {/* Brand Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-100 bg-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-md shadow-indigo-500/20">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Pay<span className="text-indigo-600">Pilot</span>
            </span>
            <span className="block text-[9px] font-semibold text-slate-400 tracking-wider">
              NOMBA PARTNER MVP
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 px-4 py-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3.5 rounded-xl px-4.5 py-3 text-xs font-semibold tracking-wide transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Demo Auth Indicator */}
      <div className="border-t border-slate-100 p-4 bg-slate-50/50">
        <div className="rounded-2xl bg-white p-4 border border-slate-200/80 shadow-sm mb-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              SANDBOX DEV MODE
            </span>
          </div>
          <div className="text-[10px] text-slate-400 space-y-0.5 leading-normal font-medium">
            <span className="block">Provider: MockNomba</span>
            <span className="block font-semibold text-slate-600">Merchant: info@gracefoods.ng</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-250 bg-white hover:bg-red-50 text-xs font-bold text-slate-600 hover:text-red-600 py-2.5 shadow-sm transition-all duration-150"
        >
          <LogOut className="h-4 w-4" />
          Logout Sandbox
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-3 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm text-slate-600 focus:outline-none"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Desktop Sidebar (Left side anchor) */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white">
        {navContent}
      </aside>

      {/* Mobile Drawer Slide-in Overlay */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-250 bg-white lg:hidden animate-in slide-in-from-left duration-200">
            {navContent}
          </aside>
        </>
      )}
    </>
  );
}
