'use client';

import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

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
      router.push('/login');
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-linear-to-b from-[#FAFAF7] to-[#F5F2EC]">
        {/* Dot grid bg */}
        <div
          className="absolute inset-0 opacity-[0.3] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #dfddd9 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative z-10 flex flex-col items-center gap-4">
          {/* Animated logo badge */}
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 shadow-lg shadow-amber-500/25">
            <Zap className="h-7 w-7 text-white" strokeWidth={2.5} />
            {/* Spin ring */}
            <span className="absolute inset-0 rounded-2xl border-2 border-amber-300/60 animate-ping" />
          </div>
          <div className="text-center">
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest">
              Authenticating session…
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Shared Dashboard Sidebar */}
      <Sidebar />

      {/* Main Content Frame */}
      <div className="lg:pl-64 min-h-screen flex flex-col">
        <div className="flex-1 bg-slate-50 flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}
