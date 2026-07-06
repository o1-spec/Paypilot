'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
        Loading PayPilot Workspace
      </span>
    </div>
  );
}
