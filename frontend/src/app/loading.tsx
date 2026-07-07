'use client';

import React from 'react';
import { Zap } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-linear-to-b from-[#FAFAF7] via-[#FCFAF8] to-[#F5F2EC] flex flex-col items-center justify-center">
      {/* Dot grid */}
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
          <span className="absolute inset-0 rounded-2xl border-2 border-amber-300/60 animate-ping" />
        </div>

        <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest">
          Loading PayPilot…
        </span>
      </div>
    </div>
  );
}
