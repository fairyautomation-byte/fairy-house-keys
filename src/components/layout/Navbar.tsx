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
      {/* Top Announcement Ribbon */}
      <aside aria-label="Thông báo cập nhật" className="w-full bg-[var(--fha-surface-2)] border-b border-[var(--fha-border)] py-1.5 px-3 sm:px-4 text-center">
        <div className="max-w-[1360px] 2xl:max-w-[1480px] mx-auto flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-medium text-[var(--fha-text-muted)] text-center leading-relaxed">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--fha-brand-soft)] text-[var(--fha-brand)] font-bold text-[10px] uppercase tracking-wider shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--fha-brand)] animate-pulse" />
            V2.0 Live
          </span>
          <span>Bản cập nhật V2.0 tối ưu hóa thuật toán Facebook 2026 — Quét UID tự động, kích hoạt tức thì qua PayOS</span>
          <Link href="/#pricing" className="text-[var(--fha-brand)] hover:underline font-semibold ml-1 hidden sm:inline">
            Khám phá ngay &rarr;
          </Link>
        </div>
      </aside>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 w-full h-[64px] bg-white/95 backdrop-blur-md border-b border-[var(--fha-border)] shadow-sm">
        <div className="max-w-[1360px] 2xl:max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)] rounded-fha">
              <Image src="/logo.png" alt="Fairy House Logo" width={32} height={32} className="rounded shrink-0" />
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-[var(--fha-text)]">
                  Fairy House <span className="text-[var(--fha-brand)]">AutoData</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--fha-surface-2)] text-[var(--fha-text-muted)] border border-[var(--fha-border)] hidden sm:inline-block">
                  v2.0
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-[14px] font-medium text-[var(--fha-text-muted)] hover:text-[var(--fha-brand)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)] rounded">
              Tính Năng
            </Link>
            <Link href="/#estimator" className="text-[14px] font-medium text-[var(--fha-text-muted)] hover:text-[var(--fha-brand)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)] rounded">
              Ước Tính Lead
            </Link>
            <Link href="/#workflow" className="text-[14px] font-medium text-[var(--fha-text-muted)] hover:text-[var(--fha-brand)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)] rounded">
              Quy Trình
            </Link>
            <Link href="/#pricing" className="text-[14px] font-medium text-[var(--fha-text-muted)] hover:text-[var(--fha-brand)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)] rounded inline-flex items-center gap-1.5">
              <span>Bảng Giá</span>
              <span className="px-1.5 py-0.2 bg-[var(--fha-success-bg)] text-[var(--fha-success)] text-[10px] font-bold rounded">Tự động</span>
            </Link>
            <Link href="/#faq" className="text-[14px] font-medium text-[var(--fha-text-muted)] hover:text-[var(--fha-brand)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)] rounded">
              FAQ
            </Link>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard" passHref>
                <Button variant="primary" size="sm">
                  Vào Trang Quản Lý
                  <svg className="w-4 h-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" passHref>
                  <Button variant="ghost" size="sm">Đăng nhập</Button>
                </Link>
                <Link href="/register" passHref>
                  <Button variant="primary" size="sm">
                    Dùng thử 3 ngày (0đ)
                  </Button>
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
          <div className="relative w-[300px] max-w-[85vw] bg-white border-l border-[var(--fha-border)] h-full shadow-fha-overlay flex flex-col pt-[20px] animate-fade-in">
            <div className="px-6 pb-4 border-b border-[var(--fha-border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image src="/logo.png" alt="Logo" width={28} height={28} className="rounded" />
                <span className="font-bold text-sm tracking-tight text-[var(--fha-text)]">
                  Fairy House <span className="text-[var(--fha-brand)]">AutoData</span>
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-[var(--fha-text-muted)] hover:text-[var(--fha-text)] hover:bg-[var(--fha-surface-2)] rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)]"
                aria-label="Đóng menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex flex-col gap-6 p-6 flex-1 overflow-y-auto">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fha-text-faint)] px-2">Khám phá</span>
                <nav className="flex flex-col gap-1">
                  <Link href="/#features" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-[14px] font-medium text-[var(--fha-text)] hover:bg-[var(--fha-surface-2)] rounded">
                    Tính Năng Bento
                  </Link>
                  <Link href="/#estimator" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-[14px] font-medium text-[var(--fha-text)] hover:bg-[var(--fha-surface-2)] rounded">
                    Ước Tính Lead
                  </Link>
                  <Link href="/#workflow" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-[14px] font-medium text-[var(--fha-text)] hover:bg-[var(--fha-surface-2)] rounded">
                    Quy Trình Cài Đặt
                  </Link>
                  <Link href="/#pricing" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-[14px] font-medium text-[var(--fha-text)] hover:bg-[var(--fha-surface-2)] rounded">
                    Bảng Giá Tự Động
                  </Link>
                  <Link href="/#faq" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-[14px] font-medium text-[var(--fha-text)] hover:bg-[var(--fha-surface-2)] rounded">
                    Hỏi Đáp (FAQ)
                  </Link>
                </nav>
              </div>

              <div className="pt-4 border-t border-[var(--fha-border)] flex flex-col gap-3">
                {isLoggedIn ? (
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} passHref>
                    <Button variant="primary" fullWidth size="md">Vào Trang Quản Lý</Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)} passHref>
                      <Button variant="secondary" fullWidth size="md">Đăng nhập</Button>
                    </Link>
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)} passHref>
                      <Button variant="primary" fullWidth size="md">Dùng thử 3 ngày (0đ)</Button>
                    </Link>
                  </>
                )}
                
                <a
                  href="https://zalo.me/0378791667"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-[var(--fha-brand)] hover:underline"
                >
                  <svg className="w-4 h-4 text-[#0068ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Hỗ trợ Zalo 24/7: 0378.791.667
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
