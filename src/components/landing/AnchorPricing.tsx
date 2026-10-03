'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Button from '../ui/Button';
import { formatCurrency } from '@/lib/format';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  duration: string;
  originalPrice?: number;
  scanLimit: string;
  popular?: boolean;
  tag?: string;
  features: string[];
}

const PLANS: PricingPlan[] = [
  {
    id: 'trial',
    name: '3 Ngày Dùng Thử',
    price: 0,
    duration: '3 ngày trải nghiệm',
    scanLimit: '100 lượt scan / ngày',
    tag: 'Dành cho người mới',
    features: [
      'Sử dụng 1 thiết bị độc quyền',
      'Thuật toán Human-Emulation 2.0',
      'Tự động kết bạn và trích xuất UID',
      'Hỗ trợ qua Zalo trong giờ hành chính',
      'Kích hoạt ngay không cần thẻ Visa'
    ]
  },
  {
    id: 'monthly',
    name: 'Gói 1 Tháng',
    price: 69000,
    originalPrice: 99000,
    duration: '30 ngày sử dụng',
    scanLimit: '1.000 lượt scan / ngày',
    tag: 'Bán chạy phổ thông',
    features: [
      'Sử dụng 1 thiết bị độc quyền',
      'Đầy đủ tính năng Human-Emulation',
      'Tự động nhận diện thanh toán PayOS',
      'Xuất file Excel / CSV chuẩn CRM',
      'Tự động reset hạn mức vào 00:00 VN'
    ]
  },
  {
    id: 'quarterly',
    name: 'Gói 3 Tháng',
    price: 179000,
    originalPrice: 297000,
    duration: '90 ngày sử dụng',
    scanLimit: '3.000 lượt scan / ngày',
    popular: true,
    tag: 'Tiết kiệm 40% chi phí',
    features: [
      'Sử dụng 1 thiết bị độc quyền',
      'Tốc độ quét ưu tiên server riêng',
      'Hỗ trợ 1-1 cài đặt qua Ultraview/Zalo',
      'Không giới hạn xuất file danh sách',
      'Bảo hành 1 đổi 1 suốt thời gian dùng'
    ]
  },
  {
    id: 'yearly',
    name: 'Gói 1 Năm',
    price: 479000,
    originalPrice: 828000,
    duration: '365 ngày sử dụng',
    scanLimit: 'Không giới hạn scan',
    tag: 'Doanh nghiệp / Đội nhóm',
    features: [
      'Sử dụng 1 thiết bị độc quyền',
      'Không giới hạn số lượt scan/ngày',
      'Ưu tiên tính năng mới V3.0 sớm nhất',
      'Hỗ trợ kỹ thuật VIP 24/7',
      'Kích hoạt tự động qua PayOS'
    ]
  }
];

export default function AnchorPricing() {
  const [billingCycle, setBillingCycle] = useState<'standard' | 'saving'>('saving');

  return (
    <section id="pricing" className="py-24 bg-white border-b border-[var(--fha-border)]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--fha-brand)] bg-[var(--fha-brand-soft)] px-3 py-1 rounded">
            Bảng Giá Minh Bạch
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[var(--fha-text)] mt-3 tracking-tight">
            Đầu Tư Nhỏ, Thu Về Tệp Khách Hàng Bền Vững
          </h2>
          <p className="text-base text-[var(--fha-text-muted)] mt-3">
            Tất cả các gói đều kích hoạt tự động qua cổng <strong className="text-[var(--fha-text)] font-semibold">PayOS VietQR</strong> trong 5 giây, bảo đảm 1 key chỉ cấp cho 1 thiết bị.
          </p>

          {/* Value Anchor Callout */}
          <div className="mt-6 inline-flex items-center gap-2 p-1.5 px-4 bg-[var(--fha-surface-2)] border border-[var(--fha-border-strong)] rounded-full text-xs font-semibold text-[var(--fha-text)]">
            <span className="w-2 h-2 rounded-full bg-[var(--fha-brand)]" />
            <span>Khuyên dùng: Gói 3 Tháng để tiết kiệm 40% và đạt hiệu quả tiếp cận cao nhất</span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {PLANS.map((plan) => {
            const isPopular = plan.popular;

            return (
              <div
                key={plan.id}
                className={`rounded-fha-lg border-2 p-6 sm:p-7 flex flex-col justify-between transition-all relative ${
                  isPopular 
                    ? 'border-[var(--fha-brand)] bg-white shadow-fha-md scale-[1.02] z-10' 
                    : 'border-[var(--fha-border)] bg-white hover:border-[var(--fha-border-strong)] shadow-fha-sm'
                }`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[var(--fha-brand)] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
                    Khuyên Dùng Nhất
                  </div>
                )}

                <div>
                  <div className="mb-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--fha-text-muted)]">
                      {plan.tag}
                    </span>
                    <h3 className="text-xl font-bold text-[var(--fha-text)] mt-1">
                      {plan.name}
                    </h3>
                  </div>

                  {/* Price */}
                  <div className="mb-6 pb-6 border-b border-[var(--fha-border)]">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black font-mono text-[var(--fha-text)] tracking-tight">
                        {plan.price === 0 ? '0đ' : formatCurrency(plan.price)}
                      </span>
                      {plan.originalPrice && (
                        <span className="text-xs line-through text-[var(--fha-text-faint)] font-mono">
                          {formatCurrency(plan.originalPrice)}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-[var(--fha-text-muted)] mt-1">
                      {plan.duration} • <strong className="text-[var(--fha-brand)] font-semibold">{plan.scanLimit}</strong>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-8">
                    <div className="text-[11px] font-bold uppercase text-[var(--fha-text-faint)] tracking-wider">
                      Quyền lợi bao gồm:
                    </div>
                    {plan.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2.5 text-xs text-[var(--fha-text)]">
                        <svg className="w-4 h-4 text-[var(--fha-brand)] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card CTA */}
                <div>
                  <Link href={`/register?plan=${plan.id}`} passHref>
                    <Button 
                      variant={isPopular ? 'primary' : 'outline'} 
                      fullWidth 
                      size="md"
                      className={isPopular ? 'shadow-sm' : 'bg-[var(--fha-surface-2)]'}
                    >
                      {plan.price === 0 ? 'Bắt Đầu Thử Nghiệm' : 'Đăng Ký & Nhận Key Ngay'}
                    </Button>
                  </Link>
                  <div className="text-[10px] text-center text-[var(--fha-text-muted)] mt-2">
                    Duyệt tự động 5s qua PayOS
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Guarantee Banner */}
        <div className="mt-14 p-6 bg-[var(--fha-surface-2)] rounded-fha-lg border border-[var(--fha-border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--fha-success-bg)] text-[var(--fha-success)] flex items-center justify-center shrink-0 border border-[var(--fha-success-border)]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-[var(--fha-text)]">Cam kết hoàn tiền & Bảo hành 1-đổi-1</div>
              <div className="text-xs text-[var(--fha-text-muted)]">Nếu Extension gặp lỗi kỹ thuật không khắc phục được trong 24h, chúng tôi hoàn 100% chi phí.</div>
            </div>
          </div>

          <a 
            href="https://zalo.me/0378791667" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs font-bold text-[var(--fha-brand)] hover:underline whitespace-nowrap"
          >
            Tư vấn chọn gói Zalo &rarr;
          </a>
        </div>

      </div>
    </section>
  );
}
