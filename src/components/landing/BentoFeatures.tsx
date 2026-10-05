import React from 'react';

export default function BentoFeatures() {
  return (
    <section id="features" className="py-20 sm:py-24 bg-[var(--fha-surface-2)] border-b border-[var(--fha-border)]">
      <div className="max-w-[1360px] 2xl:max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--fha-brand)] bg-[var(--fha-brand-soft)] px-3 py-1 rounded">
            Kiến Trúc Tính Năng V2.0
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[var(--fha-text)] mt-3 tracking-tight">
            Được Thiết Kế Cho Người Bán Hàng Chuyên Nghiệp
          </h2>
          <p className="text-base text-[var(--fha-text-muted)] mt-3">
            Không chỉ là công cụ cào data thông thường. Đây là hệ thống thông minh mô phỏng hành vi người dùng thật, bảo vệ nick Facebook tối đa.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: HERO BENTO (Span 2 cols on desktop) */}
          <div className="lg:col-span-2 bg-white rounded-fha-lg border-2 border-[var(--fha-border-strong)] p-7 sm:p-8 flex flex-col justify-between shadow-fha-sm hover:border-[var(--fha-brand)] transition-colors group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 rounded bg-[var(--fha-success-bg)] text-[var(--fha-success)] text-xs font-bold border border-[var(--fha-success-border)] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[var(--fha-success)] animate-pulse" />
                  Công nghệ độc quyền
                </span>
                <span className="text-xs font-mono text-[var(--fha-text-muted)]">Algorithm 2.0</span>
              </div>

              <h3 className="text-2xl font-bold text-[var(--fha-text)] group-hover:text-[var(--fha-brand)] transition-colors">
                Mô Phỏng Hành Vi Người Thật (Human-Emulation)
              </h3>
              <p className="text-sm text-[var(--fha-text-muted)] mt-2.5 leading-relaxed max-w-xl">
                Cơ chế tự động phân bổ độ trễ thông minh (15s – 45s ngẫu nhiên) cùng giả lập chuyển động cuộn trang. Facebook nhận diện đây là thao tác thủ công của người dùng, <strong className="text-[var(--fha-text)]">triệt tiêu nguy cơ checkpoint hoặc khoá tài khoản</strong>.
              </p>
            </div>

            {/* Visual simulation bar */}
            <div className="mt-8 pt-6 border-t border-[var(--fha-border)] bg-[var(--fha-surface-2)] p-4 rounded-fha border border-[var(--fha-border)] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--fha-text)]">Mức độ an toàn tài khoản</span>
                <span className="font-bold text-[var(--fha-success)] font-mono">99.8% Tối Ưu</span>
              </div>
              <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-[var(--fha-border)]">
                <div className="h-full bg-gradient-to-r from-[var(--fha-brand)] to-[var(--fha-success)] rounded-full w-[98%]" />
              </div>
              <div className="flex justify-between text-[11px] text-[var(--fha-text-muted)] font-mono">
                <span>Trễ ngẫu nhiên: 18 - 32s</span>
                <span>User-Agent: Chrome 124 Native</span>
                <span>Cookie: Session Vault</span>
              </div>
            </div>
          </div>

          {/* Card 2: Bộ lọc khách hàng (1 col) */}
          <div className="bg-white rounded-fha-lg border border-[var(--fha-border)] hover:border-[var(--fha-brand)] p-7 flex flex-col justify-between shadow-fha-sm transition-colors group">
            <div>
              <div className="w-12 h-12 rounded bg-[var(--fha-brand-soft)] text-[var(--fha-brand)] flex items-center justify-center mb-5 border border-[var(--fha-brand)] group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[var(--fha-text)] mb-2 group-hover:text-[var(--fha-brand)] transition-colors">
                Lọc Khách Tiềm Năng Chuẩn
              </h3>
              <p className="text-xs text-[var(--fha-text-muted)] leading-relaxed">
                Tự động bỏ qua nick ảo, nick phụ clone, người không có hoạt động trong 30 ngày. Chỉ giữ lại khách hàng thật có tương tác trong các nhóm mục tiêu.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--fha-border)] flex items-center justify-between text-xs text-[var(--fha-text-muted)]">
              <span>Độ sạch tệp UID</span>
              <span className="font-bold text-[var(--fha-text)] font-mono">&gt; 94%</span>
            </div>
          </div>

          {/* Card 3: Tự động kết bạn (1 col) */}
          <div className="bg-white rounded-fha-lg border border-[var(--fha-border)] hover:border-[var(--fha-brand)] p-7 flex flex-col justify-between shadow-fha-sm transition-colors group">
            <div>
              <div className="w-12 h-12 rounded bg-[var(--fha-brand-soft)] text-[var(--fha-brand)] flex items-center justify-center mb-5 border border-[var(--fha-brand)] group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[var(--fha-text)] mb-2 group-hover:text-[var(--fha-brand)] transition-colors">
                Auto Kết Bạn & Giữ Liên Lạc
              </h3>
              <p className="text-xs text-[var(--fha-text-muted)] leading-relaxed">
                Sau khi quét UID, Extension tự động xếp hàng gửi lời mời kết bạn theo thứ tự an toàn mà bạn không cần phải nhấp chuột hàng trăm lần.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--fha-border)] flex items-center justify-between text-xs text-[var(--fha-text-muted)]">
              <span>Tỷ lệ chấp nhận kết bạn</span>
              <span className="font-bold text-[var(--fha-brand)] font-mono">35% – 50%</span>
            </div>
          </div>

          {/* Card 4: Xuất Excel (Span 2 cols on desktop) */}
          <div className="lg:col-span-2 bg-white rounded-fha-lg border border-[var(--fha-border)] hover:border-[var(--fha-brand)] p-7 flex flex-col justify-between shadow-fha-sm transition-colors group">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--fha-text-muted)]">Tương thích cao</span>
                <h3 className="text-xl font-bold text-[var(--fha-text)] mt-1 group-hover:text-[var(--fha-brand)] transition-colors">
                  Xuất File Excel, CSV Chuẩn Định Dạng CRM
                </h3>
                <p className="text-xs text-[var(--fha-text-muted)] mt-1.5 leading-relaxed max-w-lg">
                  1-Click xuất đầy đủ UID, Tên Facebook, Link trang cá nhân, Nhóm nguồn. Dễ dàng import vào Ladipage, Google Sheets, Lark Base hoặc Facebook Custom Audience.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3 py-1.5 rounded bg-[var(--fha-surface-2)] text-[var(--fha-text)] text-xs font-semibold border border-[var(--fha-border)]">
                  .XLSX
                </span>
                <span className="px-3 py-1.5 rounded bg-[var(--fha-surface-2)] text-[var(--fha-text)] text-xs font-semibold border border-[var(--fha-border)]">
                  .CSV
                </span>
                <span className="px-3 py-1.5 rounded bg-[var(--fha-surface-2)] text-[var(--fha-text)] text-xs font-semibold border border-[var(--fha-border)]">
                  Google Sheet
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--fha-border)] flex items-center justify-between text-xs text-[var(--fha-text-muted)]">
              <span>Bảo mật dữ liệu: Lưu trực tiếp trên trình duyệt cá nhân</span>
              <span className="font-semibold text-[var(--fha-text)]">Không rò rỉ data</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
