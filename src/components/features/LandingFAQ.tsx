'use client';
import React, { useState } from 'react';

const faqs = [
  { q: 'Trial có hoàn toàn miễn phí không?', a: 'Chắc chắn rồi. Gói Trial hoàn toàn miễn phí trong 3 ngày với hạn mức 100 lượt scan/ngày để bạn trải nghiệm sức mạnh của Extension.' },
  { q: 'Sau khi thanh toán tôi phải làm gì?', a: 'Sau khi chuyển khoản, hệ thống PayOS sẽ tự động duyệt đơn của bạn trong vài giây và cung cấp Key ngay lập tức trên màn hình.' },
  { q: 'Khi hết lượt scan trong ngày thì sao?', a: 'Hệ thống sẽ tạm dừng tính năng và tự động cấp lại đầy đủ số lượt scan mới vào lúc 00:00 (giờ Việt Nam) mỗi ngày.' },
  { q: '1 Key có thể dùng trên nhiều máy không?', a: 'Không. 1 Key chỉ được sử dụng cho 1 thiết bị duy nhất. Nếu bạn có nhiều thiết bị hoặc nhiều nhân viên, vui lòng mua số lượng Key tương ứng.' }
];

export default function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-3">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div 
            key={index} 
            className={`border rounded-fha transition-colors ${isOpen ? 'border-[var(--fha-border-strong)] bg-white shadow-fha-sm' : 'border-[var(--fha-border)] bg-[var(--fha-surface-2)] hover:border-[var(--fha-border-strong)]'}`}
          >
            <button
              onClick={() => toggle(index)}
              className="w-full px-5 py-4 flex items-center justify-between text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)] rounded-fha"
            >
              <span className={`font-semibold ${isOpen ? 'text-[var(--fha-brand)]' : 'text-[var(--fha-text)]'}`}>{faq.q}</span>
              <svg 
                className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[var(--fha-brand)]' : 'text-[var(--fha-text-muted)]'}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div 
              className={`px-5 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <p className="text-sm text-[var(--fha-text-muted)] leading-relaxed">
                {faq.a}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
