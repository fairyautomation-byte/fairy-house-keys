import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';

export default function ActivatePage() {
  return (
    <div className="min-h-screen bg-[var(--fha-surface-2)] py-12 px-4 sm:px-6 font-sans">
      <div className="max-w-[860px] mx-auto space-y-8">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)] rounded p-1">
            <Image src="/logo.png" alt="Logo" width={40} height={40} className="rounded" />
            <span className="font-bold text-lg tracking-tight text-[var(--fha-text)]">
              Fairy House <span className="text-[var(--fha-brand)]">AutoData</span>
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--fha-text)] tracking-tight">
            Hướng Dẫn Cài Đặt & Kích Hoạt Extension
          </h1>
          <p className="text-xs sm:text-sm text-[var(--fha-text-muted)] max-w-lg mx-auto">
            Chỉ mất 2 phút để cài đặt tiện ích vào trình duyệt Chrome và liên kết License Key bản quyền của bạn.
          </p>
        </div>

        {/* 3 Step Visual Guide Container */}
        <div className="bg-white rounded-fha-lg border-2 border-[var(--fha-border-strong)] p-6 sm:p-10 shadow-fha-sm space-y-8">
          
          {/* Step 1 */}
          <div className="flex flex-col sm:flex-row items-start gap-5 pb-8 border-b border-[var(--fha-border)]">
            <div className="w-10 h-10 rounded-fha bg-[var(--fha-brand-soft)] border-2 border-[var(--fha-brand)] text-[var(--fha-brand)] flex items-center justify-center font-black font-mono text-base shrink-0">
              01
            </div>
            <div className="space-y-3 flex-1">
              <div>
                <h2 className="text-base font-bold text-[var(--fha-text)]">
                  Tải Về Bộ Cài Đặt Extension (.ZIP)
                </h2>
                <p className="text-xs text-[var(--fha-text-muted)] mt-1 leading-relaxed">
                  Tải tệp nén mới nhất (Phiên bản V2.0 tối ưu chống checkpoint Facebook 2026). Sau khi tải về, hãy giải nén tệp zip này ra một thư mục trên máy tính của bạn.
                </p>
              </div>

              <div>
                <a
                  href="/fairy-house-extension-v2.zip"
                  download
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-fha bg-[var(--fha-surface-2)] text-[var(--fha-text)] hover:bg-[var(--fha-brand-soft)] hover:text-[var(--fha-brand)] border border-[var(--fha-border-strong)] text-xs font-bold transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4 text-[var(--fha-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Tải Bộ Cài (.ZIP) Ngay</span>
                  <span className="text-[10px] text-[var(--fha-text-muted)] font-mono ml-1">v2.0.4 Native</span>
                </a>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col sm:flex-row items-start gap-5 pb-8 border-b border-[var(--fha-border)]">
            <div className="w-10 h-10 rounded-fha bg-[var(--fha-brand-soft)] border-2 border-[var(--fha-brand)] text-[var(--fha-brand)] flex items-center justify-center font-black font-mono text-base shrink-0">
              02
            </div>
            <div className="space-y-3 flex-1">
              <div>
                <h2 className="text-base font-bold text-[var(--fha-text)]">
                  Bật Developer Mode & Cài Đặt Vào Trình Duyệt
                </h2>
                <p className="text-xs text-[var(--fha-text-muted)] mt-1 leading-relaxed">
                  Mở trình duyệt Google Chrome, Cốc Cốc, Brave hoặc Microsoft Edge:
                </p>
              </div>

              <div className="bg-[var(--fha-surface-2)] p-4 rounded-fha border border-[var(--fha-border)] text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--fha-brand)]" />
                  <span>Truy cập đường dẫn: <code className="bg-white px-2 py-0.5 rounded border border-[var(--fha-border)] font-mono font-bold text-[var(--fha-brand)]">chrome://extensions</code></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--fha-brand)]" />
                  <span>Gạt bật công tắc <strong>&quot;Chế độ dành cho nhà phát triển&quot; (Developer mode)</strong> ở góc trên bên phải.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--fha-brand)]" />
                  <span>Bấm nút <strong>&quot;Tải tiện ích đã giải nén&quot; (Load unpacked)</strong> và chọn thư mục bạn vừa giải nén ở Bước 1.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="w-10 h-10 rounded-fha bg-[var(--fha-brand-soft)] border-2 border-[var(--fha-brand)] text-[var(--fha-brand)] flex items-center justify-center font-black font-mono text-base shrink-0">
              03
            </div>
            <div className="space-y-3 flex-1">
              <div>
                <h2 className="text-base font-bold text-[var(--fha-text)]">
                  Dán License Key & Kích Hoạt Bản Quyền
                </h2>
                <p className="text-xs text-[var(--fha-text-muted)] mt-1 leading-relaxed">
                  Nhấp vào biểu tượng Extension Fairy House AutoData trên thanh công cụ, mở tab <strong>&quot;Kích Hoạt Key&quot;</strong>, dán mã Key của bạn vào và nhấn <strong>&quot;Kích hoạt&quot;</strong>.
                </p>
              </div>

              <div className="p-4 bg-[var(--fha-surface-2)] rounded-fha border border-[var(--fha-border)] flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-semibold text-[var(--fha-text)]">Chưa lấy mã License Key?</div>
                  <div className="text-[11px] text-[var(--fha-text-muted)]">Key bản quyền của bạn được lưu trữ an toàn trong Dashboard.</div>
                </div>

                <Link href="/dashboard/licenses" passHref>
                  <Button variant="primary" size="sm" className="font-bold text-xs whitespace-nowrap">
                    Lấy Key Của Tôi &rarr;
                  </Button>
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* Support Footprint */}
        <div className="p-6 bg-white rounded-fha-lg border border-[var(--fha-border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shadow-fha-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#e8f1ff] text-[#0068ff] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-[var(--fha-text)]">Cần hỗ trợ cài đặt từ xa qua Ultraview?</div>
              <div className="text-[11px] text-[var(--fha-text-muted)]">Kỹ thuật viên sẽ hỗ trợ cài đặt và kích hoạt trực tiếp trong 5 phút.</div>
            </div>
          </div>

          <a
            href="https://zalo.me/0378791667"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-fha bg-[#0068ff] text-white font-bold text-xs hover:bg-[#0052cc] transition-colors"
          >
            Chat Zalo Hỗ Trợ 24/7
          </a>
        </div>

      </div>
    </div>
  );
}
