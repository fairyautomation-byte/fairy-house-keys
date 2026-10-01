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
      <header className="sticky top-0 z-50 w-full h-[60px] bg-[#0a0f1a]/85 backdrop-blur-xl border-b border-fha-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fha-cyan to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-fha-cyan">
                FH
              </div>
              <span className="font-bold text-base tracking-tight text-fha-text hidden sm:block">
                Fairy House <span className="text-fha-cyan">AutoData</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-[14px] font-medium text-fha-text-muted hover:text-fha-text transition-colors">
              Tính Năng
            </Link>
            <Link href="/#pricing" className="text-[14px] font-medium text-fha-text-muted hover:text-fha-text transition-colors">
              Bảng Giá
            </Link>
            <Link href="/#faq" className="text-[14px] font-medium text-fha-text-muted hover:text-fha-text transition-colors">
              FAQ
            </Link>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard" passHref>
                <Button variant="primary" size="sm">Vào Dashboard</Button>
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
              className="p-2 -mr-2 text-fha-text-muted hover:text-fha-text focus:outline-none"
              aria-label="Open menu"
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
        <div className="fixed inset-0 z-[60] flex justify-end md:hidden">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-64 max-w-full bg-fha-surface h-full shadow-2xl flex flex-col p-6 animate-slide-up">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-fha-text-muted hover:text-fha-text"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex flex-col gap-6 mt-8">
              <nav className="flex flex-col gap-4">
                <Link href="/#features" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-fha-text-muted hover:text-fha-text">Tính Năng</Link>
                <Link href="/#pricing" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-fha-text-muted hover:text-fha-text">Bảng Giá</Link>
                <Link href="/#faq" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-fha-text-muted hover:text-fha-text">FAQ</Link>
              </nav>

              <div className="h-px bg-fha-border w-full" />

              <div className="flex flex-col gap-3">
                {isLoggedIn ? (
                  <Link href="/dashboard" passHref>
                    <Button variant="primary" fullWidth onClick={() => setMobileMenuOpen(false)}>Vào Dashboard</Button>
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
