'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import StatCard from '@/components/features/StatCard';
import StatusBadge from '@/components/features/StatusBadge';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

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

  const formatCurrency = (val: number) => val.toLocaleString('vi-VN') + 'đ';

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-20 bg-fha-surface-2 rounded-fha-radius-lg border border-fha-border"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-fha-surface-2 rounded-fha-radius-md border border-fha-border"></div>
          <div className="h-32 bg-fha-surface-2 rounded-fha-radius-md border border-fha-border"></div>
          <div className="h-32 bg-fha-surface-2 rounded-fha-radius-md border border-fha-border"></div>
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

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Xin chào, ${user.full_name}`} 
        description="Chào mừng bạn quay lại Fairy House AutoData"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Số dư ví"
          value={formatCurrency(walletBalance)}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
          }
        />
        <StatCard 
          label="License Đang Hoạt Động"
          value={activeLicensesCount}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
          }
        />
        <StatCard 
          label="Tổng Đơn Hàng"
          value={orders.length}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card variant="default">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-fha-text">Thao tác nhanh</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/dashboard/wallet" passHref className="w-full">
              <Button variant="secondary" fullWidth className="h-auto py-4 flex-col gap-2">
                <svg className="w-6 h-6 text-fha-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                <span>Nạp Tiền Vào Ví</span>
              </Button>
            </Link>
            <Link href="/dashboard/store" passHref className="w-full">
              <Button variant="secondary" fullWidth className="h-auto py-4 flex-col gap-2">
                <svg className="w-6 h-6 text-fha-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                <span>Mua License Mới</span>
              </Button>
            </Link>
            <Link href="/dashboard/licenses" passHref className="w-full col-span-2">
              <Button variant="secondary" fullWidth className="justify-start border border-fha-border-muted hover:border-fha-cyan-border">
                <svg className="w-5 h-5 text-fha-text-muted mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                Quản lý License hiện tại
              </Button>
            </Link>
          </div>
        </Card>

        {/* Recent Orders */}
        <Card variant="default">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-fha-text">Giao dịch gần đây</h3>
            <Link href="/dashboard/transactions" className="text-sm font-medium text-fha-cyan hover:text-fha-cyan-hover">
              Xem tất cả
            </Link>
          </div>
          <div className="space-y-4">
            {recentOrders.length > 0 ? (
              recentOrders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-fha-radius-sm hover:bg-fha-surface-3 transition-colors border border-transparent hover:border-fha-border-muted">
                  <div className="flex flex-col">
                    <span className="font-mono text-sm text-fha-text font-semibold">{order.transaction_code}</span>
                    <span className="text-xs text-fha-text-muted mt-0.5">{new Date(order.created_at?._seconds ? order.created_at._seconds * 1000 : order.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-fha-text mb-1">{formatCurrency(order.amount)}</span>
                    <StatusBadge status={order.status} size="sm" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-fha-text-muted text-sm border border-dashed border-fha-border rounded-fha-radius">
                Chưa có giao dịch nào
              </div>
            )}
          </div>
        </Card>
      </div>

    </div>
  );
}
