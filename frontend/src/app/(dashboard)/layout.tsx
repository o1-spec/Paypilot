'use client';

import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const session = localStorage.getItem('paypilot_demo_session');
    if (!session) {
      router.push('/');
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium tracking-wide">Authenticating demo session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Shared Dashboard Sidebar */}
      <Sidebar />

      {/* Main Content Frame */}
      <div className="pl-64 min-h-screen flex flex-col">
        <div className="flex-1 bg-slate-50 flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}
