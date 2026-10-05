import React from 'react';
import Link from 'next/link';

export default function WorkflowSteps() {
  const steps = [
    {
      num: '01',
      title: 'Nhận Key Tức Thì Qua PayOS',
      desc: 'Đăng ký tài khoản trong 30 giây. Quét mã VietQR chuyển khoản, hệ thống PayOS tự động xác thực và kích hoạt Key bản quyền ngay trên màn hình.',
      badge: 'Tự động 100%'
    },
    {
      num: '02',
      title: 'Cài Đặt Tiện Ích Vào Chrome',
      desc: 'Tải bộ cài tiện ích đã đóng gói, bật chế độ Nhà phát triển trên Chrome/Cốc Cốc/Brave/Edge. Mở Extension và dán Key bản quyền để liên kết thiết bị.',
      badge: '1 Key / 1 Thiết bị'
    },
    {
      num: '03',
      title: 'Mở Nhóm & Bắt Đầu Quét Data',
      desc: 'Truy cập bất kỳ Hội Nhóm Facebook mục tiêu nào, nhấn nút "Bắt đầu quét". Extension sẽ tự động trích xuất danh sách khách hàng và gửi kết bạn an toàn.',
      badge: 'Chống checkpoint 2.0'
    }
  ];

  return (
    <section id="workflow" className="py-20 sm:py-24 3xl:py-28 bg-white border-b border-[var(--fha-border)]">
      <div className="fha-container-standard">
        
        <div className="max-w-2xl 3xl:max-w-3xl mx-auto text-center mb-16 3xl:mb-20">
          <span className="text-[11px] 3xl:text-xs font-bold uppercase tracking-widest text-[var(--fha-brand)] bg-[var(--fha-brand-soft)] px-3 py-1 rounded">
            Lộ Trình Bắt Đầu
          </span>
          <h2 className="text-3xl sm:text-4xl 3xl:text-5xl font-black text-[var(--fha-text)] mt-3 tracking-tight">
            Chỉ 3 Bước Để Làm Chủ Tệp Khách Hàng Tiềm Năng
          </h2>
          <p className="text-base 3xl:text-lg text-[var(--fha-text-muted)] mt-3">
            Toàn bộ quy trình từ thanh toán tới sử dụng được tối ưu hóa tối đa, không cần cài đặt phần mềm nặng máy hay cấu hình phức tạp.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 3xl:gap-12 relative">
          
          {/* Connector line for desktop */}
          <div className="hidden md:block absolute top-1/4 left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-[var(--fha-border)] via-[var(--fha-brand)] to-[var(--fha-border)] z-0" />

          {steps.map((step, idx) => (
            <div 
              key={idx} 
              className="relative z-10 bg-white rounded-fha-lg border-2 border-[var(--fha-border-strong)] p-7 sm:p-8 flex flex-col justify-between shadow-fha-sm hover:border-[var(--fha-brand)] hover:shadow-fha-md transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-fha bg-[var(--fha-surface-2)] border-2 border-[var(--fha-border-strong)] text-[var(--fha-text)] flex items-center justify-center font-black font-mono text-xl group-hover:bg-[var(--fha-brand)] group-hover:text-white group-hover:border-[var(--fha-brand)] transition-colors">
                    {step.num}
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[var(--fha-brand-soft)] text-[var(--fha-brand)] text-[11px] font-bold uppercase tracking-wider">
                    {step.badge}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-[var(--fha-text)] group-hover:text-[var(--fha-brand)] transition-colors">
                  {step.title}
                </h3>
                <p className="text-sm text-[var(--fha-text-muted)] mt-3 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--fha-border)] text-xs text-[var(--fha-text-muted)] flex items-center gap-1.5 font-medium">
                <svg className="w-4 h-4 text-[var(--fha-success)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Hỗ trợ hướng dẫn video 1:1 qua Zalo</span>
              </div>
            </div>
          ))}

        </div>

        <div className="mt-12 text-center">
          <Link 
            href="/activate" 
            className="inline-flex items-center gap-2 text-sm font-bold text-[var(--fha-brand)] hover:underline"
          >
            <span>Xem tài liệu hướng dẫn kích hoạt chi tiết</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>

      </div>
    </section>
  );
}
