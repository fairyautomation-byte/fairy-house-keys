import Link from 'next/link';
import Image from 'next/image';

export default function ActivatePage() {
  return (
    <div className="min-h-screen bg-[var(--fha-bg)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-3 relative z-10 hover:opacity-80 transition-opacity">
        <Image src="/logo.png" alt="Logo" width={40} height={40} className="rounded" />
        <span className="font-bold text-xl tracking-tight text-[var(--fha-text)]">
          Fairy House <span className="text-[var(--fha-brand)]">AutoData</span>
        </span>
      </Link>

      <div className="w-full max-w-[480px] bg-white rounded-fha-lg border border-[var(--fha-border)] overflow-hidden shadow-sm relative z-10">
        <div className="p-8 sm:p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-[var(--fha-success-soft)] flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-[var(--fha-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-[22px] font-bold text-[var(--fha-text)] mb-2">Đã Gửi Đơn Thành Công!</h1>
          <p className="text-[var(--fha-text-muted)] text-[14px] mb-8 leading-relaxed">
            Chúng tôi đã nhận được thông tin đăng ký của bạn.<br />
            Nếu bạn thanh toán qua PayOS tự động, key sẽ được cấp ngay trong Dashboard. Nếu bạn chuyển khoản thủ công, vui lòng gửi biên lai Zalo để được duyệt.
          </p>

          <div className="bg-[var(--fha-surface-2)] rounded-fha p-5 mb-8 text-left space-y-4 border border-[var(--fha-border-strong)]">
            <p className="text-[14px] font-bold text-[var(--fha-text)]">Sau khi nhận key, làm theo các bước sau:</p>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded bg-white text-[var(--fha-text)] flex items-center justify-center text-[12px] font-bold border border-[var(--fha-border-strong)]">1</span>
              <span className="text-[var(--fha-text-muted)] text-[14px]">Mở Extension <strong className="text-[var(--fha-text)]">Fairy House AutoData</strong> trên Chrome</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded bg-white text-[var(--fha-text)] flex items-center justify-center text-[12px] font-bold border border-[var(--fha-border-strong)]">2</span>
              <span className="text-[var(--fha-text-muted)] text-[14px]">Vào tab <strong className="text-[var(--fha-text)]">"License Key"</strong></span>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded bg-white text-[var(--fha-text)] flex items-center justify-center text-[12px] font-bold border border-[var(--fha-border-strong)]">3</span>
              <span className="text-[var(--fha-text-muted)] text-[14px]">Dán key và bấm <strong className="text-[var(--fha-text)]">"Kích hoạt"</strong></span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/dashboard"
              className="inline-flex w-full items-center justify-center gap-2 px-6 py-3.5 rounded-fha bg-[var(--fha-brand)] text-white font-bold hover:bg-[var(--fha-brand-hover)] transition-colors text-[14px]"
            >
              Về Trang Quản Lý
            </Link>
            <a
              href="https://zalo.me/0378791667"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 px-6 py-3.5 rounded-fha bg-white text-[var(--fha-text)] font-semibold hover:bg-[var(--fha-surface-2)] border border-[var(--fha-border-strong)] transition-colors text-[14px]"
            >
              <svg className="w-4 h-4 text-[#0068ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Liên hệ Zalo hỗ trợ</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
