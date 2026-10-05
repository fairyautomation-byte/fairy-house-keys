'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { useToast } from '@/components/ui/ToastProvider';

const adminNavItems = [
  { label: 'Tổng Quan', href: '/admin' },
  { label: 'Đơn Hàng', href: '/admin/orders' },
  { label: 'Licenses', href: '/admin/licenses' },
  { label: 'Người Dùng', href: '/admin/users' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { error } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (pathname === '/admin/login') return <>{children}</>;

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/admin/login';
    } catch (err) {
      setLoggingOut(false);
      error('Không thể đăng xuất');
    }
  };

  return (
    <div className="flex h-screen bg-fha-bg overflow-hidden font-sans">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto flex flex-col relative pb-[60px] lg:pb-0">
        {/* Admin Mobile & Tablet Header (< 1024px) */}
        <header className="lg:hidden flex items-center justify-between px-4 sm:px-6 h-14 bg-white border-b border-[var(--fha-border)] shrink-0 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 -ml-1 text-[var(--fha-text-muted)] hover:text-[var(--fha-text)] rounded border border-[var(--fha-border)] focus:outline-none"
              aria-label="Menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/admin" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Admin Logo" width={26} height={26} className="rounded shrink-0" />
              <span className="font-bold text-sm tracking-tight text-[var(--fha-text)]">Admin Portal</span>
            </Link>
          </div>
          <div className="flex items-center gap-1.5">
            <Link
              href="/"
              className="px-2.5 py-1 text-xs font-semibold text-[var(--fha-text)] hover:text-[var(--fha-brand)] hover:bg-[var(--fha-surface-2)] rounded-fha border border-[var(--fha-border)] transition-colors"
            >
              Trang chủ
            </Link>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[var(--fha-error)] hover:bg-[var(--fha-error-bg)] rounded-fha border border-[var(--fha-error-border)] transition-colors active:scale-95 disabled:opacity-50"
            >
              <span>{loggingOut ? 'Thoát...' : 'Đăng xuất'}</span>
            </button>
          </div>
        </header>

        {/* Admin Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-[var(--fha-border)] px-4 py-3 shadow-md space-y-1 z-20 animate-fade-in">
            {adminNavItems.map(item => {
              const isActive = item.href === '/admin' ? pathname === item.href : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-fha text-sm font-semibold transition-colors ${
                    isActive ? 'bg-[var(--fha-brand-soft)] text-[var(--fha-brand)]' : 'text-[var(--fha-text-muted)] hover:bg-[var(--fha-surface-2)]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 2xl:p-10 3xl:p-12 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
