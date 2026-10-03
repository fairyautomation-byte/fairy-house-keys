'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useToast } from '../ui/ToastProvider';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { error } = useToast();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (err) {
      setLoggingOut(false);
      error('Không thể đăng xuất');
    }
  };

  return (
    <div className="flex h-screen bg-[var(--fha-bg)] overflow-hidden font-sans relative text-[var(--fha-text)]">
      <Sidebar />
      <div className="flex-1 overflow-y-auto flex flex-col relative pb-[64px] md:pb-0 z-10">
        {/* Mobile Top Header */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-[var(--fha-border)] shrink-0 sticky top-0 z-30">
          <Link href="/dashboard" className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)] rounded">
            <Image src="/logo.png" alt="Logo" width={28} height={28} className="rounded shrink-0" />
            <span className="font-bold text-sm tracking-tight text-[var(--fha-text)]">Fairy House</span>
          </Link>
          <button 
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--fha-text-muted)] hover:text-[var(--fha-error)] hover:bg-[var(--fha-error-bg)] rounded-fha border border-[var(--fha-border-strong)] hover:border-[var(--fha-error-border)] transition-colors active:scale-95 disabled:opacity-50"
            aria-label="Đăng xuất"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>{loggingOut ? 'Đang thoát...' : 'Đăng xuất'}</span>
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8 lg:px-10 max-w-[1200px] mx-auto w-full">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
