import Link from 'next/link';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { USER_COOKIE_NAME } from '@/lib/auth';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import LandingPricing from '@/components/features/LandingPricing';
import LandingFAQ from '@/components/features/LandingFAQ';

export default function Home() {
  const cookieStore = cookies();
  const isLoggedIn = cookieStore.has(USER_COOKIE_NAME);

  return (
    <div className="min-h-screen bg-[var(--fha-surface-2)] text-[var(--fha-text)] font-sans selection:bg-[var(--fha-brand-soft)] overflow-hidden relative">
      <Navbar isLoggedIn={isLoggedIn} />

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 border-b border-[var(--fha-border)] bg-white overflow-hidden">
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-50" style={{ backgroundImage: 'linear-gradient(var(--fha-surface-2) 1px, transparent 1px), linear-gradient(90deg, var(--fha-surface-2) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        <div className="max-w-[1024px] mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[var(--fha-brand-soft)] text-[var(--fha-brand)] text-[11px] font-bold tracking-widest uppercase mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--fha-brand)] animate-pulse"></span>
            Chrome Extension V2.0
          </div>
          
          <h1 className="text-[36px] md:text-[48px] lg:text-[56px] font-black tracking-tight text-[var(--fha-text)] mb-6 leading-[1.15]">
            Quét Data Khách Hàng <br className="hidden md:block"/>
            <span className="text-[var(--fha-brand)]">
              Chính Xác & Tự Động 100%
            </span>
          </h1>
          
          <p className="text-lg text-[var(--fha-text-muted)] mb-10 max-w-2xl mx-auto leading-relaxed">
            Giải pháp hoàn hảo giúp bạn tự động hóa việc quét thông tin khách hàng tiềm năng. <strong className="font-semibold text-[var(--fha-text)]">Thanh toán tự động bằng PayOS</strong>, duyệt đơn và cấp Key trong 5 giây!
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={isLoggedIn ? "/dashboard" : "/register"} passHref>
              <Button variant="primary" size="lg" className="w-full sm:w-auto h-[48px] px-8">
                {isLoggedIn ? "Vào Trang Quản Lý" : "Dùng Thử Miễn Phí"}
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </Button>
            </Link>
            <Link href="#pricing" passHref>
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-[48px] px-8 bg-white hover:bg-[var(--fha-surface-2)]">
                Xem Bảng Giá
              </Button>
            </Link>
          </div>

          {/* Minimal Mockup Visual */}
          <div className="mt-20 relative mx-auto max-w-[800px]">
            <div className="rounded-fha-lg border-2 border-[var(--fha-border-strong)] bg-white shadow-fha-lg overflow-hidden flex flex-col items-center">
              <div className="w-full h-12 border-b border-[var(--fha-border)] flex items-center px-4 gap-4 bg-[var(--fha-surface-2)]">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]"></div>
                </div>
                <div className="flex-1 bg-white border border-[var(--fha-border)] h-7 rounded flex items-center px-3 justify-center text-[12px] text-[var(--fha-text-muted)] font-mono">
                  facebook.com/groups/target
                </div>
                <div className="w-8 h-7 bg-white border border-[var(--fha-border-strong)] rounded flex items-center justify-center overflow-hidden p-0.5">
                  <Image src="/logo.png" alt="Extension" width={20} height={20} className="rounded-sm" />
                </div>
              </div>
              <div className="w-full aspect-[16/9] relative flex flex-col p-8 bg-[url('/grid-pattern.svg')] bg-center bg-cover">
                {/* Abstract UI representation */}
                <div className="flex justify-between items-center mb-8 border-b border-[var(--fha-border)] pb-4">
                  <div className="w-48 h-6 bg-[var(--fha-surface-2)] rounded"></div>
                  <div className="w-24 h-8 bg-[var(--fha-brand-soft)] rounded border border-[var(--fha-brand)]"></div>
                </div>
                <div className="flex gap-6 flex-1">
                  <div className="w-64 bg-white rounded-fha border border-[var(--fha-border)] shadow-sm p-4 flex flex-col gap-4">
                    <div className="w-full h-8 bg-[var(--fha-surface-2)] rounded"></div>
                    <div className="w-3/4 h-4 bg-[var(--fha-surface-2)] rounded"></div>
                    <div className="w-1/2 h-4 bg-[var(--fha-surface-2)] rounded"></div>
                  </div>
                  <div className="flex-1 flex flex-col gap-4">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-full h-16 bg-white rounded-fha border border-[var(--fha-border)] shadow-sm flex items-center px-4 gap-4">
                        <div className="w-10 h-10 rounded bg-[var(--fha-surface-2)] border border-[var(--fha-border)]"></div>
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="w-32 h-3 bg-[var(--fha-surface-2)] rounded"></div>
                          <div className="w-24 h-2 bg-[var(--fha-surface-2)] rounded"></div>
                        </div>
                        <div className="w-20 h-6 bg-[var(--fha-success-bg)] border border-[var(--fha-success)] rounded text-[9px] font-bold text-[var(--fha-success)] flex items-center justify-center uppercase">Thành công</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Overlay Gradient */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
          </div>
        </div>
      </section>

      {/* Trust Stats Bar */}
      <section className="py-12 border-b border-[var(--fha-border)] bg-[var(--fha-surface-2)]">
        <div className="max-w-[1024px] mx-auto px-4 flex flex-wrap justify-center gap-8 md:gap-24">
          <div className="text-center">
            <div className="text-[28px] font-black text-[var(--fha-text)] tracking-tight">Tự động</div>
            <div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--fha-text-muted)] mt-1">Duyệt Đơn PayOS</div>
          </div>
          <div className="hidden md:block w-px h-12 bg-[var(--fha-border-strong)]"></div>
          <div className="text-center">
            <div className="text-[28px] font-black text-[var(--fha-text)] tracking-tight">1 Thiết Bị</div>
            <div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--fha-text-muted)] mt-1">Bảo Mật Key</div>
          </div>
          <div className="hidden md:block w-px h-12 bg-[var(--fha-border-strong)]"></div>
          <div className="text-center">
            <div className="text-[28px] font-black text-[var(--fha-text)] tracking-tight">24/7</div>
            <div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--fha-text-muted)] mt-1">Hoạt động liên tục</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white relative z-10 border-b border-[var(--fha-border)]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-[32px] font-bold text-[var(--fha-text)] mb-4 tracking-tight">Tính năng nổi bật</h2>
            <p className="text-base text-[var(--fha-text-muted)]">Công nghệ thông minh giúp bạn làm việc hiệu quả hơn.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { t: 'Thanh Toán PayOS', d: 'Hệ thống tự động nhận diện thanh toán chuyển khoản và duyệt đơn trong vài giây.', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
              { t: '1 Key / 1 Thiết Bị', d: 'Mỗi License Key được cấp phát độc quyền, giới hạn 1 thiết bị để đảm bảo tính ổn định và bảo mật cao nhất.', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
              { t: 'Tự Động Kích Hoạt', d: 'Key được kích hoạt ngay lập tức sau khi thanh toán thành công, hiển thị trực tiếp trên Dashboard.', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
              { t: 'Quản Lý Quota', d: 'Tự động tính toán số lượt quét mỗi ngày, tự động cấp lại hạn mức vào 0h đúng chuẩn giờ VN.', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
              { t: 'Dashboard Trực Quan', d: 'Bảng điều khiển hiện đại, phẳng, tốc độ cao. Dễ dàng theo dõi lịch sử giao dịch và gia hạn.', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
              { t: 'Bảo Mật OTP', d: 'Hệ thống xác thực qua email đảm bảo không ai có thể truy cập trái phép vào tài khoản của bạn.', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' }
            ].map((f, i) => (
              <div key={i} className="p-6 bg-[var(--fha-surface-2)] border border-[var(--fha-border)] hover:border-[var(--fha-brand)] rounded-fha-lg transition-colors group">
                <div className="w-12 h-12 rounded bg-white flex items-center justify-center text-[var(--fha-text-muted)] mb-5 border border-[var(--fha-border-strong)] group-hover:text-[var(--fha-brand)] group-hover:border-[var(--fha-brand)] transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} /></svg>
                </div>
                <h3 className="text-[17px] font-bold text-[var(--fha-text)] mb-2">{f.t}</h3>
                <p className="text-[var(--fha-text-muted)] leading-relaxed text-[14px]">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-[var(--fha-surface-2)] border-b border-[var(--fha-border)]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-[32px] font-bold text-[var(--fha-text)] mb-4 tracking-tight">4 Bước Bắt Đầu</h2>
          </div>
          <div className="flex flex-col md:flex-row gap-8 relative max-w-[900px] mx-auto">
            <div className="hidden md:block absolute top-6 left-[10%] right-[10%] h-px bg-[var(--fha-border-strong)]"></div>
            {[
              { s: '1', t: 'Đăng Ký', d: 'Tạo tài khoản và xác thực qua email.' },
              { s: '2', t: 'Thanh Toán', d: 'Quét mã QR PayOS, hệ thống tự duyệt.' },
              { s: '3', t: 'Lấy Key', d: 'Nhận Key kích hoạt độc quyền ngay lập tức.' },
              { s: '4', t: 'Nhập App', d: 'Dán Key vào Extension và sử dụng!' }
            ].map((step, i) => (
              <div key={i} className="relative z-10 flex-1 flex flex-row md:flex-col items-center md:text-center gap-5 md:gap-0">
                <div className="w-12 h-12 shrink-0 md:mx-auto rounded bg-white border-2 border-[var(--fha-border-strong)] flex items-center justify-center text-[18px] font-black text-[var(--fha-text)] md:mb-5 font-mono shadow-sm">
                  {step.s}
                </div>
                <div>
                  <h3 className="font-bold text-[16px] text-[var(--fha-text)] mb-1">{step.t}</h3>
                  <p className="text-[var(--fha-text-muted)] text-[13px] font-medium">{step.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-white relative z-10 border-b border-[var(--fha-border)]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-[32px] font-bold text-[var(--fha-text)] mb-4 tracking-tight">Bảng giá dịch vụ</h2>
            <p className="text-base text-[var(--fha-text-muted)]">Tất cả gói đều được <strong className="text-[var(--fha-text)] font-semibold">Tự Động Kích Hoạt</strong> sau khi thanh toán.</p>
          </div>
          
          <LandingPricing />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-[var(--fha-surface-2)]">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-[32px] font-bold text-[var(--fha-text)] tracking-tight">Câu hỏi thường gặp</h2>
          </div>
          
          <LandingFAQ />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-white border-t border-[var(--fha-border)]">
        <div className="max-w-[800px] mx-auto px-4 text-center">
          <h2 className="text-[32px] font-bold text-[var(--fha-text)] mb-6 tracking-tight">Bứt phá doanh thu ngay hôm nay</h2>
          <p className="text-lg text-[var(--fha-text-muted)] mb-10">Bắt đầu dùng thử miễn phí, tự động cấp key trong nháy mắt.</p>
          <Link href={isLoggedIn ? "/dashboard" : "/register"} passHref>
            <Button variant="primary" size="lg" className="h-[52px] px-10 text-[16px]">
              {isLoggedIn ? "Vào Trang Quản Lý" : "Tạo Tài Khoản & Nhận Key"}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--fha-surface-2)] border-t border-[var(--fha-border)] py-12">
        <div className="max-w-[1200px] mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Fairy House AutoData Logo" width={32} height={32} className="rounded shrink-0" />
            <span className="font-bold text-[var(--fha-text)] text-sm tracking-tight">Fairy House AutoData</span>
          </div>
          
          <div className="flex items-center gap-6 text-[14px] font-medium text-[var(--fha-text-muted)]">
            <Link href="/terms" className="hover:text-[var(--fha-text)] transition-colors focus-visible:outline-none focus-visible:underline">Điều khoản</Link>
            <Link href="/privacy" className="hover:text-[var(--fha-text)] transition-colors focus-visible:outline-none focus-visible:underline">Bảo mật</Link>
            <a href="https://zalo.me/0378791667" target="_blank" rel="noopener noreferrer" className="text-[var(--fha-brand)] hover:text-[var(--fha-brand-hover)] focus-visible:outline-none focus-visible:underline">
              Hỗ trợ Zalo
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
