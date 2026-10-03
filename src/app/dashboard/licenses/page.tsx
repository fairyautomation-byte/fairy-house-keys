'use client';
import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import LicenseKey from '@/components/features/LicenseKey';
import StatusBadge from '@/components/features/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import Card from '@/components/ui/Card';
import { formatDate } from '@/lib/format';

export default function LicensesPage() {
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
        <div className="h-16 bg-white border border-[var(--fha-border)] rounded-fha-lg animate-pulse" />
        <Skeleton className="h-[280px] w-full rounded-fha-lg" />
        <Skeleton className="h-[280px] w-full rounded-fha-lg" />
      </div>
    );
  }

  const getPlanName = (planId: string) => {
    switch (planId) {
      case 'trial': return 'Trial (3 Ngày)';
      case 'monthly': return '1 Tháng';
      case 'quarterly': return '3 Tháng';
      case 'yearly': return '1 Năm';
      default: return planId.toUpperCase();
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Quản Lý License" 
        description="Quản lý mã kích hoạt cho các thiết bị của bạn"
      />

      {licenses.length > 0 ? (
        <div className="grid gap-6">
          {licenses.map((license, idx) => (
            <Card key={license.id || idx} variant="default" className="relative">
              <div className="absolute top-6 right-6">
                <StatusBadge status={license.status} />
              </div>
              
              <div className="mb-8 max-w-lg">
                <h3 className="text-[13px] font-bold text-[var(--fha-text)] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[var(--fha-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  License Key
                </h3>
                <LicenseKey value={license.license_key} status={license.status} />
                <p className="text-xs text-[var(--fha-text-muted)] mt-2 italic">
                  * Mỗi key chỉ áp dụng cho 1 thiết bị. Không chia sẻ key này cho người khác.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 pt-6 border-t border-[var(--fha-border)]">
                <div>
                  <div className="text-[12px] font-semibold text-[var(--fha-text-muted)] uppercase tracking-wider mb-1">Gói dịch vụ</div>
                  <div className="font-bold text-[17px] text-[var(--fha-text)]">{getPlanName(license.plan_id)}</div>
                </div>
                <div>
                  <div className="text-[12px] font-semibold text-[var(--fha-text-muted)] uppercase tracking-wider mb-1">Ngày hết hạn</div>
                  <div className="font-bold text-[17px] text-[var(--fha-text)]">
                    {license.expires_at ? formatDate(license.expires_at._seconds ? license.expires_at._seconds * 1000 : license.expires_at) : 'Không giới hạn'}
                  </div>
                </div>
                <div>
                  <div className="text-[12px] font-semibold text-[var(--fha-text-muted)] uppercase tracking-wider mb-1">Đã Scan Hôm Nay</div>
                  <div className="font-bold text-[17px] text-[var(--fha-text)]">
                    <span className="text-[var(--fha-brand)]">{license.daily_used || 0}</span>
                    <span className="text-[var(--fha-text-faint)] mx-1">/</span>
                    <span className="text-[var(--fha-text-muted)]">{license.daily_limit === -1 || license.daily_limit === null ? '∞' : license.daily_limit}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState 
          title="Bạn chưa có License nào" 
          description="Hãy mua một gói License Key để bắt đầu sử dụng."
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
          }
          action={{
            label: "Đi tới Cửa hàng",
            onClick: () => window.location.href = '/dashboard/store'
          }}
        />
      )}
    </div>
  );
}
