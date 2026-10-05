import Link from 'next/link';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { USER_COOKIE_NAME } from '@/lib/auth';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import LiveExtensionPreview from '@/components/landing/LiveExtensionPreview';
import RoiEstimator from '@/components/landing/RoiEstimator';
import BentoFeatures from '@/components/landing/BentoFeatures';
import WorkflowSteps from '@/components/landing/WorkflowSteps';
import AnchorPricing from '@/components/landing/AnchorPricing';
import GroupedFAQ from '@/components/landing/GroupedFAQ';
import Footer from '@/components/layout/Footer';

export default function Home() {
  const cookieStore = cookies();
  const isLoggedIn = cookieStore.has(USER_COOKIE_NAME);

  return (
    <div className="min-h-screen bg-[var(--fha-bg)] text-[var(--fha-text)] font-sans selection:bg-[var(--fha-brand-soft)] overflow-x-hidden relative">
      <Navbar isLoggedIn={isLoggedIn} />

      {/* ======================================================== */}
      {/* SECTION 1: ASYMMETRIC SPLIT HERO                         */}
      {/* ======================================================== */}
      <section className="relative pt-12 pb-20 md:pt-16 md:pb-28 border-b border-[var(--fha-border)] bg-white overflow-hidden">
        {/* Subtle Background Hairline Grid */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-40" 
          style={{ 
            backgroundImage: 'linear-gradient(var(--fha-border) 1px, transparent 1px), linear-gradient(90deg, var(--fha-border) 1px, transparent 1px)', 
            backgroundSize: '48px 48px' 
          }} 
        />
        
        <div className="fha-container-standard relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column (60%): Text & Value Proposition */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--fha-brand-soft)] text-[var(--fha-brand)] text-xs font-bold tracking-wider uppercase border border-[var(--fha-brand)]">
                <span className="w-2 h-2 rounded-full bg-[var(--fha-brand)] animate-pulse" />
                Chrome Extension Thế Hệ Mới V2.0
              </div>

              <h1 className="fha-fluid-hero font-black tracking-tight text-[var(--fha-text)] leading-[1.15]">
                Quét Khách Hàng Facebook Tự Động.{' '}
                <span className="text-[var(--fha-brand)]">
                  Không Lo Checkpoint.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[var(--fha-text-muted)] max-w-xl leading-relaxed">
                Tiết kiệm 85+ giờ tìm kiếm khách hàng thủ công mỗi tháng. Công nghệ <strong className="text-[var(--fha-text)] font-semibold">Human-Emulation 2.0</strong> mô phỏng hành vi người thật, tích hợp thanh toán tự động qua <strong className="text-[var(--fha-text)] font-semibold">PayOS VietQR</strong> cấp Key độc quyền trong 5 giây!
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                <Link href={isLoggedIn ? "/dashboard" : "/register"} passHref>
                  <Button variant="primary" size="lg" className="h-[50px] px-8 text-sm font-bold shadow-fha-sm">
                    {isLoggedIn ? "Vào Trang Quản Lý" : "Dùng Thử Miễn Phí 3 Ngày (0đ)"}
                    <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Button>
                </Link>

                <Link href="#pricing" passHref>
                  <Button variant="outline" size="lg" className="h-[50px] px-7 text-sm font-semibold bg-white hover:bg-[var(--fha-surface-2)]">
                    Xem Bảng Giá Cước
                  </Button>
                </Link>
              </div>

              {/* Trust Footprint */}
              <div className="pt-6 border-t border-[var(--fha-border)] flex flex-wrap items-center gap-6 text-xs text-[var(--fha-text-muted)]">
                <div className="flex items-center gap-1.5 font-medium">
                  <svg className="w-4 h-4 text-[var(--fha-success)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>1 Key / 1 Thiết Bị Độc Quyền</span>
                </div>

                <div className="flex items-center gap-1.5 font-medium">
                  <svg className="w-4 h-4 text-[var(--fha-success)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Kích Hoạt Tức Thì Qua PayOS</span>
                </div>

                <div className="flex items-center gap-1.5 font-medium">
                  <svg className="w-4 h-4 text-[var(--fha-success)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Không Cần Mật Khẩu Facebook</span>
                </div>
              </div>

            </div>

            {/* Right Column (40%): Live Extension Interactive Simulator */}
            <div className="lg:col-span-5 relative w-full overflow-hidden sm:overflow-visible">
              <div className="relative w-full max-w-[500px] mx-auto">
                {/* Decorative background glow - hidden on mobile to prevent horizontal overflow */}
                <div className="hidden sm:block absolute -inset-4 bg-gradient-to-r from-[var(--fha-brand-soft)] to-transparent rounded-2xl opacity-60 blur-xl pointer-events-none" />
                <LiveExtensionPreview />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 2: METRIC & SOCIAL PROOF TICKER                  */}
      {/* ======================================================== */}
      <section className="py-8 bg-[var(--fha-surface-2)] border-b border-[var(--fha-border)]">
        <div className="fha-container-standard">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-black font-mono text-[var(--fha-text)] tracking-tight">15,000+</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--fha-text-muted)] mt-1">UID Đã Quét Mỗi Ngày</div>
            </div>
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-black font-mono text-[var(--fha-success)] tracking-tight">99.8%</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--fha-text-muted)] mt-1">Không Checkpoint Nick</div>
            </div>
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-black font-mono text-[var(--fha-brand)] tracking-tight">5 Giây</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--fha-text-muted)] mt-1">Duyệt Đơn PayOS Tự Động</div>
            </div>
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-black font-mono text-[var(--fha-text)] tracking-tight">24/7</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--fha-text-muted)] mt-1">Hỗ Trợ Kỹ Thuật Zalo</div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 3: INTERACTIVE ROI & LEAD ESTIMATOR               */}
      {/* ======================================================== */}
      <RoiEstimator />

      {/* ======================================================== */}
      {/* SECTION 4: ASYMMETRIC BENTO FEATURE GRID                 */}
      {/* ======================================================== */}
      <BentoFeatures />

      {/* ======================================================== */}
      {/* SECTION 5: 3-STEP VISUAL WORKFLOW ONBOARDING             */}
      {/* ======================================================== */}
      <WorkflowSteps />

      {/* ======================================================== */}
      {/* SECTION 6: VALUE-ANCHORED PRICING MATRIX                 */}
      {/* ======================================================== */}
      <AnchorPricing />

      {/* ======================================================== */}
      {/* SECTION 7: GROUPED ACCORDION FAQ                         */}
      {/* ======================================================== */}
      <GroupedFAQ />

      {/* ======================================================== */}
      {/* SECTION 8: HIGH-CONVERTING SPLIT FINAL CTA               */}
      {/* ======================================================== */}
      <section className="py-16 sm:py-20 bg-white border-t border-[var(--fha-border)]">
        <div className="fha-container-standard">
          <div className="bg-[var(--fha-surface-2)] rounded-fha-lg border-2 border-[var(--fha-border-strong)] p-8 sm:p-12 shadow-fha-sm">
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-8 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fha-brand)] bg-[var(--fha-brand-soft)] px-2.5 py-1 rounded">
                  Bắt Đầu Ngay Hôm Nay
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-[var(--fha-text)] tracking-tight">
                  Sẵn Sàng Nhân Đôi Doanh Số Bán Hàng Online Của Bạn?
                </h2>
                <p className="text-sm text-[var(--fha-text-muted)] leading-relaxed max-w-xl">
                  Trải nghiệm đầy đủ sức mạnh quét data tự động với gói dùng thử 3 Ngày hoàn toàn miễn phí. Kích hoạt tức thì, không rủi ro.
                </p>
              </div>

              <div className="lg:col-span-4 flex flex-col gap-3">
                <Link href={isLoggedIn ? "/dashboard" : "/register"} passHref>
                  <Button variant="primary" fullWidth size="lg" className="h-[48px] text-sm font-bold">
                    {isLoggedIn ? "Vào Trang Quản Lý" : "Tạo Tài Khoản & Nhận Key (0đ)"}
                  </Button>
                </Link>
                <a
                  href="https://zalo.me/0378791667"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-[var(--fha-text)] hover:text-[var(--fha-brand)] rounded border border-[var(--fha-border)] bg-white hover:bg-[var(--fha-surface-2)] transition-colors"
                >
                  <svg className="w-4 h-4 text-[#0068ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Chat Kỹ Thuật Viên Zalo 24/7</span>
                </a>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 9: MODERN SEMANTIC FOOTER                        */}
      {/* ======================================================== */}
      <Footer />
    </div>
  );
}
