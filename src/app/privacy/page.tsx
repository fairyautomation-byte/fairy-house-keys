import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { USER_COOKIE_NAME } from '@/lib/auth';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Chính Sách Bảo Mật — Fairy House AutoData',
  description: 'Chính sách bảo mật thông tin, cam kết 3 KHÔNG về mật khẩu Facebook, bảo mật Local-First và cổng thanh toán PayOS an toàn tại Fairy House AutoData.',
};

export default function PrivacyPage() {
  const cookieStore = cookies();
  const isLoggedIn = cookieStore.has(USER_COOKIE_NAME);

  return (
    <div className="min-h-screen bg-[var(--fha-bg)] text-[var(--fha-text)] font-sans selection:bg-[var(--fha-brand-soft)]">
      <Navbar isLoggedIn={isLoggedIn} />

      <main className="max-w-[860px] mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8">
        {/* Breadcrumb & Header */}
        <div className="space-y-3">
          <nav className="flex items-center gap-2 text-xs text-[var(--fha-text-muted)] font-medium">
            <Link href="/" className="hover:text-[var(--fha-brand)] transition-colors">Trang chủ</Link>
            <span>/</span>
            <span className="text-[var(--fha-text)]">Chính sách bảo mật</span>
          </nav>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--fha-text)] tracking-tight">
            Chính Sách Bảo Mật & Quyền Riêng Tư
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--fha-text-muted)] pt-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--fha-surface-2)] border border-[var(--fha-border)] font-mono">
              Hiệu lực: Tháng 10/2026
            </span>
            <span>•</span>
            <span>Cam kết minh bạch tuyệt đối về dữ liệu người dùng</span>
          </div>
        </div>

        {/* Commitment 3 NOs Box */}
        <div className="rounded-fha border-2 border-[var(--fha-brand)] bg-white p-6 space-y-4 shadow-fha-sm">
          <div className="flex items-center gap-2.5 text-sm font-bold text-[var(--fha-brand)] uppercase tracking-wider">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Cam Kết Vàng: "3 KHÔNG" Đối Với Dữ Liệu Facebook</span>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 pt-1">
            <div className="p-3.5 rounded-fha bg-[var(--fha-surface-2)] border border-[var(--fha-border)] space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--fha-error)]">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <span>KHÔNG Mật Khẩu</span>
              </div>
              <p className="text-xs text-[var(--fha-text-muted)] leading-relaxed">
                Extension không bao giờ yêu cầu hay thu thập mật khẩu tài khoản Facebook cá nhân của bạn.
              </p>
            </div>

            <div className="p-3.5 rounded-fha bg-[var(--fha-surface-2)] border border-[var(--fha-border)] space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--fha-error)]">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <span>KHÔNG Lưu Cookie</span>
              </div>
              <p className="text-xs text-[var(--fha-text-muted)] leading-relaxed">
                Không tải cookie hay token xác thực Facebook lên máy chủ, ngăn chặn rò rỉ phiên đăng nhập.
              </p>
            </div>

            <div className="p-3.5 rounded-fha bg-[var(--fha-surface-2)] border border-[var(--fha-border)] space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--fha-error)]">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <span>KHÔNG Đọc Tin Nhắn</span>
              </div>
              <p className="text-xs text-[var(--fha-text-muted)] leading-relaxed">
                Tuyệt đối không can thiệp, không trích xuất và không đọc tin nhắn, hình ảnh hay dữ liệu mật.
              </p>
            </div>
          </div>
        </div>

        {/* Main Privacy Policy Card */}
        <div className="bg-white rounded-fha border border-[var(--fha-border)] p-6 sm:p-10 space-y-8 text-sm sm:text-base leading-relaxed">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--fha-text)] flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--fha-surface-2)] text-[var(--fha-brand)] border border-[var(--fha-border)]">01</span>
              Kiến trúc bảo mật Local-First (Xử lý trực tiếp tại máy khách)
            </h2>
            <div className="space-y-2 text-sm text-[var(--fha-text-muted)]">
              <p>
                Khác biệt lớn nhất của Fairy House AutoData so với các phần mềm trên thị trường là kiến trúc <strong className="text-[var(--fha-text)]">Local-First</strong>:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>Mọi tác vụ bóc tách danh sách tương tác (like, comment, UID bài viết) diễn ra cục bộ trong trình duyệt Google Chrome trên máy tính của bạn.</li>
                <li>Dữ liệu khách hàng sau khi quét được lưu trực tiếp vào bộ nhớ tạm của tiện ích và cho phép bạn tải thẳng về máy tính dưới dạng tệp Excel/CSV. Hệ thống máy chủ của chúng tôi không sao chép danh sách khách hàng này.</li>
              </ul>
            </div>
          </section>

          <hr className="border-[var(--fha-border)]" />

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--fha-text)] flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--fha-surface-2)] text-[var(--fha-brand)] border border-[var(--fha-border)]">02</span>
              Dữ liệu thu thập trên Website và mục đích sử dụng
            </h2>
            <div className="space-y-2 text-sm text-[var(--fha-text-muted)]">
              <p>
                Khi đăng ký và sử dụng dịch vụ tại website, chúng tôi chỉ thu thập các thông tin tối thiểu cần thiết để phục vụ việc cấp bản quyền:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li><strong className="text-[var(--fha-text)]">Địa chỉ Email:</strong> Dùng để gửi mã OTP xác thực tài khoản, hỗ trợ khôi phục mật khẩu và gửi thông tin License Key đã mua.</li>
                <li><strong className="text-[var(--fha-text)]">Mật khẩu tài khoản:</strong> Được băm mã hóa một chiều trước khi lưu vào hệ thống cơ sở dữ liệu Firebase. Ban quản trị không thể xem được mật khẩu dạng văn bản gốc của bạn.</li>
                <li><strong className="text-[var(--fha-text)]">Dấu vân tay thiết bị (Hardware Fingerprint):</strong> Một chuỗi mã băm vô danh đại diện cho máy tính kích hoạt tiện ích, phục vụ việc giới hạn bản quyền 1 Key/1 Thiết bị.</li>
              </ul>
            </div>
          </section>

          <hr className="border-[var(--fha-border)]" />

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--fha-text)] flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--fha-surface-2)] text-[var(--fha-brand)] border border-[var(--fha-border)]">03</span>
              An toàn giao dịch tài chính với PayOS (VietQR)
            </h2>
            <p className="text-[var(--fha-text-muted)] text-sm leading-relaxed">
              Toàn bộ luồng thanh toán nạp tiền tự động được xử lý thông qua cổng thanh toán trung gian <strong className="text-[var(--fha-text)]">PayOS</strong> được cấp phép theo tiêu chuẩn bảo mật ngân hàng Việt Nam. Fairy House AutoData không yêu cầu, không thu thập và không bao giờ lưu trữ số thẻ tín dụng, mã CVV hay mật khẩu tài khoản ngân hàng của người dùng.
            </p>
          </section>

          <hr className="border-[var(--fha-border)]" />

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--fha-text)] flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--fha-surface-2)] text-[var(--fha-brand)] border border-[var(--fha-border)]">04</span>
              Bảo mật phiên làm việc & Cookie
            </h2>
            <p className="text-[var(--fha-text-muted)] text-sm leading-relaxed">
              Website sử dụng cơ chế JSON Web Token (JWT) được lưu trữ dưới dạng Cookie bảo mật với các cờ kiểm soát nghiêm ngặt (<code className="px-1.5 py-0.5 rounded bg-[var(--fha-surface-2)] font-mono text-xs text-[var(--fha-text)] border border-[var(--fha-border)]">HttpOnly</code>, <code className="px-1.5 py-0.5 rounded bg-[var(--fha-surface-2)] font-mono text-xs text-[var(--fha-text)] border border-[var(--fha-border)]">SameSite=Lax</code>). Điều này giúp bảo vệ phiên làm việc của bạn khỏi các nguy cơ tấn công kịch bản chéo trang (XSS) và giả mạo yêu cầu (CSRF).
            </p>
          </section>

          <hr className="border-[var(--fha-border)]" />

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--fha-text)] flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--fha-surface-2)] text-[var(--fha-brand)] border border-[var(--fha-border)]">05</span>
              Quyền hạn của người dùng đối với dữ liệu cá nhân
            </h2>
            <div className="space-y-2 text-sm text-[var(--fha-text-muted)]">
              <p>
                Bạn có toàn quyền kiểm soát dữ liệu của mình trên hệ thống:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>Xem lại toàn bộ lịch sử nạp tiền, danh sách License Key và thời hạn sử dụng trong Dashboard.</li>
                <li>Đổi mật khẩu tài khoản bất kỳ lúc nào tại mục Cài đặt.</li>
                <li>Yêu cầu xóa vĩnh viễn tài khoản cùng toàn bộ thông tin cá nhân khỏi hệ thống máy chủ bằng cách liên hệ Zalo CSKH.</li>
              </ul>
            </div>
          </section>

          <hr className="border-[var(--fha-border)]" />

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--fha-text)] flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--fha-surface-2)] text-[var(--fha-brand)] border border-[var(--fha-border)]">06</span>
              Cập nhật chính sách & Liên hệ bảo mật
            </h2>
            <p className="text-[var(--fha-text-muted)] text-sm leading-relaxed">
              Chúng tôi có thể cập nhật chính sách này khi có các phiên bản nâng cấp tính năng mới. Mọi cập nhật quan trọng sẽ được thông báo trực tiếp trên thanh ruy-băng thông báo của website. Mọi câu hỏi liên quan đến an toàn thông tin, vui lòng liên hệ:
            </p>
            <div className="p-4 rounded-fha bg-[var(--fha-surface-2)] border border-[var(--fha-border)] text-xs sm:text-sm space-y-1.5 font-medium">
              <div className="flex items-center gap-2">
                <span className="text-[var(--fha-text-muted)]">Phụ trách an toàn bảo mật:</span>
                <span className="text-[var(--fha-text)] font-bold">Ban Kỹ Thuật Fairy House AutoData</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--fha-text-muted)]">Hotline / Zalo:</span>
                <a href="https://zalo.me/0378791667" target="_blank" rel="noopener noreferrer" className="text-[var(--fha-brand)] hover:underline font-bold">
                  0378.791.667
                </a>
              </div>
            </div>
          </section>

        </div>

        {/* Back Link */}
        <div className="text-center pt-4">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-[var(--fha-brand)] hover:underline">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Quay lại trang chủ Fairy House AutoData</span>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
