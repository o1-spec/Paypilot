'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, FileText, DollarSign, BarChart3,
  LogOut, Zap, Settings, Menu, X, Bell, Terminal,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchPayments } from '@/lib/api';

const mainNav = [
  { name: 'Dashboard',     href: '/dashboard',     icon: LayoutDashboard },
  { name: 'Customers',     href: '/customers',     icon: Users },
  { name: 'Invoices',      href: '/invoices',      icon: FileText },
  { name: 'Payments',      href: '/payments',      icon: DollarSign },
  { name: 'Reports',       href: '/reports',       icon: BarChart3 },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings',      href: '/settings',      icon: Settings },
];

const devNav = [
  { name: 'Developer Console', href: '/webhook-demo', icon: Terminal },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [unmatchedCount, setUnmatchedCount] = useState(0);
  const [businessName, setBusinessName] = useState('');

  useEffect(() => {
    const session = localStorage.getItem('paypilot_demo_session');
    if (session) {
      try { setBusinessName(JSON.parse(session).businessName || ''); } catch {}
    }
  }, []);

  useEffect(() => {
    fetchPayments({ status: 'UNMATCHED' })
      .then((data) => setUnmatchedCount(data.length))
      .catch(() => {});
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('paypilot_demo_session');
    window.location.href = '/login';
  };

  const navContent = (
    <div className="flex h-full flex-col justify-between">
      <div>
        {/* Brand Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-[#E5E2DC] bg-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 shadow-md shadow-amber-500/20">
            <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-[#0F172A]">
              Pay<span className="text-amber-500">Pilot</span>
            </span>
            <span className="block text-[9px] font-bold text-[#94A3B8] tracking-wider uppercase">
              Nomba Partner MVP
            </span>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="space-y-0.5 px-3 pt-5 pb-2">
          {mainNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold tracking-wide transition-all duration-150 ${
                  isActive
                    ? 'bg-[#0F172A] text-white shadow-sm'
                    : 'text-[#64748B] hover:bg-[#F0EDE8] hover:text-[#0F172A]'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-amber-400' : 'text-[#94A3B8]'}`} />
                <span className="flex-1">{item.name}</span>
                {item.href === '/payments' && unmatchedCount > 0 && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-amber-400/20 text-amber-300' : 'bg-rose-100 text-rose-600'
                  }`}>
                    {unmatchedCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Developer Tools section */}
        <div className="px-3 pb-4">
          <div className="border-t border-[#E5E2DC] pt-4">
            <span className="block text-[9px] font-bold tracking-widest text-[#94A3B8] uppercase px-3 mb-2">Developer Tools</span>
            {devNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold tracking-wide transition-all duration-150 ${
                    isActive
                      ? 'bg-[#0F172A] text-white shadow-sm'
                      : 'text-[#64748B] hover:bg-[#F0EDE8] hover:text-[#0F172A]'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-amber-400' : 'text-[#94A3B8]'}`} />
                  <span className="flex-1">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#E5E2DC] p-4">
        {/* Session pill */}
        <div className="rounded-2xl bg-[#FAFAF8] p-3.5 border border-[#E5E2DC] mb-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold tracking-wider text-emerald-600 uppercase">Nomba Connected</span>
          </div>
          <span className="block text-[10px] text-[#64748B] font-medium">Sandbox Environment</span>
          {businessName && (
            <span className="block text-[10px] font-bold text-[#0F172A] truncate">{businessName}</span>
          )}
        </div>
        <button
          onClick={() => setIsLogoutConfirmOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E5E2DC] bg-white hover:bg-rose-50 hover:border-rose-200 text-xs font-bold text-[#64748B] hover:text-rose-600 py-2.5 shadow-sm transition-all duration-150"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-3 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 bg-white rounded-xl border border-[#E5E2DC] shadow-sm text-[#64748B] focus:outline-none"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden lg:flex w-64 flex-col border-r border-[#E5E2DC] bg-white">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-[#0F172A]/40 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[#E5E2DC] bg-white lg:hidden animate-slide-left">
            {navContent}
          </aside>
        </>
      )}

      {/* Logout Confirm Modal */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-[#E5E2DC] animate-zoom-in">
            <h3 className="text-sm font-extrabold text-[#0F172A] mb-1.5">Sign Out</h3>
            <p className="text-xs text-[#64748B] mb-5 leading-normal">
              Are you sure you want to sign out? You'll be redirected to the login page.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E2DC]">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="rounded-xl border border-[#E5E2DC] text-xs font-semibold px-4 py-2 hover:bg-[#FAFAF8] text-[#64748B] transition-colors"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => { setIsLogoutConfirmOpen(false); handleLogout(); }}
                className="rounded-xl bg-[#0F172A] hover:bg-neutral-800 text-xs font-bold text-white px-5 py-2.5 shadow-md"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
