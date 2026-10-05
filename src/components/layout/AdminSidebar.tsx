'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import Button from '../ui/Button';
import { useToast } from '../ui/ToastProvider';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: 'Tổng Quan',
    href: '/admin',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  {
    label: 'Đơn Hàng',
    href: '/admin/orders',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    )
  },
  {
    label: 'Licenses',
    href: '/admin/licenses',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    )
  },
  {
    label: 'Người Dùng',
    href: '/admin/users',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { error } = useToast();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/admin/login';
    } catch (err) {
      error('Không thể đăng xuất');
    }
  };

  return (
    <aside className="hidden lg:flex flex-col w-[260px] h-screen bg-[var(--fha-surface)] border-r border-[var(--fha-border-strong)] sticky top-0 shadow-sm z-30">
      
      {/* Brand */}
      <div className="h-[64px] flex items-center px-6 border-b border-[var(--fha-border)] shrink-0 bg-[var(--fha-surface-2)]">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Admin Logo" width={32} height={32} className="rounded shrink-0" />
          <span className="font-bold text-[15px] tracking-tight text-[var(--fha-text)] truncate">
            Admin Portal
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-6 px-4 flex flex-col gap-1.5 overflow-y-auto">
        <div className="px-3 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--fha-text-faint)]">
            Quản trị viên
          </span>
        </div>
        
        {navItems.map((item) => {
          const isActive = item.href === '/admin' 
            ? pathname === item.href 
            : pathname?.startsWith(item.href);
            
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-fha transition-colors text-[14px] font-semibold group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)]
                ${isActive 
                  ? 'bg-[var(--fha-brand-soft)] text-[var(--fha-brand)]' 
                  : 'text-[var(--fha-text-muted)] hover:bg-[var(--fha-surface-2)] hover:text-[var(--fha-text)]'
                }
              `}
            >
              <div className={`${isActive ? 'text-[var(--fha-brand)]' : 'text-[var(--fha-text-muted)] group-hover:text-[var(--fha-text)]'} transition-colors`}>
                {item.icon}
              </div>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-[var(--fha-border-strong)] bg-[var(--fha-surface-2)]">
        <Button variant="ghost" fullWidth onClick={handleLogout} className="justify-start text-[var(--fha-text-muted)] hover:text-[var(--fha-error)] hover:bg-[var(--fha-error-bg)]">
          <span className="mr-3">
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </span>
          Đăng xuất
        </Button>
      </div>

    </aside>
  );
}
