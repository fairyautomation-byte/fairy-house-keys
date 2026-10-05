'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface ShowcaseItem {
  id: number;
  src: string;
  badge: string;
  badgeColor: string;
  meta: string;
  title: string;
  desc: string;
  points: string[];
}

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: 1,
    src: '/3.jpg',
    badge: 'Kết Quả Thực Chứng',
    badgeColor: 'bg-[var(--fha-success-bg)] text-[var(--fha-success)] border-[var(--fha-success-border)]',
    meta: '30 Quét ➔ 9 SĐT (Tỷ lệ 30%)',
    title: 'Bảng Trích Xuất SĐT Thật Kèm Nút Call & Zalo',
    desc: 'Dữ liệu hiển thị chi tiết tên, UID, giới tính và số điện thoại thật của thành viên nhóm. Cho phép gọi điện trực tiếp, mở chat Zalo hoặc xuất file Excel & UID nhanh chóng.',
    points: ['Đầu số nhà mạng chuẩn 100%', 'Tích hợp nút Call & Zalo 1-click', 'Xuất Excel & danh sách UID']
  },
  {
    id: 2,
    src: '/1.jpg',
    badge: 'Thiết Lập 2 Cú Nhấp',
    badgeColor: 'bg-[var(--fha-brand-soft)] text-[var(--fha-brand)] border-[var(--fha-brand-border)]',
    meta: 'Hỗ trợ 1 – 50.000 khách',
    title: 'Quét Nhanh Hoặc Quét Sâu Theo Vùng Miền & Độ Tuổi',
    desc: 'Thiết lập chiến dịch khai thác mới trực tiếp trên giao diện Facebook. Chọn nhanh chỉ tiêu số lượng và chế độ quét tốc độ cao hoặc lọc sâu tỉnh thành.',
    points: ['Quét nhanh: Tốc độ tối đa', 'Quét sâu: Tra cứu khu vực & tuổi', 'Cài đặt chỉ tiêu linh hoạt']
  },
  {
    id: 3,
    src: '/4.jpg',
    badge: 'Bảo Vệ Tài Khoản',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    meta: 'Delay thông minh: 23s',
    title: 'Auto Kết Bạn Với Terminal Log & Giãn Cách An Toàn',
    desc: 'Tiến trình tự động gửi lời mời kết bạn có bộ đếm thời gian ngẫu nhiên mô phỏng người dùng thật. Màn hình console đen hiển thị chi tiết từng lượt gửi thành công.',
    points: ['Mô phỏng hành vi Human-Emulation', 'Nhật ký Terminal log thời gian thực', 'Triệt tiêu nguy cơ Checkpoint nick']
  },
  {
    id: 4,
    src: '/2.jpg',
    badge: 'Quản Lý Tập Trung',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    meta: 'PayOS VietQR Tự Động 24/7',
    title: 'Bảng Điều Khiển Bản Quyền & Nạp Ví VietQR Tự Động',
    desc: 'Theo dõi hạn mức quét UID mỗi ngày qua thanh pin tiến trình (700/1.000 UID). Quản lý mã License Key độc quyền 1 Key/1 Thiết bị và nạp ví tức thì.',
    points: ['Theo dõi pin hạn mức quét hôm nay', 'Sao chép License Key 1-click', 'Nạp ví tự động qua VietQR trong 5s']
  }
];

export default function RealProductShowcase() {
  const [activeModalItem, setActiveModalItem] = useState<ShowcaseItem | null>(null);

  // Lắng nghe phím ESC để đóng Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeModalItem) {
        setActiveModalItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModalItem]);

  return (
    <section id="features" className="py-16 sm:py-20 bg-white border-b border-[var(--fha-border)]">
      <div className="fha-container-standard">
        
        {/* Tiêu đề Section */}
        <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16 space-y-3">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[var(--fha-brand)] bg-[var(--fha-brand-soft)] border border-[var(--fha-brand-border)] px-3 py-1 rounded-full">
            Chứng Thực Bằng Hình Ảnh Thực Tế
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--fha-text)] tracking-tight">
            Bốn Sức Mạnh Khai Thác Khách Hàng Facebook
          </h2>
          <p className="text-xs sm:text-sm text-[var(--fha-text-muted)] leading-relaxed">
            Giao diện thực tế được chụp trực tiếp từ tiện ích Chrome và Dashboard quản trị bản quyền của khách hàng.
          </p>
        </div>

        {/* Bento Grid 4 Thẻ Bất Đối Xứng */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          
          {/* Card 1: Bảng trích xuất SĐT thật (Chiếm 7/12 cột) - HERO BENTO CARD */}
          <div className="md:col-span-7 bg-[var(--fha-surface)] rounded-fha-lg border border-[var(--fha-border)] hover:border-[var(--fha-brand)] transition-colors p-6 sm:p-7 flex flex-col justify-between shadow-fha-sm group">
            <div className="space-y-3 mb-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${SHOWCASE_ITEMS[0].badgeColor}`}>
                  {SHOWCASE_ITEMS[0].badge}
                </span>
                <span className="text-xs font-mono font-semibold text-[var(--fha-text-muted)]">
                  {SHOWCASE_ITEMS[0].meta}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-[var(--fha-text)] group-hover:text-[var(--fha-brand)] transition-colors">
                {SHOWCASE_ITEMS[0].title}
              </h3>

              <p className="text-xs sm:text-sm text-[var(--fha-text-muted)] leading-relaxed">
                {SHOWCASE_ITEMS[0].desc}
              </p>

              {/* Huy hiệu tính năng nhỏ */}
              <div className="flex flex-wrap gap-2 pt-1">
                {SHOWCASE_ITEMS[0].points.map((pt, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--fha-surface-2)] text-[var(--fha-text)] text-[11px] font-medium border border-[var(--fha-border)]">
                    <svg className="w-3 h-3 text-[var(--fha-success)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    {pt}
                  </span>
                ))}
              </div>
            </div>

            {/* Khung ảnh có nút bấm xem to */}
            <div 
              onClick={() => setActiveModalItem(SHOWCASE_ITEMS[0])}
              className="relative rounded-lg border border-[var(--fha-border)] overflow-hidden bg-neutral-100 aspect-[16/9] cursor-pointer group/img"
            >
              <Image
                src={SHOWCASE_ITEMS[0].src}
                alt={SHOWCASE_ITEMS[0].title}
                fill
                className="object-cover group-hover/img:scale-102 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 60vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/25 flex items-center justify-center transition-colors">
                <span className="opacity-0 group-hover/img:opacity-100 px-3 py-1.5 rounded bg-black/80 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-opacity">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                  Nhấp để phóng to ảnh
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Thiết lập chiến dịch (Chiếm 5/12 cột) */}
          <div className="md:col-span-5 bg-[var(--fha-surface)] rounded-fha-lg border border-[var(--fha-border)] hover:border-[var(--fha-brand)] transition-colors p-6 sm:p-7 flex flex-col justify-between shadow-fha-sm group">
            <div className="space-y-3 mb-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${SHOWCASE_ITEMS[1].badgeColor}`}>
                  {SHOWCASE_ITEMS[1].badge}
                </span>
                <span className="text-xs font-mono font-semibold text-[var(--fha-text-muted)]">
                  {SHOWCASE_ITEMS[1].meta}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-[var(--fha-text)] group-hover:text-[var(--fha-brand)] transition-colors">
                {SHOWCASE_ITEMS[1].title}
              </h3>

              <p className="text-xs sm:text-sm text-[var(--fha-text-muted)] leading-relaxed">
                {SHOWCASE_ITEMS[1].desc}
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {SHOWCASE_ITEMS[1].points.map((pt, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--fha-surface-2)] text-[var(--fha-text)] text-[11px] font-medium border border-[var(--fha-border)]">
                    <svg className="w-3 h-3 text-[var(--fha-success)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    {pt}
                  </span>
                ))}
              </div>
            </div>

            <div 
              onClick={() => setActiveModalItem(SHOWCASE_ITEMS[1])}
              className="relative rounded-lg border border-[var(--fha-border)] overflow-hidden bg-neutral-100 aspect-[16/9] cursor-pointer group/img"
            >
              <Image
                src={SHOWCASE_ITEMS[1].src}
                alt={SHOWCASE_ITEMS[1].title}
                fill
                className="object-cover group-hover/img:scale-102 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/25 flex items-center justify-center transition-colors">
                <span className="opacity-0 group-hover/img:opacity-100 px-3 py-1.5 rounded bg-black/80 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-opacity">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                  Nhấp để phóng to ảnh
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Auto Kết Bạn & Terminal Log (Chiếm 5/12 cột) */}
          <div className="md:col-span-5 bg-[var(--fha-surface)] rounded-fha-lg border border-[var(--fha-border)] hover:border-[var(--fha-brand)] transition-colors p-6 sm:p-7 flex flex-col justify-between shadow-fha-sm group">
            <div className="space-y-3 mb-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${SHOWCASE_ITEMS[2].badgeColor}`}>
                  {SHOWCASE_ITEMS[2].badge}
                </span>
                <span className="text-xs font-mono font-semibold text-[var(--fha-text-muted)]">
                  {SHOWCASE_ITEMS[2].meta}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-[var(--fha-text)] group-hover:text-[var(--fha-brand)] transition-colors">
                {SHOWCASE_ITEMS[2].title}
              </h3>

              <p className="text-xs sm:text-sm text-[var(--fha-text-muted)] leading-relaxed">
                {SHOWCASE_ITEMS[2].desc}
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {SHOWCASE_ITEMS[2].points.map((pt, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--fha-surface-2)] text-[var(--fha-text)] text-[11px] font-medium border border-[var(--fha-border)]">
                    <svg className="w-3 h-3 text-[var(--fha-success)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    {pt}
                  </span>
                ))}
              </div>
            </div>

            <div 
              onClick={() => setActiveModalItem(SHOWCASE_ITEMS[2])}
              className="relative rounded-lg border border-[var(--fha-border)] overflow-hidden bg-neutral-100 aspect-[16/9] cursor-pointer group/img"
            >
              <Image
                src={SHOWCASE_ITEMS[2].src}
                alt={SHOWCASE_ITEMS[2].title}
                fill
                className="object-cover group-hover/img:scale-102 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/25 flex items-center justify-center transition-colors">
                <span className="opacity-0 group-hover/img:opacity-100 px-3 py-1.5 rounded bg-black/80 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-opacity">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                  Nhấp để phóng to ảnh
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Trung tâm Quản trị & Cấp Key PayOS (Chiếm 7/12 cột) */}
          <div className="md:col-span-7 bg-[var(--fha-surface)] rounded-fha-lg border border-[var(--fha-border)] hover:border-[var(--fha-brand)] transition-colors p-6 sm:p-7 flex flex-col justify-between shadow-fha-sm group">
            <div className="space-y-3 mb-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${SHOWCASE_ITEMS[3].badgeColor}`}>
                  {SHOWCASE_ITEMS[3].badge}
                </span>
                <span className="text-xs font-mono font-semibold text-[var(--fha-text-muted)]">
                  {SHOWCASE_ITEMS[3].meta}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-[var(--fha-text)] group-hover:text-[var(--fha-brand)] transition-colors">
                {SHOWCASE_ITEMS[3].title}
              </h3>

              <p className="text-xs sm:text-sm text-[var(--fha-text-muted)] leading-relaxed">
                {SHOWCASE_ITEMS[3].desc}
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {SHOWCASE_ITEMS[3].points.map((pt, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--fha-surface-2)] text-[var(--fha-text)] text-[11px] font-medium border border-[var(--fha-border)]">
                    <svg className="w-3 h-3 text-[var(--fha-success)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    {pt}
                  </span>
                ))}
              </div>
            </div>

            <div 
              onClick={() => setActiveModalItem(SHOWCASE_ITEMS[3])}
              className="relative rounded-lg border border-[var(--fha-border)] overflow-hidden bg-neutral-100 aspect-[16/9] cursor-pointer group/img"
            >
              <Image
                src={SHOWCASE_ITEMS[3].src}
                alt={SHOWCASE_ITEMS[3].title}
                fill
                className="object-cover group-hover/img:scale-102 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 60vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/25 flex items-center justify-center transition-colors">
                <span className="opacity-0 group-hover/img:opacity-100 px-3 py-1.5 rounded bg-black/80 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-opacity">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                  Nhấp để phóng to ảnh
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* LIGHTBOX MODAL PHÓNG TO HÌNH ẢNH CHI TIẾT */}
      {activeModalItem && (
        <div 
          onClick={() => setActiveModalItem(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl bg-white border border-[var(--fha-border-strong)] rounded-fha-lg shadow-fha-overlay overflow-hidden flex flex-col max-h-[95vh]"
          >
            {/* Modal Header */}
            <div className="bg-[var(--fha-surface-2)] border-b border-[var(--fha-border)] px-4 sm:px-6 py-3 flex items-center justify-between">
              <div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border mr-2 ${activeModalItem.badgeColor}`}>
                  {activeModalItem.badge}
                </span>
                <span className="font-bold text-xs sm:text-sm text-[var(--fha-text)]">
                  {activeModalItem.title}
                </span>
              </div>
              <button 
                onClick={() => setActiveModalItem(null)}
                className="w-7 h-7 rounded hover:bg-neutral-200 text-neutral-500 hover:text-black flex items-center justify-center font-bold text-base transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Image Box */}
            <div className="relative aspect-[16/9] w-full bg-neutral-900 overflow-hidden">
              <Image
                src={activeModalItem.src}
                alt={activeModalItem.title}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>

            {/* Modal Footer Description */}
            <div className="p-4 sm:p-5 bg-white border-t border-[var(--fha-border)] space-y-2">
              <p className="text-xs sm:text-sm text-[var(--fha-text-muted)] leading-relaxed">
                {activeModalItem.desc}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {activeModalItem.points.map((pt, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--fha-surface-2)] text-[var(--fha-text)] text-xs font-semibold border border-[var(--fha-border)]">
                    <svg className="w-3.5 h-3.5 text-[var(--fha-success)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    {pt}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
