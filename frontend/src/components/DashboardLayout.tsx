'use client';

import React from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

export default function DashboardLayout({
  children,
  title = 'Dashboard'
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Persistent Sidebar */}
      <Sidebar />

      {/* Main content frame */}
      <div className="pl-64 flex-1 flex flex-col min-h-screen">
        {/* Sticky top navigation */}
        <TopNavbar title={title} />
        
        {/* Main nested page wrapper */}
        <main className="flex-1 p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
