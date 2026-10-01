'use client';
import React from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-fha-bg overflow-hidden font-sans relative">
      {/* Background Aurora Effects for global App */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-fha-cyan rounded-full mix-blend-screen filter blur-[140px] opacity-[0.15] animate-pulse pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full mix-blend-screen filter blur-[140px] opacity-[0.15] animate-pulse pointer-events-none z-0" style={{ animationDelay: '2s' }}></div>

      <Sidebar />
      <div className="flex-1 overflow-y-auto flex flex-col relative pb-[60px] md:pb-0 z-10">
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
