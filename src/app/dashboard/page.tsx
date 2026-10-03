'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import StatStrip from '@/components/features/StatStrip';
import StatusBadge from '@/components/features/StatusBadge';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { formatCurrency, formatDate } from '@/lib/format';

export default function DashboardOverview() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user/dashboard')
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then(setData)
      .catch(() => {
        fetch('/api/auth/login', { method: 'DELETE' }).finally(() => {
          router.push('/login');
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-white border border-[var(--fha-border)] rounded-fha-lg animate-pulse" />
        <Skeleton className="h-32 w-full rounded-fha-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[280px] w-full rounded-fha-lg" />
          <Skeleton className="h-[280px] w-full rounded-fha-lg" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { user, licenses = [], orders = [] } = data;
  
  // Calculate stats
  const activeLicensesCount = licenses.filter((l: any) => l.status === 'ACTIVE').length;
  
  // Fake wallet balance (because it wasn't in the original response, we assume 0 for now until wallet api is built)
  const walletBalance = user.wallet_balance || 0; 
  
  const recentOrders = orders.slice(0, 3);

  const stats = [
    {
      label: 'Số dư ví',
      value: formatCurrency(walletBalance),
      highlight: walletBalance > 0 ? 'success' as const : 'none' as const
    },
    {
      label: 'License Đang Hoạt Động',
      value: activeLicensesCount,
      highlight: activeLicensesCount === 0 ? 'warning' as const : 'none' as const
    },
    {
      label: 'Tổng Đơn Hàng',
      value: orders.length
    }
  ];

  return (
    <div className="space-y-8">
      <PageHeader 
        title={`Xin chào, ${user.full_name}`} 
        description="Chào mừng bạn quay lại Fairy House"
      />

      {/* Stats Strip */}
      <StatStrip items={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card variant="default">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[17px] font-bold text-[var(--fha-text)]">Thao tác nhanh</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/dashboard/wallet" passHref className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)] rounded">
              <Button variant="secondary" fullWidth className="h-auto py-5 flex-col gap-2">
                <svg className="w-[22px] h-[22px] text-[var(--fha-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                <span className="font-semibold text-sm">Nạp Tiền Vào Ví</span>
              </Button>
            </Link>
            <Link href="/dashboard/store" passHref className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)] rounded">
              <Button variant="secondary" fullWidth className="h-auto py-5 flex-col gap-2">
                <svg className="w-[22px] h-[22px] text-[var(--fha-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                <span className="font-semibold text-sm">Mua License</span>
              </Button>
            </Link>
            <Link href="/dashboard/licenses" passHref className="w-full col-span-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)] rounded">
              <Button variant="outline" fullWidth className="justify-start py-4">
                <svg className="w-[18px] h-[18px] text-[var(--fha-text-muted)] mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                <span className="font-semibold">Quản lý License hiện tại</span>
              </Button>
            </Link>
          </div>
        </Card>

        {/* Recent Orders */}
        <Card variant="default">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[17px] font-bold text-[var(--fha-text)]">Giao dịch gần đây</h3>
            <Link href="/dashboard/transactions" className="text-[13px] font-semibold text-[var(--fha-brand)] hover:text-[var(--fha-brand-hover)] focus-visible:outline-none focus-visible:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrders.length > 0 ? (
              recentOrders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-4 rounded-fha bg-[var(--fha-surface-2)] border border-[var(--fha-border)] hover:border-[var(--fha-border-strong)] transition-colors">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-sm text-[var(--fha-brand)] font-bold">{order.transaction_code}</span>
                    <span className="text-xs font-medium text-[var(--fha-text-muted)]">
                      {formatDate(order.created_at?._seconds ? order.created_at._seconds * 1000 : order.created_at)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[15px] font-bold text-[var(--fha-text)] tracking-tight">{formatCurrency(order.amount)}</span>
                    <StatusBadge status={order.status} size="sm" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-[var(--fha-text-muted)] text-[13px] font-medium border border-dashed border-[var(--fha-border-strong)] rounded-fha bg-[var(--fha-surface-2)]">
                Chưa có giao dịch nào
              </div>
            )}
          </div>
        </Card>
      </div>

    </div>
  );
}
