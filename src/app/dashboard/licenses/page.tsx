'use client';
import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import LicenseKey from '@/components/features/LicenseKey';
import StatusBadge from '@/components/features/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import Card from '@/components/ui/Card';

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
        <div className="h-16 bg-fha-surface-2 rounded-lg animate-pulse"></div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Quản Lý License" 
        description="Các mã kích hoạt Chrome Extension của bạn"
      />

      {licenses.length > 0 ? (
        <div className="grid gap-6">
          {licenses.map((license, idx) => (
            <Card key={license.id || idx} variant="default" className="relative overflow-hidden group">
              <div className="absolute top-6 right-6">
                <StatusBadge status={license.status} />
              </div>
              
              <div className="mb-8 max-w-lg">
                <h3 className="text-[11px] font-bold text-fha-cyan uppercase tracking-widest mb-3">
                  License Key
                </h3>
                <LicenseKey value={license.license_key} status={license.status} />
              </div>

              <div className="grid md:grid-cols-3 gap-6 pt-6 border-t border-fha-border">
                <div>
                  <div className="text-[11px] font-bold text-fha-text-muted uppercase tracking-wider mb-1">Gói dịch vụ</div>
                  <div className="font-bold text-lg text-fha-text">{license.plan_id}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-fha-text-muted uppercase tracking-wider mb-1">Ngày hết hạn</div>
                  <div className="font-bold text-lg text-fha-text">
                    {license.expires_at ? new Date(license.expires_at._seconds ? license.expires_at._seconds * 1000 : license.expires_at).toLocaleDateString('vi-VN') : 'Không giới hạn ♾️'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-fha-text-muted uppercase tracking-wider mb-1">Đã Scan Hôm Nay</div>
                  <div className="font-bold text-lg text-fha-text">
                    <span className="text-fha-cyan">{license.daily_used || 0}</span>
                    <span className="text-fha-text-faint mx-1">/</span>
                    <span className="text-fha-text-muted">{license.daily_limit === -1 || license.daily_limit === null ? '∞' : license.daily_limit}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState 
          title="Bạn chưa có License nào" 
          description="Hãy mua một gói License Key để bắt đầu sử dụng Chrome Extension."
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
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
