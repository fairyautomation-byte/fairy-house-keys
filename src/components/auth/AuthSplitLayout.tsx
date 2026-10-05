'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface AuthSplitLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthSplitLayout({ children, title, subtitle }: AuthSplitLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--fha-surface-2)] flex flex-col lg:flex-row">
      
      {/* Left Column: Brand & Social Proof (50% on Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--fha-surface-2)] border-r border-[var(--fha-border)] p-12 lg:p-16 flex-col justify-between relative overflow-hidden">
        
        {/* Subtle background grid pattern */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-40" 
          style={{ 
            backgroundImage: 'linear-gradient(var(--fha-border) 1px, transparent 1px), linear-gradient(90deg, var(--fha-border) 1px, transparent 1px)', 
            backgroundSize: '40px 40px' 
          }} 
        />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)] rounded">
            <Image src="/logo.png" alt="Fairy House Logo" width={36} height={36} className="rounded" />
            <span className="font-bold text-lg tracking-tight text-[var(--fha-text)]">
              Fairy House <span className="text-[var(--fha-brand)]">AutoData</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-[var(--fha-text-muted)] border border-[var(--fha-border)]">
              v2.0
            </span>
          </Link>

          <div className="mt-16 space-y-4 max-w-lg 3xl:max-w-xl">
            <span className="px-3 py-1 rounded bg-[var(--fha-brand-soft)] text-[var(--fha-brand)] text-xs 3xl:text-sm font-bold uppercase tracking-wider border border-[var(--fha-brand)]">
              Tiện Ích Số 1 Tiếp Cận Khách Hàng
            </span>
            <h2 className="text-3xl 3xl:text-4xl font-black text-[var(--fha-text)] tracking-tight leading-snug">
              Tự Động Hóa Quét UID Khách Hàng. Chống Checkpoint Tuyệt Đối.
            </h2>
            <p className="text-sm 3xl:text-base text-[var(--fha-text-muted)] leading-relaxed">
              Hệ thống bản quyền 1 Key / 1 Thiết bị với công nghệ mô phỏng hành vi người thật Human-Emulation 2.0. Kích hoạt tự động tức thì qua PayOS.
            </p>
          </div>

          {/* Value Metric Chips */}
          <div className="mt-8 grid grid-cols-2 gap-3.5 max-w-md 3xl:max-w-lg">
            <div className="bg-white p-3.5 3xl:p-4 rounded-fha border border-[var(--fha-border)] shadow-fha-sm">
              <div className="text-lg 3xl:text-xl font-black font-mono text-[var(--fha-text)]">15,000+ UID</div>
              <div className="text-[11px] 3xl:text-xs text-[var(--fha-text-muted)] mt-0.5">Xử lý tự động mỗi ngày</div>
            </div>
            <div className="bg-white p-3.5 3xl:p-4 rounded-fha border border-[var(--fha-border)] shadow-fha-sm">
              <div className="text-lg 3xl:text-xl font-black font-mono text-[var(--fha-success)]">99.8% An toàn</div>
              <div className="text-[11px] 3xl:text-xs text-[var(--fha-text-muted)] mt-0.5">Không bị checkpoint nick</div>
            </div>
          </div>
        </div>

        {/* Bottom Social Proof Testimonial */}
        <div className="relative z-10 pt-10 border-t border-[var(--fha-border)] max-w-md 3xl:max-w-lg">
          <div className="flex items-center gap-1 text-[var(--fha-warning)] mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <svg key={s} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="text-xs 3xl:text-sm text-[var(--fha-text)] italic leading-relaxed">
            &ldquo;Extension chạy mượt, trễ ngẫu nhiên thông minh nên nick chính của mình quét cả tháng không hề bị hỏi checkpoint. Tiết kiệm công sức kết bạn thủ công rất nhiều.&rdquo;
          </p>
          <div className="mt-2 text-[11px] 3xl:text-xs font-bold text-[var(--fha-text-muted)]">
            — Minh Thuận, Chủ Shop Thời Trang Nữ (Hà Nội)
          </div>
        </div>

      </div>

      {/* Right Column: Form Container (50% Desktop, 100% Mobile) */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 bg-white min-h-screen">
        
        {/* Mobile Header */}
        <div className="w-full max-w-[420px] mb-6 flex items-center justify-between lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={28} height={28} className="rounded" />
            <span className="font-bold text-sm tracking-tight text-[var(--fha-text)]">
              Fairy House <span className="text-[var(--fha-brand)]">AutoData</span>
            </span>
          </Link>
          <Link href="/" className="text-xs font-semibold text-[var(--fha-brand)] hover:underline">
            Về Trang Chủ &rarr;
          </Link>
        </div>

        {/* Main Card */}
        <div className="w-full max-w-[420px] 3xl:max-w-[480px] space-y-6 3xl:space-y-8">
          
          <div className="space-y-1.5 3xl:space-y-2">
            <h1 className="text-2xl 3xl:text-3xl font-black text-[var(--fha-text)] tracking-tight">
              {title}
            </h1>
            <p className="text-xs sm:text-sm 3xl:text-base text-[var(--fha-text-muted)]">
              {subtitle}
            </p>
          </div>

          {/* Form Children */}
          {children}

          {/* Footer Security Notice */}
          <div className="pt-6 border-t border-[var(--fha-border)] text-center text-[11px] text-[var(--fha-text-muted)] space-y-2">
            <div className="flex items-center justify-center gap-2 font-medium">
              <svg className="w-3.5 h-3.5 text-[var(--fha-success)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Mã hóa bảo mật TLS 256-bit • Tích hợp PayOS</span>
            </div>
            <div>
              Cần trợ giúp? <a href="https://zalo.me/0378791667" target="_blank" rel="noopener noreferrer" className="font-bold text-[var(--fha-brand)] hover:underline">Liên hệ Zalo hỗ trợ 24/7</a>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
