import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[var(--fha-border)] py-12">
      <div className="fha-container-standard">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Fairy House AutoData Logo" width={32} height={32} className="rounded shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-[var(--fha-text)] text-sm tracking-tight">Fairy House AutoData</span>
              <span className="text-[11px] text-[var(--fha-text-muted)]">Nền tảng tự động hóa tiếp cận khách hàng số 1</span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-[var(--fha-text-muted)]">
            <Link href="/terms" className="hover:text-[var(--fha-text)] transition-colors">Điều khoản dịch vụ</Link>
            <Link href="/privacy" className="hover:text-[var(--fha-text)] transition-colors">Chính sách bảo mật</Link>
            <Link href="/activate" className="hover:text-[var(--fha-text)] transition-colors">Hướng dẫn cài đặt Extension</Link>
            <a 
              href="https://zalo.me/0378791667" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[var(--fha-brand)] hover:underline flex items-center gap-1"
            >
              <span>Hotline Zalo: 0378.791.667</span>
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--fha-border)] text-center text-[11px] text-[var(--fha-text-faint)]">
          © {new Date().getFullYear()} Fairy House AutoData. Tất cả bản quyền được bảo lưu. Tích hợp cổng thanh toán tự động PayOS.
        </div>
      </div>
    </footer>
  );
}
