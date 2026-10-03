'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Button from '../ui/Button';

interface NavbarProps {
  isLoggedIn: boolean;
}

export default function Navbar({ isLoggedIn }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full h-[64px] bg-white border-b border-[var(--fha-border)] shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)] rounded-fha">
              <Image src="/logo.png" alt="Fairy House Logo" width={32} height={32} className="rounded" />
              <span className="font-bold text-base tracking-tight text-[var(--fha-text)] hidden sm:block">
                Fairy House <span className="text-[var(--fha-brand)]">AutoData</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-[14px] font-medium text-[var(--fha-text-muted)] hover:text-[var(--fha-brand)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)] rounded">
              Tính Năng
            </Link>
            <Link href="/#pricing" className="text-[14px] font-medium text-[var(--fha-text-muted)] hover:text-[var(--fha-brand)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)] rounded">
              Bảng Giá
            </Link>
            <Link href="/#faq" className="text-[14px] font-medium text-[var(--fha-text-muted)] hover:text-[var(--fha-brand)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)] rounded">
              FAQ
            </Link>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard" passHref>
                <Button variant="primary" size="sm">Vào Trang Quản Lý</Button>
              </Link>
            ) : (
              <>
                <Link href="/login" passHref>
                  <Button variant="ghost" size="sm">Đăng nhập</Button>
                </Link>
                <Link href="/register" passHref>
                  <Button variant="primary" size="sm">Dùng thử miễn phí</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -mr-2 text-[var(--fha-text-muted)] hover:text-[var(--fha-text)] hover:bg-[var(--fha-surface-2)] rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)]"
              aria-label="Mở menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end md:hidden">
          <div 
            className="fixed inset-0 bg-[#111827]/45 transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-[280px] max-w-[85vw] bg-white border-l border-[var(--fha-border)] h-full shadow-fha-overlay flex flex-col pt-[64px] animate-fade-in">
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <Image src="/logo.png" alt="Logo" width={28} height={28} className="rounded" />
              <span className="font-bold text-sm tracking-tight text-[var(--fha-text)]">Fairy House</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-3 right-3 p-2 text-[var(--fha-text-muted)] hover:text-[var(--fha-text)] hover:bg-[var(--fha-surface-2)] rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)]"
              aria-label="Đóng menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex flex-col gap-6 p-6">
              <nav className="flex flex-col gap-5">
                <Link href="/#features" onClick={() => setMobileMenuOpen(false)} className="text-[15px] font-medium text-[var(--fha-text-muted)] hover:text-[var(--fha-brand)]">Tính Năng</Link>
                <Link href="/#pricing" onClick={() => setMobileMenuOpen(false)} className="text-[15px] font-medium text-[var(--fha-text-muted)] hover:text-[var(--fha-brand)]">Bảng Giá</Link>
                <Link href="/#faq" onClick={() => setMobileMenuOpen(false)} className="text-[15px] font-medium text-[var(--fha-text-muted)] hover:text-[var(--fha-brand)]">FAQ</Link>
              </nav>

              <div className="h-px bg-[var(--fha-border)] w-full" />

              <div className="flex flex-col gap-3">
                {isLoggedIn ? (
                  <Link href="/dashboard" passHref>
                    <Button variant="primary" fullWidth onClick={() => setMobileMenuOpen(false)}>Vào Trang Quản Lý</Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login" passHref>
                      <Button variant="secondary" fullWidth onClick={() => setMobileMenuOpen(false)}>Đăng nhập</Button>
                    </Link>
                    <Link href="/register" passHref>
                      <Button variant="primary" fullWidth onClick={() => setMobileMenuOpen(false)}>Đăng ký dùng thử</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
