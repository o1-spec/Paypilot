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
  Send
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Payments Feed', href: '/payments', icon: DollarSign },
  { name: 'Reports & Audit', href: '/reports', icon: BarChart3 },
  { name: 'Webhook Simulator', href: '/webhook-demo', icon: Send },
];

export default function Sidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('paypilot_demo_session');
    window.location.href = '/';
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-slate-800 bg-slate-950 text-slate-100">
      {/* Brand Logo */}
      <div className="flex h-16 items-center gap-2 px-6 border-b border-slate-900 bg-slate-950">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 shadow-lg shadow-indigo-500/20">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight text-white">Pay<span className="text-indigo-500">Pilot</span></span>
          <span className="block text-[10px] font-semibold text-slate-500 tracking-wider">NOMBA HACKATHON MVP</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 px-4 py-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-100'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Demo Auth Indicator */}
      <div className="border-t border-slate-900 p-4 bg-slate-950/50">
        <div className="rounded-xl bg-slate-900/60 p-3.5 border border-slate-800/80 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider text-slate-400">DEMO MODE ACTIVE</span>
          </div>
          <span className="block text-[10px] font-semibold text-slate-500 mt-0.5">Merchant ID: pilot_demo</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 hover:bg-red-950/20 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Logout Demo
        </button>
      </div>
    </aside>
  );
}
