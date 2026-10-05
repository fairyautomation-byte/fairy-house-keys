'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import Button from '../ui/Button';
import { useToast } from '../ui/ToastProvider';

interface NavGroup {
  groupTitle: string;
  items: {
    label: string;
    href: string;
    badge?: string;
    icon: React.ReactNode;
  }[];
}

const navGroups: NavGroup[] = [
  {
    groupTitle: 'Không gian làm việc',
    items: [
      {
        label: 'Tổng Quan',
        href: '/dashboard',
        icon: (
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        )
      },
      {
        label: 'License Của Tôi',
        href: '/dashboard/licenses',
        badge: '1 Thiết bị',
        icon: (
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        )
      },
      {
        label: 'Kích Hoạt Extension',
        href: '/activate',
        icon: (
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      }
    ]
  },
  {
    groupTitle: 'Dịch vụ & Nguồn vốn',
    items: [
      {
        label: 'Mua Key Bản Quyền',
        href: '/dashboard/store',
        icon: (
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        )
      },
      {
        label: 'Ví & Nạp PayOS',
        href: '/dashboard/wallet',
        badge: 'Tự động',
        icon: (
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        )
      },
      {
        label: 'Lịch Sử Giao Dịch',
        href: '/dashboard/transactions',
        icon: (
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        )
      }
    ]
  },
  {
    groupTitle: 'Hệ thống & Hỗ trợ',
    items: [
      {
        label: 'Cài Đặt Tài Khoản',
        href: '/dashboard/settings',
        icon: (
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
      }
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      toast.error('Không thể đăng xuất');
    }
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-white border-r border-[var(--fha-border)] sticky top-0 z-20 shrink-0">
      
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-[var(--fha-border)] shrink-0 bg-white">
        <Link href="/dashboard" className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)] rounded-fha">
          <Image src="/logo.png" alt="Logo" width={30} height={30} className="rounded shrink-0" />
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-[var(--fha-text)]">
              Fairy House
            </span>
            <span className="text-[10px] text-[var(--fha-text-muted)] font-mono">AutoData v2.0</span>
          </div>
        </Link>
      </div>

      {/* Nav with Logical Groupings */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-5 overflow-y-auto">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <div className="px-3 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--fha-text-faint)]">
                {group.groupTitle}
              </span>
            </div>
            
            {group.items.map((item) => {
              const isActive = item.href === '/dashboard' 
                ? pathname === item.href 
                : pathname?.startsWith(item.href);
                
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center justify-between px-3 py-2 rounded-fha transition-all text-sm font-medium group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)]
                    ${isActive 
                      ? 'bg-[var(--fha-brand-soft)] text-[var(--fha-brand)] font-semibold shadow-fha-hairline' 
                      : 'text-[var(--fha-text-muted)] hover:bg-[var(--fha-surface-2)] hover:text-[var(--fha-text)]'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`${isActive ? 'text-[var(--fha-brand)]' : 'text-[var(--fha-text-faint)] group-hover:text-[var(--fha-text-muted)]'}`}>
                      {item.icon}
                    </div>
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${isActive ? 'bg-[var(--fha-brand)] text-white' : 'bg-[var(--fha-surface-2)] text-[var(--fha-text-faint)] border border-[var(--fha-border)]'}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer / Account Footprint */}
      <div className="p-3 border-t border-[var(--fha-border)] space-y-1.5 bg-white">
        <a 
          href="https://zalo.me/0378791667"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-fha text-[var(--fha-text-muted)] hover:bg-[var(--fha-surface-2)] hover:text-[var(--fha-brand)] transition-colors"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#0068ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Hỗ trợ Zalo 24/7
          </span>
          <span className="text-[10px] text-[var(--fha-brand)] font-bold">Online</span>
        </a>

        <Link 
          href="/"
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-fha transition-colors text-[var(--fha-text-muted)] hover:bg-[var(--fha-surface-2)] hover:text-[var(--fha-text)]"
        >
          <svg className="w-4 h-4 text-[var(--fha-text-faint)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Về Trang Chủ Web
        </Link>

        <Button 
          variant="ghost" 
          fullWidth 
          size="sm"
          onClick={handleLogout} 
          className="justify-start px-3 text-xs text-[var(--fha-text-muted)] hover:text-[var(--fha-error)] hover:bg-[var(--fha-error-bg)]"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Đăng xuất tài khoản
        </Button>
      </div>

    </aside>
  );
}
