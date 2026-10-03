'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import LicenseKey from '@/components/features/LicenseKey';
import StatusBadge from '@/components/features/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import { formatDate } from '@/lib/format';

export default function LicensesPage() {
  const router = useRouter();
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user/dashboard')
      .then(res => res.json())
      .then(data => {
        setLicenses(data.licenses || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-fha-lg" />
        <Skeleton className="h-[240px] w-full rounded-fha-lg" />
        <Skeleton className="h-[240px] w-full rounded-fha-lg" />
      </div>
    );
  }

  const getPlanName = (planId: string) => {
    switch (planId) {
      case 'trial': return 'Gói 3 Ngày Dùng Thử';
      case 'monthly': return 'Gói 1 Tháng (Chuẩn)';
      case 'quarterly': return 'Gói 3 Tháng (Tiết Kiệm)';
      case 'yearly': return 'Gói 1 Năm (Doanh Nghiệp)';
      default: return planId ? planId.toUpperCase() : 'BẢN QUYỀN';
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Quản Lý License Bản Quyền" 
        description="Danh sách mã kích hoạt phần mềm được cấp độc quyền cho từng thiết bị của bạn"
        actions={
          <Link href="/dashboard/store" passHref>
            <Button variant="primary" size="sm">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Mua Thêm Key Mới
            </Button>
          </Link>
        }
      />

      {licenses.length > 0 ? (
        <div className="grid gap-6">
          {licenses.map((license, idx) => {
            const dailyUsed = license.daily_used || 0;
            const dailyLimit = license.daily_limit === -1 || license.daily_limit === null ? null : (license.daily_limit || 1000);
            const quotaPercent = dailyLimit ? Math.min(100, Math.round((dailyUsed / dailyLimit) * 100)) : 0;
            const isUnlimited = dailyLimit === null;

            return (
              <div 
                key={license.id || idx} 
                className="bg-white rounded-fha-lg border-2 border-[var(--fha-border-strong)] p-6 sm:p-7 shadow-fha-sm relative overflow-hidden space-y-6"
              >
                {/* Accent Top Border */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${license.status === 'ACTIVE' ? 'bg-[var(--fha-brand)]' : 'bg-gray-300'}`} />

                {/* Card Header: Plan & Security Status */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--fha-border)] pb-5">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded bg-[var(--fha-brand-soft)] text-[var(--fha-brand)] flex items-center justify-center font-bold text-sm shrink-0 border border-[var(--fha-brand)]">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-base text-[var(--fha-text)]">
                        {getPlanName(license.plan_id)}
                      </div>
                      <div className="text-xs text-[var(--fha-text-muted)] flex items-center gap-2 mt-0.5">
                        <span className="inline-flex items-center gap-1 font-medium text-[var(--fha-success)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--fha-success)]" />
                          1 Thiết Bị Độc Quyền
                        </span>
                        <span>•</span>
                        <span>Hardware Lock Enabled</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={license.status} />
                  </div>
                </div>

                {/* Center: Key Vault */}
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--fha-text-muted)]">
                      Mã Bản Quyền (License Key)
                    </span>
                    <span className="text-[11px] text-[var(--fha-text-faint)] italic">
                      * Nhấp chuột để sao chép key và dán vào Extension
                    </span>
                  </div>

                  <LicenseKey value={license.license_key} status={license.status} />
                </div>

                {/* Bottom Matrix: Expiration + Daily Quota Gauge + Actions */}
                <div className="grid md:grid-cols-12 gap-6 pt-5 border-t border-[var(--fha-border)] items-center">
                  
                  {/* Expiration (4 cols) */}
                  <div className="md:col-span-4 space-y-1">
                    <div className="text-[11px] font-bold text-[var(--fha-text-muted)] uppercase tracking-wider">
                      Thời Hạn Sử Dụng
                    </div>
                    <div className="font-black text-sm text-[var(--fha-text)] font-mono">
                      {license.expires_at 
                        ? formatDate(license.expires_at._seconds ? license.expires_at._seconds * 1000 : license.expires_at) 
                        : 'Không giới hạn thời gian'}
                    </div>
                    <div className="text-[11px] text-[var(--fha-text-faint)]">
                      Tự động tính ngày sau khi thanh toán
                    </div>
                  </div>

                  {/* Quota Gauge (5 cols) */}
                  <div className="md:col-span-5 bg-[var(--fha-surface-2)] p-3.5 rounded-fha border border-[var(--fha-border)] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[var(--fha-text)]">Tiến độ scan hôm nay:</span>
                      <span className="font-mono text-[var(--fha-brand)] font-bold">
                        {dailyUsed.toLocaleString('vi-VN')} / {isUnlimited ? '∞' : dailyLimit?.toLocaleString('vi-VN')} UID
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-[var(--fha-border)]">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          quotaPercent > 90 ? 'bg-[var(--fha-error)]' : quotaPercent > 70 ? 'bg-[var(--fha-warning)]' : 'bg-[var(--fha-brand)]'
                        }`}
                        style={{ width: isUnlimited ? '100%' : `${quotaPercent}%` }}
                      />
                    </div>

                    <div className="text-[10px] text-[var(--fha-text-faint)] flex justify-between">
                      <span>{isUnlimited ? 'Không giới hạn hạn mức' : `Còn lại: ${Math.max(0, (dailyLimit || 0) - dailyUsed)} UID`}</span>
                      <span>Reset 00:00 VN</span>
                    </div>
                  </div>

                  {/* Action CTA (3 cols) */}
                  <div className="md:col-span-3 flex md:justify-end gap-2">
                    <Link href={`/dashboard/store?renew=${license.plan_id || 'monthly'}`} passHref className="w-full md:w-auto">
                      <Button variant="secondary" size="sm" fullWidth className="font-bold text-xs whitespace-nowrap">
                        Gia Hạn / Nâng Cấp
                      </Button>
                    </Link>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState 
          title="Bạn chưa có License nào đang hoạt động" 
          description="Hãy mua một gói License Key để bắt đầu sử dụng tiện ích trên trình duyệt của bạn."
          icon={
            <svg className="w-8 h-8 text-[var(--fha-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          }
          action={{
            label: 'Mua Key Bản Quyền Ngay',
            onClick: () => router.push('/dashboard/store')
          }}
        />
      )}
    </div>
  );
}
