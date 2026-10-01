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
    <div className="min-h-screen bg-fha-bg text-fha-text font-sans selection:bg-fha-cyan/30 overflow-hidden relative">
      <Navbar isLoggedIn={isLoggedIn} />

      {/* Hero Section with Grid Pattern */}
      <section className="relative pt-24 pb-32 border-b border-fha-border overflow-hidden">
        {/* Subtle CSS Grid Pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(var(--fha-border) 1px, transparent 1px), linear-gradient(90deg, var(--fha-border) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fha-surface border border-fha-cyan/30 text-fha-cyan text-[11px] font-bold tracking-widest uppercase mb-8 shadow-fha-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-fha-cyan animate-pulse"></span>
            Chrome Extension V2.0
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-[52px] font-bold tracking-tight text-white mb-6 leading-[1.1]">
            Quét Data Khách Hàng <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fha-cyan to-purple-500">
              Chính Xác & Tự Động 100%
            </span>
          </h1>
          
          <p className="text-lg text-fha-text-muted mb-10 max-w-2xl mx-auto leading-relaxed">
            Giải pháp hoàn hảo giúp bạn tự động hóa việc quét thông tin khách hàng tiềm năng trên Facebook. Tiết kiệm 90% thời gian, tăng doanh thu mạnh mẽ.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={isLoggedIn ? "/dashboard" : "/register"} passHref>
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                {isLoggedIn ? "Vào Trang Quản Lý" : "Dùng thử miễn phí"}
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </Button>
            </Link>
            <Link href="#pricing" passHref>
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Xem bảng giá
              </Button>
            </Link>
          </div>

          {/* CSS Mockup Visual */}
          <div className="mt-20 relative mx-auto max-w-4xl">
            <div className="rounded-2xl border border-fha-glass-border bg-fha-glass backdrop-blur-xl shadow-fha-outset overflow-hidden flex flex-col items-center">
              <div className="w-full h-10 bg-fha-bg/80 border-b border-fha-glass-border flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full shadow-fha-outset bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full shadow-fha-outset bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full shadow-fha-outset bg-emerald-500/80"></div>
                </div>
                <div className="flex-1 ml-4 bg-fha-bg shadow-fha-inset h-6 rounded-xl border-none flex items-center px-3 justify-center text-[11px] text-fha-text-faint font-mono">
                  facebook.com/groups/target
                </div>
                <div className="w-8 h-6 bg-fha-cyan shadow-fha-outset rounded flex items-center justify-center text-[#0a0f1a] text-[10px] font-bold">FH</div>
              </div>
              <div className="w-full aspect-[16/9] relative flex flex-col p-8">
                {/* Fake UI */}
                <div className="flex justify-between items-center mb-8 border-b border-fha-glass-border pb-4">
                  <div className="w-48 h-6 bg-fha-surface/40 rounded-xl"></div>
                  <div className="w-24 h-8 bg-fha-cyan shadow-fha-outset rounded-full"></div>
                </div>
                <div className="flex gap-6 flex-1">
                  <div className="w-64 bg-fha-surface/30 rounded-2xl border border-fha-glass-border shadow-fha-outset p-4 flex flex-col gap-4">
                    <div className="w-full h-8 bg-fha-bg shadow-fha-inset rounded-xl"></div>
                    <div className="w-3/4 h-4 bg-fha-surface/40 rounded"></div>
                    <div className="w-1/2 h-4 bg-fha-surface/40 rounded"></div>
                  </div>
                  <div className="flex-1 flex flex-col gap-4">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-full h-16 bg-fha-surface/30 rounded-2xl border border-fha-glass-border shadow-fha-outset flex items-center px-4 gap-4">
                        <div className="w-10 h-10 rounded-full bg-fha-surface/50 shadow-fha-inset"></div>
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="w-32 h-3 bg-fha-surface/40 rounded"></div>
                          <div className="w-24 h-2 bg-fha-surface/40 rounded"></div>
                        </div>
                        <div className="w-20 h-6 bg-fha-success-bg border border-fha-success-border rounded-full shadow-fha-outset"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Overlay Gradient */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-fha-bg to-transparent pointer-events-none"></div>
          </div>
        </div>
      </section>

      {/* Trust Stats Bar */}
      <section className="py-10 border-b border-fha-border bg-fha-surface/30">
        <div className="max-w-5xl mx-auto px-4 flex flex-wrap justify-center gap-8 md:gap-24">
          <div className="text-center">
            <div className="text-2xl font-bold text-fha-text">1,000+</div>
            <div className="text-[11px] uppercase tracking-wider text-fha-text-muted mt-1">Người dùng</div>
          </div>
          <div className="hidden md:block w-px h-12 bg-fha-border"></div>
          <div className="text-center">
            <div className="text-2xl font-bold text-fha-text">99.9%</div>
            <div className="text-[11px] uppercase tracking-wider text-fha-text-muted mt-1">Uptime</div>
          </div>
          <div className="hidden md:block w-px h-12 bg-fha-border"></div>
          <div className="text-center">
            <div className="text-2xl font-bold text-fha-text">4 Gói</div>
            <div className="text-[11px] uppercase tracking-wider text-fha-text-muted mt-1">Dịch vụ linh hoạt</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Tính năng nổi bật</h2>
            <p className="text-base text-fha-text-muted">Công nghệ thông minh giúp bạn làm việc hiệu quả hơn.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { t: 'Quét Data Thông Minh', d: 'Thu thập thông tin khách hàng tiềm năng cực kỳ nhanh chóng và chính xác.', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
              { t: 'Tự Động Kết Bạn', d: 'Gửi lời mời kết bạn hàng loạt theo danh sách UID, mở rộng tệp khách hàng tự động 100%.', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
              { t: 'Bảo Mật Cao Cấp', d: 'Hệ thống License Key cá nhân hóa, xác thực OTP chống hack tài khoản.', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
              { t: 'Quản Lý Quota Tự Động', d: 'Tự động tính toán số lượt quét mỗi ngày, reset vào 0h đúng chuẩn giờ VN.', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
              { t: 'Trang Quản Lý Trực Quan', d: 'Bảng điều khiển hiện đại giúp bạn theo dõi chi tiết lịch sử và gói dịch vụ.', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
              { t: 'Hỗ Trợ Nhanh Chóng', d: 'Đội ngũ Admin sẵn sàng duyệt đơn và giải đáp thắc mắc ngay qua Zalo.', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' }
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-fha-radius-md bg-fha-surface border border-fha-border hover:border-fha-cyan-border hover:shadow-fha-sm transition-all group">
                <div className="w-12 h-12 rounded-lg bg-fha-surface-2 flex items-center justify-center text-fha-text-muted mb-5 border border-fha-border group-hover:text-fha-cyan group-hover:border-fha-cyan/30 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} /></svg>
                </div>
                <h3 className="text-base font-semibold text-fha-text mb-2">{f.t}</h3>
                <p className="text-fha-text-muted leading-relaxed text-sm">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-fha-surface/30 border-y border-fha-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">4 Bước Bắt Đầu</h2>
          </div>
          <div className="flex flex-col md:flex-row gap-8 relative max-w-5xl mx-auto">
            <div className="hidden md:block absolute top-6 left-[10%] right-[10%] h-px bg-fha-border"></div>
            {[
              { s: '1', t: 'Đăng Ký', d: 'Tạo tài khoản và xác thực email siêu tốc.' },
              { s: '2', t: 'Chọn Gói', d: 'Chọn gói Trial miễn phí hoặc nâng cấp gói Pro.' },
              { s: '3', t: 'Copy Key', d: 'Lấy mã Key bí mật từ Trang Quản Lý.' },
              { s: '4', t: 'Nhập Vào App', d: 'Dán Key vào tiện ích Chrome và quét data ngay!' }
            ].map((step, i) => (
              <div key={i} className="relative z-10 flex-1 flex flex-row md:flex-col items-center md:text-center gap-4 md:gap-0">
                <div className="w-12 h-12 shrink-0 md:mx-auto rounded-full bg-fha-surface border border-fha-border shadow-fha-sm flex items-center justify-center text-lg font-bold text-fha-cyan md:mb-5 font-mono">
                  {step.s}
                </div>
                <div>
                  <h3 className="font-semibold text-base text-fha-text mb-1">{step.t}</h3>
                  <p className="text-fha-text-muted text-sm">{step.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Bảng giá dịch vụ</h2>
            <p className="text-base text-fha-text-muted">Chọn gói phù hợp để bứt phá doanh thu ngay hôm nay.</p>
          </div>
          
          <LandingPricing />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 border-t border-fha-border bg-fha-surface/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white">Câu hỏi thường gặp</h2>
          </div>
          
          <LandingFAQ />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative z-10 border-t border-fha-border overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-fha-cyan/5 pointer-events-none"></div>
        <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl font-bold text-white mb-6">Sẵn sàng bứt phá doanh thu?</h2>
          <p className="text-lg text-fha-text-muted mb-8">Bắt đầu dùng thử miễn phí ngay hôm nay, không cần thẻ tín dụng.</p>
          <Link href={isLoggedIn ? "/dashboard" : "/register"} passHref>
            <Button variant="primary" size="lg">
              {isLoggedIn ? "Vào Trang Quản Lý" : "Đăng ký dùng thử ngay"}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-fha-surface border-t border-fha-border py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-fha-cyan to-purple-600 flex items-center justify-center text-white font-bold text-[10px]">
              FH
            </div>
            <span className="font-semibold text-fha-text text-sm">Fairy House AutoData</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-fha-text-muted">
            <Link href="/terms" className="hover:text-fha-text transition-colors">Điều khoản</Link>
            <Link href="/privacy" className="hover:text-fha-text transition-colors">Bảo mật</Link>
            <a href="https://zalo.me/0378791667" target="_blank" rel="noopener noreferrer" className="text-fha-cyan hover:text-fha-cyan-hover font-medium">
              Hỗ trợ Zalo
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
