'use client';
import React, { useState } from 'react';

type FAQCategory = 'license' | 'tech' | 'payment';

interface FAQItem {
  q: string;
  a: string;
  category: FAQCategory;
}

const FAQS: FAQItem[] = [
  // License & Thiết bị
  {
    category: 'license',
    q: '1 License Key có thể dùng cùng lúc trên nhiều máy tính không?',
    a: 'Không. Để đảm bảo tính ổn định và bảo mật cao nhất, mỗi License Key được mã hoá gắn liền với mã định danh phần cứng (Hardware ID) của đúng 1 thiết bị. Nếu bạn có nhu cầu cho nhiều nhân viên, vui lòng mua số lượng Key tương ứng.'
  },
  {
    category: 'license',
    q: 'Nếu tôi đổi máy tính mới hoặc cài lại Win thì có được chuyển Key không?',
    a: 'Có. Chúng tôi hỗ trợ reset định danh phần cứng 1 lần/tháng miễn phí. Bạn chỉ cần liên hệ Zalo hỗ trợ kỹ thuật kèm thông tin tài khoản để được kỹ thuật viên hỗ trợ chuyển máy nhanh chóng.'
  },
  {
    category: 'license',
    q: 'Gói dùng thử 3 Ngày có yêu cầu nhập thẻ tín dụng Visa/Mastercard không?',
    a: 'Hoàn toàn không. Gói dùng thử 3 Ngày kích hoạt miễn phí 100% (0đ) ngay sau khi đăng ký tài khoản và xác thực email, không phát sinh bất kỳ chi phí ẩn nào.'
  },

  // Kỹ thuật & Checkpoint
  {
    category: 'tech',
    q: 'Sử dụng Extension có cần nhập mật khẩu (Password) nick Facebook không?',
    a: 'Tuyệt đối KHÔNG. Fairy House AutoData hoạt động trực tiếp trên phiên đăng nhập hiện tại của trình duyệt Chrome thông qua Cookie nội bộ. Chúng tôi không bao giờ yêu cầu hay lưu trữ mật khẩu tài khoản của bạn.'
  },
  {
    category: 'tech',
    q: 'Cơ chế Human-Emulation 2.0 chống khoá nick Facebook hoạt động như thế nào?',
    a: 'Hệ thống tự động chèn các khoảng nghỉ ngẫu nhiên (15s - 45s) giữa các lần quét và tự động mô phỏng thao tác cuộn trang của người dùng thật. Điều này khiến thuật toán bảo mật của Facebook xem đây là thao tác thủ công, tránh triệt để tình trạng checkpoint.'
  },
  {
    category: 'tech',
    q: 'Hạn mức quét (Quota) mỗi ngày được làm mới vào khung giờ nào?',
    a: 'Hệ thống tự động thiết lập lại 100% hạn mức số lượt quét mỗi ngày vào đúng 00:00 (giờ Việt Nam). Bạn có thể theo dõi tỷ lệ tiêu thụ quota trực tiếp trên Dashboard hoặc popup Extension.'
  },

  // Thanh toán & Kích hoạt
  {
    category: 'payment',
    q: 'Thanh toán qua cổng PayOS diễn ra như thế nào và bao lâu thì nhận được Key?',
    a: 'Sau khi chọn gói cước, hệ thống tạo mã VietQR động chính xác theo số tiền và mã giao dịch. Bạn mở app ngân hàng quét mã chuyển khoản. Hệ thống PayOS nhận diện và tự động duyệt đơn cấp Key trên màn hình trong vòng 3 đến 5 giây.'
  },
  {
    category: 'payment',
    q: 'Tôi có thể nạp tiền trước vào ví rồi mua Key sau được không?',
    a: 'Hoàn toàn được. Trong mục "Ví & Nạp Tiền", bạn có thể nạp số dư bất kỳ lúc nào qua PayOS. Khi có tiền trong ví, bạn có thể mua hoặc gia hạn bất kỳ gói cước nào với 1 click duy nhất.'
  }
];

export default function GroupedFAQ() {
  const [activeCategory, setActiveCategory] = useState<FAQCategory>('license');
  const [openIndices, setOpenIndices] = useState<Record<number, boolean>>({ 0: true });

  const filteredFaqs = FAQS.filter(f => f.category === activeCategory);

  const toggleIndex = (index: number) => {
    setOpenIndices(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <section id="faq" className="py-20 sm:py-24 3xl:py-28 bg-[var(--fha-surface-2)] border-b border-[var(--fha-border)]">
      <div className="fha-container-standard">
        <div className="max-w-4xl 3xl:max-w-5xl mx-auto">
        
        {/* Heading */}
        <div className="text-center mb-12">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--fha-brand)] bg-[var(--fha-brand-soft)] px-3 py-1 rounded">
            Giải Đáp Thắc Mắc
          </span>
          <h2 className="text-3xl font-black text-[var(--fha-text)] mt-3 tracking-tight">
            Câu Hỏi Thường Gặp
          </h2>
          <p className="text-sm text-[var(--fha-text-muted)] mt-2">
            Mọi điều bạn cần biết về bản quyền, kỹ thuật vận hành và cơ chế thanh toán tự động PayOS.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2 mb-8 p-1.5 bg-white rounded-fha border border-[var(--fha-border)]">
          <button
            onClick={() => { setActiveCategory('license'); setOpenIndices({ 0: true }); }}
            className={`py-2 px-3 text-xs font-bold rounded-md transition-all text-center ${
              activeCategory === 'license' 
                ? 'bg-[var(--fha-brand)] text-white shadow-sm' 
                : 'text-[var(--fha-text-muted)] hover:text-[var(--fha-text)] hover:bg-[var(--fha-surface-2)]'
            }`}
          >
            Bản Quyền & Thiết Bị
          </button>
          <button
            onClick={() => { setActiveCategory('tech'); setOpenIndices({ 0: true }); }}
            className={`py-2 px-3 text-xs font-bold rounded-md transition-all text-center ${
              activeCategory === 'tech' 
                ? 'bg-[var(--fha-brand)] text-white shadow-sm' 
                : 'text-[var(--fha-text-muted)] hover:text-[var(--fha-text)] hover:bg-[var(--fha-surface-2)]'
            }`}
          >
            Kỹ Thuật & An Toàn
          </button>
          <button
            onClick={() => { setActiveCategory('payment'); setOpenIndices({ 0: true }); }}
            className={`py-2 px-3 text-xs font-bold rounded-md transition-all text-center ${
              activeCategory === 'payment' 
                ? 'bg-[var(--fha-brand)] text-white shadow-sm' 
                : 'text-[var(--fha-text-muted)] hover:text-[var(--fha-text)] hover:bg-[var(--fha-surface-2)]'
            }`}
          >
            Thanh Toán PayOS
          </button>
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = !!openIndices[idx];

            return (
              <div
                key={idx}
                className={`bg-white rounded-fha border transition-all ${
                  isOpen ? 'border-[var(--fha-border-strong)] shadow-fha-sm' : 'border-[var(--fha-border)] hover:border-[var(--fha-border-strong)]'
                }`}
              >
                <button
                  onClick={() => toggleIndex(idx)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)] rounded-fha"
                >
                  <span className={`font-bold text-sm sm:text-base ${isOpen ? 'text-[var(--fha-brand)]' : 'text-[var(--fha-text)]'}`}>
                    {faq.q}
                  </span>
                  <svg
                    className={`w-5 h-5 shrink-0 ml-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[var(--fha-brand)]' : 'text-[var(--fha-text-muted)]'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-sm text-[var(--fha-text-muted)] leading-relaxed border-t border-[var(--fha-border)]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Extra Support Contact */}
        <div className="mt-10 text-center text-xs text-[var(--fha-text-muted)]">
          Bạn vẫn còn câu hỏi khác?{' '}
          <a href="https://zalo.me/0378791667" target="_blank" rel="noopener noreferrer" className="font-bold text-[var(--fha-brand)] hover:underline">
            Chat trực tiếp với kỹ thuật viên Zalo 24/7 &rarr;
          </a>
        </div>

        </div>
      </div>
    </section>
  );
}
