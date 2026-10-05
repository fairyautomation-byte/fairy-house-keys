'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Button from '../ui/Button';

export default function RoiEstimator() {
  const [dailyScan, setDailyScan] = useState<number>(300);

  // Calculations
  const monthlyScans = dailyScan * 30;
  const hoursSaved = Math.round((dailyScan * 3 * 30) / 60); // Assuming 3 mins per manual search/friend request
  const estimatedOrders = Math.round(monthlyScans * 0.015); // 1.5% conversion rate
  const recommendedPlan = dailyScan <= 100 ? 'Gói 3 Ngày Dùng Thử (0đ)' : dailyScan <= 1000 ? 'Gói 1 Tháng (69.000đ)' : 'Gói 3 Tháng (179.000đ)';
  const recommendedLink = dailyScan <= 100 ? '/register?plan=trial' : dailyScan <= 1000 ? '/register?plan=monthly' : '/register?plan=quarterly';

  return (
    <section id="estimator" className="py-20 bg-white border-b border-[var(--fha-border)]">
      <div className="max-w-[1360px] 2xl:max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[var(--fha-surface-2)] border-2 border-[var(--fha-border)] rounded-fha-lg p-6 sm:p-10 shadow-fha-sm">
          
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--fha-brand)] bg-[var(--fha-brand-soft)] px-3 py-1 rounded">
              Công Cụ Tính Hiệu Quả
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--fha-text)] mt-3 tracking-tight">
              Bạn Cần Bao Nhiêu Khách Hàng Tiềm Năng Mỗi Ngày?
            </h2>
            <p className="text-sm text-[var(--fha-text-muted)] mt-2">
              Kéo thanh trượt để xem thời gian tiết kiệm và số đơn hàng ước tính mà Fairy House AutoData mang lại cho bạn mỗi tháng.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Slider Controller (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white p-4 sm:p-6 rounded-fha border border-[var(--fha-border)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label htmlFor="daily-scan-slider" className="font-bold text-sm text-[var(--fha-text)]">
                    Mục tiêu quét UID khách hàng / ngày:
                  </label>
                  <span className="text-base sm:text-xl font-black font-mono text-[var(--fha-brand)] bg-[var(--fha-brand-soft)] px-3 py-1 rounded border border-[var(--fha-brand)] self-start sm:self-auto">
                    {dailyScan.toLocaleString('vi-VN')} UID/ngày
                  </span>
                </div>

                <input
                  id="daily-scan-slider"
                  type="range"
                  min="50"
                  max="1500"
                  step="50"
                  value={dailyScan}
                  onChange={(e) => setDailyScan(parseInt(e.target.value))}
                  className="w-full h-2.5 bg-[var(--fha-surface-2)] rounded-lg appearance-none cursor-pointer accent-[var(--fha-brand)]"
                />

                <div className="flex justify-between text-xs text-[var(--fha-text-muted)] font-mono">
                  <span>50 UID</span>
                  <span>500 UID</span>
                  <span>1.000 UID</span>
                  <span>1.500 UID</span>
                </div>
              </div>

              {/* Stat breakdown chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white p-3.5 sm:p-4 rounded-fha border border-[var(--fha-border)] flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded bg-[var(--fha-brand-soft)] text-[var(--fha-brand)] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-[var(--fha-text-muted)] truncate">Tiết kiệm thủ công</div>
                    <div className="text-base sm:text-lg font-black text-[var(--fha-text)] font-mono truncate">{hoursSaved} giờ/tháng</div>
                  </div>
                </div>

                <div className="bg-white p-3.5 sm:p-4 rounded-fha border border-[var(--fha-border)] flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded bg-[var(--fha-success-bg)] text-[var(--fha-success)] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-[var(--fha-text-muted)] truncate">Quy mô data tích luỹ</div>
                    <div className="text-base sm:text-lg font-black text-[var(--fha-text)] font-mono truncate">{monthlyScans.toLocaleString('vi-VN')} UID</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: ROI Outcome & CTA Card (5 cols) */}
            <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-fha-lg border-2 border-[var(--fha-border-strong)] shadow-fha-md flex flex-col justify-between h-full">
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fha-text-muted)]">
                  Kết quả dự kiến mỗi tháng
                </span>

                <div>
                  <div className="text-3xl sm:text-4xl font-black text-[var(--fha-text)] tracking-tight">
                    ~{estimatedOrders.toLocaleString('vi-VN')}{' '}
                    <span className="text-base font-semibold text-[var(--fha-text-muted)]">khách chốt đơn</span>
                  </div>
                  <p className="text-xs text-[var(--fha-text-muted)] mt-1">
                    *Giả định tỷ lệ phản hồi & chốt đơn tối thiểu 1.5% từ tệp khách hàng quét đúng nhóm mục tiêu.
                  </p>
                </div>

                <div className="p-3 bg-[var(--fha-surface-2)] rounded border border-[var(--fha-border)]">
                  <div className="text-xs text-[var(--fha-text-muted)]">Đề xuất gói phù hợp nhất:</div>
                  <div className="text-sm font-bold text-[var(--fha-brand)] mt-0.5">{recommendedPlan}</div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-[var(--fha-border)]">
                <Link href={recommendedLink} passHref>
                  <Button variant="primary" fullWidth size="md">
                    Bắt đầu với gói này ngay &rarr;
                  </Button>
                </Link>
                <div className="text-[11px] text-center text-[var(--fha-text-muted)] mt-2">
                  1 Key / 1 Thiết bị • Kích hoạt tự động qua PayOS
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
