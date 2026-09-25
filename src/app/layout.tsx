import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Fairy House AutoData — Đăng Ký Key',
  description: 'Đăng ký key kích hoạt Fairy House AutoData V2.0 — Giải pháp AI Automation Facebook đỉnh cao',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
