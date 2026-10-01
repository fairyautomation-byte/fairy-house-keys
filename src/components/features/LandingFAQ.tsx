'use client';
import React, { useState } from 'react';

const faqs = [
  { q: 'Trial có hoàn toàn miễn phí không?', a: 'Chắc chắn rồi. Gói Trial hoàn toàn miễn phí trong 3 ngày với hạn mức 100 lượt scan/ngày để bạn trải nghiệm sức mạnh của Extension.' },
  { q: 'Sau khi thanh toán tôi phải làm gì?', a: 'Sau khi thanh toán qua QR code, hệ thống sẽ tự động duyệt đơn của bạn trong vòng vài giây đến vài phút và kích hoạt key ngay lập tức.' },
  { q: 'Khi hết lượt scan trong ngày thì sao?', a: 'Hệ thống sẽ tạm dừng quét và tự động cấp lại đầy đủ số lượt scan mới vào lúc 00:00 (giờ Việt Nam) ngày hôm sau.' },
  { q: 'Tôi có thể mua nhiều gói để cộng dồn không?', a: 'Hiện tại mỗi tài khoản chỉ áp dụng 1 gói License duy nhất tại 1 thời điểm. Bạn có thể gia hạn khi gói cũ gần hết.' }
];

export default function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div 
            key={index} 
            className={`border rounded-fha-radius-md overflow-hidden transition-colors ${isOpen ? 'border-fha-cyan-border bg-fha-surface-2' : 'border-fha-border bg-fha-surface/50 hover:border-fha-border-muted'}`}
          >
            <button
              onClick={() => toggle(index)}
              className="w-full px-6 py-4 flex items-center justify-between text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-fha-cyan"
            >
              <span className="font-semibold text-fha-text">{faq.q}</span>
              <svg 
                className={`w-5 h-5 text-fha-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div 
              className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-40 pb-4 opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <p className="text-sm text-fha-text-muted leading-relaxed">
                {faq.a}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
