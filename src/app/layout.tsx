import type { Metadata } from 'next';
import { Be_Vietnam_Pro, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/ToastProvider';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Fairy House AutoData — Quét data Facebook & kết bạn tự động',
  description: 'Mua license key Fairy House AutoData V2.0 — Chrome Extension quét data khách hàng Facebook, tự động kết bạn theo UID. Kích hoạt tức thì, hỗ trợ 24/7.',
  keywords: ['fairy house autodata', 'quét data facebook', 'kết bạn tự động', 'chrome extension', 'license key'],
  openGraph: {
    title: 'Fairy House AutoData — Quét data Facebook & kết bạn tự động',
    description: 'Chrome Extension quét data khách hàng Facebook, tự động kết bạn theo UID. Mua license, kích hoạt tức thì.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} ${jetbrainsMono.variable}`}>
      <body className={beVietnamPro.className}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
