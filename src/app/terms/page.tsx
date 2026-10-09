import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { USER_COOKIE_NAME } from '@/lib/auth';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Điều Khoản Dịch Vụ — Fairy House AutoData',
  description: 'Quy định điều khoản dịch vụ, chính sách bản quyền License Key 1 máy, bảo hành 1 đổi 1 và hoàn tiền trong 24h tại Fairy House AutoData.',
};

export default async function TermsPage() {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has(USER_COOKIE_NAME);

  return (
    <div className="min-h-screen bg-[var(--fha-bg)] text-[var(--fha-text)] font-sans selection:bg-[var(--fha-brand-soft)]">
      <Navbar isLoggedIn={isLoggedIn} />

      <main className="fha-container-standard py-10 sm:py-16">
        <div className="max-w-4xl 3xl:max-w-5xl mx-auto space-y-8">
        {/* Breadcrumb & Header */}
        <div className="space-y-3">
          <nav className="flex items-center gap-2 text-xs text-[var(--fha-text-muted)] font-medium">
            <Link href="/" className="hover:text-[var(--fha-brand)] transition-colors">Trang chủ</Link>
            <span>/</span>
            <span className="text-[var(--fha-text)]">Điều khoản dịch vụ</span>
          </nav>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--fha-text)] tracking-tight">
            Điều Khoản Sử Dụng Dịch Vụ
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--fha-text-muted)] pt-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--fha-surface-2)] border border-[var(--fha-border)] font-mono">
              Hiệu lực: Tháng 10/2026
            </span>
            <span>•</span>
            <span>Áp dụng cho mọi giao dịch và tài khoản trên hệ thống</span>
          </div>
        </div>

        {/* Commitment Highlight Box */}
        <div className="rounded-fha border border-[var(--fha-brand-soft-border)] bg-[var(--fha-brand-soft)] p-5 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--fha-brand)]">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Cam kết dịch vụ minh bạch từ Fairy House AutoData</span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--fha-brand)] leading-relaxed opacity-95">
            Chúng tôi cam kết cung cấp phần mềm tiện ích Chrome Extension hoạt động ổn định, bảo vệ quyền sở hữu khóa bản quyền cá nhân, cam kết bảo hành 1 đổi 1 và hoàn tiền trong vòng 24 giờ nếu phát sinh lỗi kỹ thuật từ máy chủ xác thực.
          </p>
        </div>

        {/* Main Terms Content Card */}
        <div className="bg-white rounded-fha border border-[var(--fha-border)] p-6 sm:p-10 space-y-8 text-sm sm:text-base leading-relaxed">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--fha-text)] flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--fha-surface-2)] text-[var(--fha-brand)] border border-[var(--fha-border)]">01</span>
              Quy định chung & Phạm vi áp dụng
            </h2>
            <p className="text-[var(--fha-text-muted)] text-sm leading-relaxed">
              Bằng việc truy cập website, đăng ký tài khoản, nạp tiền vào ví hoặc mua License Key, bạn xác nhận đã đọc, hiểu và đồng ý hoàn toàn với các điều khoản này. Nếu không đồng ý với bất kỳ điều khoản nào, vui lòng ngừng sử dụng dịch vụ và không kích hoạt tiện ích.
            </p>
          </section>

          <hr className="border-[var(--fha-border)]" />

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--fha-text)] flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--fha-surface-2)] text-[var(--fha-brand)] border border-[var(--fha-border)]">02</span>
              Chính sách License Key & Khóa thiết bị (Hardware Binding)
            </h2>
            <div className="space-y-2 text-sm text-[var(--fha-text-muted)]">
              <p>
                Để bảo vệ quyền lợi người mua chính hãng và chống phân phối lậu, mỗi License Key được tạo theo định dạng chuẩn <code className="px-1.5 py-0.5 rounded bg-[var(--fha-surface-2)] font-mono text-xs text-[var(--fha-text)] border border-[var(--fha-border)]">FHAD-XXXX-XXXX-XXXX-XXXX</code> và tuân theo nguyên tắc:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li><strong className="text-[var(--fha-text)]">Ràng buộc 1 Key / 1 Thiết bị:</strong> Key sau khi kích hoạt lần đầu trên Chrome Extension sẽ được khóa chặt chẽ với dấu vân tay phần cứng (Hardware Fingerprint) của máy đó.</li>
                <li><strong className="text-[var(--fha-text)]">Không chia sẻ công khai:</strong> Việc chia sẻ Key cho người khác dẫn đến việc kích hoạt trên máy thứ hai sẽ bị hệ thống tự động khóa bảo vệ vĩnh viễn mà không hoàn tiền.</li>
                <li><strong className="text-[var(--fha-text)]">Đổi máy (Cài lại Win / Thay máy mới):</strong> Khách hàng được hỗ trợ reset thiết bị 01 lần/tháng qua kênh Zalo CSKH chính thức bằng cách xác minh email đăng ký ban đầu.</li>
              </ul>
            </div>
          </section>

          <hr className="border-[var(--fha-border)]" />

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--fha-text)] flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--fha-surface-2)] text-[var(--fha-brand)] border border-[var(--fha-border)]">03</span>
              Thanh toán & Cấp phát Key tự động qua PayOS
            </h2>
            <div className="space-y-2 text-sm text-[var(--fha-text-muted)]">
              <p>
                Website tích hợp cổng thanh toán trực tuyến tự động qua <strong className="text-[var(--fha-text)]">PayOS (chuẩn VietQR Napas247)</strong>:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>Giao dịch nạp ví hoặc mua key qua PayOS được xử lý tự động 24/7 và xác nhận trong vòng 3 đến 10 giây sau khi chuyển khoản thành công.</li>
                <li>Khách hàng có trách nhiệm quét đúng mã QR hoặc nhập chính xác nội dung chuyển khoản do hệ thống sinh ra. Trong trường hợp nhập sai mã nạp, vui lòng liên hệ Zalo kỹ thuật kèm biên lai ngân hàng để được hỗ trợ cộng thủ công trong vòng 15 phút.</li>
              </ul>
            </div>
          </section>

          <hr className="border-[var(--fha-border)]" />

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--fha-text)] flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--fha-surface-2)] text-[var(--fha-brand)] border border-[var(--fha-border)]">04</span>
              Chính sách Bảo hành & Hoàn tiền (Refund Policy)
            </h2>
            <div className="space-y-2 text-sm text-[var(--fha-text-muted)]">
              <p>
                Chúng tôi cung cấp chính sách bảo vệ khách hàng vượt trội:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li><strong className="text-[var(--fha-text)]">Dùng thử 3 ngày miễn phí (0đ):</strong> Mỗi tài khoản đăng ký mới đều được cấp 100 lượt scan/ngày trong 3 ngày để kiểm tra độ tương thích trước khi trả phí.</li>
                <li><strong className="text-[var(--fha-text)]">Hoàn tiền 100% trong 24 giờ:</strong> Nếu sau khi thanh toán mua Key mà tiện ích không thể kích hoạt trên máy bạn do lỗi từ hệ thống Fairy House AutoData, bạn sẽ được hoàn tiền 100% không phát sinh phí.</li>
                <li><strong className="text-[var(--fha-text)]">Bảo hành suốt thời gian gói cước:</strong> Đảm bảo hệ thống máy chủ xác thực hoạt động liên tục (Uptime 99.8%). Mọi sự cố máy chủ gián đoạn quá 12h sẽ được tự động cộng thêm số ngày bù tương ứng vào hạn dùng của Key.</li>
              </ul>
            </div>
          </section>

          <hr className="border-[var(--fha-border)]" />

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--fha-text)] flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--fha-surface-2)] text-[var(--fha-brand)] border border-[var(--fha-border)]">05</span>
              Trách nhiệm người dùng & Khuyến nghị vận hành an toàn
            </h2>
            <div className="space-y-2 text-sm text-[var(--fha-text-muted)]">
              <p>
                Fairy House AutoData cung cấp công cụ tự động hóa hỗ trợ marketing, tuy nhiên người dùng cần chủ động tuân thủ nguyên tắc vận hành:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>Không sử dụng công cụ vào các mục đích vi phạm pháp luật, quấy rối, lừa đảo hoặc phát tán nội dung độc hại trên mạng xã hội.</li>
                <li>Tuân thủ khuyến cáo về thời gian chờ giãn cách (Delay 15-30 giây giữa các lượt kết bạn) để duy trì sức khỏe tài khoản Facebook tốt nhất.</li>
                <li>Tự bảo mật tài khoản website và khóa bản quyền cá nhân, không chia sẻ mật khẩu hay OTP cho bất kỳ ai.</li>
              </ul>
            </div>
          </section>

          <hr className="border-[var(--fha-border)]" />

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--fha-text)] flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--fha-surface-2)] text-[var(--fha-brand)] border border-[var(--fha-border)]">06</span>
              Miễn trừ trách nhiệm bên thứ ba (Facebook / Meta)
            </h2>
            <p className="text-[var(--fha-text-muted)] text-sm leading-relaxed">
              Fairy House AutoData là một sản phẩm phần mềm độc lập, không trực thuộc và không có mối quan hệ ủy quyền trực tiếp với Tập đoàn Meta (Facebook). Chúng tôi liên tục cập nhật Extension để tương thích với các thay đổi giao diện từ Facebook, nhưng không chịu trách nhiệm trong các trường hợp tài khoản người dùng bị hạn chế tính năng do vi phạm tiêu chuẩn cộng đồng của Facebook từ trước hoặc do người dùng cố tình gửi lời mời kết bạn ồ ạt vượt quá ngưỡng an toàn khuyến nghị.
            </p>
          </section>

          <hr className="border-[var(--fha-border)]" />

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--fha-text)] flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--fha-surface-2)] text-[var(--fha-brand)] border border-[var(--fha-border)]">07</span>
              Kênh liên hệ & Giải quyết tranh chấp
            </h2>
            <p className="text-[var(--fha-text-muted)] text-sm leading-relaxed">
              Mọi thắc mắc, yêu cầu bảo hành hoặc khiếu nại chất lượng dịch vụ xin vui lòng gửi về kênh hỗ trợ chính thức:
            </p>
            <div className="p-4 rounded-fha bg-[var(--fha-surface-2)] border border-[var(--fha-border)] text-xs sm:text-sm space-y-1.5 font-medium">
              <div className="flex items-center gap-2">
                <span className="text-[var(--fha-text-muted)]">Hotline / Zalo kỹ thuật:</span>
                <a href="https://zalo.me/0378791667" target="_blank" rel="noopener noreferrer" className="text-[var(--fha-brand)] hover:underline font-bold">
                  0378.791.667 (Hỗ trợ 24/7)
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--fha-text-muted)]">Website chính thức:</span>
                <a href="https://www.fairyautomation.io.vn" className="text-[var(--fha-brand)] hover:underline font-bold">
                  https://www.fairyautomation.io.vn
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
        </div>
      </main>

      <Footer />
    </div>
  );
}
