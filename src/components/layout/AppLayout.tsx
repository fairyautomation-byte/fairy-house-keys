'use client';
import React from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-[var(--fha-bg)] overflow-hidden font-sans relative text-[var(--fha-text)]">

      <Sidebar />
      <div className="flex-1 overflow-y-auto flex flex-col relative pb-[64px] md:pb-0 z-10">
        <main className="flex-1 p-4 md:p-8 lg:px-10 max-w-[1200px] mx-auto w-full">
          {children}
        </main>
      </div>
      <BottomNav />
      
    </div>
  );
}
