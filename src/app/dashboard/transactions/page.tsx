'use client';
import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Table, { Column } from '@/components/ui/Table';
import StatusBadge from '@/components/features/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency, formatDate } from '@/lib/format';

export default function TransactionsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user/dashboard')
      .then(res => res.json())
      .then(data => {
        setOrders(data.orders || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getPlanName = (planId: string) => {
    switch (planId) {
      case 'trial': return 'Trial (3 Ngày)';
      case 'monthly': return '1 Tháng';
      case 'quarterly': return '3 Tháng';
      case 'yearly': return '1 Năm';
      default: return planId?.toUpperCase() || 'Mua Key';
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'transaction_code',
      title: 'Mã Giao Dịch',
      render: (item) => <span className="font-mono text-[var(--fha-brand)] font-semibold">{item.transaction_code}</span>
    },
    {
      key: 'created_at',
      title: 'Thời Gian',
      render: (item) => (
        <span className="text-[var(--fha-text-muted)] font-medium">
          {formatDate(item.created_at?._seconds ? item.created_at._seconds * 1000 : item.created_at, true)}
        </span>
      )
    },
    {
      key: 'type',
      title: 'Loại / Gói',
      render: (item) => (
        <span className="font-bold text-[var(--fha-text)]">
          {item.type === 'DEPOSIT' ? 'Nạp Tiền' : getPlanName(item.plan_id)}
        </span>
      )
    },
    {
      key: 'amount',
      title: 'Số Tiền',
      align: 'right',
      render: (item) => (
        <span className={`font-bold font-mono tracking-tight ${item.type === 'DEPOSIT' ? 'text-[var(--fha-success)]' : 'text-[var(--fha-text)]'}`}>
          {item.type === 'DEPOSIT' ? '+' : ''}{formatCurrency(item.amount)}
        </span>
      )
    },
    {
      key: 'status',
      title: 'Trạng Thái',
      align: 'center',
      render: (item) => <StatusBadge status={item.status} size="md" />
    }
  ];

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Lịch Sử Giao Dịch" 
        description="Chi tiết các giao dịch mua gói của bạn"
      />

      <div className="bg-white rounded-fha-lg border border-[var(--fha-border)] overflow-hidden shadow-sm">
        <Table
          columns={columns}
          data={orders}
          rowKey={(item) => item.id || item.transaction_code}
          loading={loading}
          mobileRender={(item) => (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[var(--fha-brand)] font-bold">{item.transaction_code}</span>
                <StatusBadge status={item.status} size="sm" />
              </div>
              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="font-bold text-sm text-[var(--fha-text)]">
                    {item.type === 'DEPOSIT' ? 'Nạp Tiền Vào Ví' : getPlanName(item.plan_id)}
                  </div>
                  <div className="text-[11px] text-[var(--fha-text-muted)] mt-0.5">
                    {formatDate(item.created_at?._seconds ? item.created_at._seconds * 1000 : item.created_at, true)}
                  </div>
                </div>
                <div className={`font-mono font-bold text-base ${item.type === 'DEPOSIT' ? 'text-[var(--fha-success)]' : 'text-[var(--fha-text)]'}`}>
                  {item.type === 'DEPOSIT' ? '+' : ''}{formatCurrency(item.amount)}
                </div>
              </div>
            </div>
          )}
          emptyState={
            <EmptyState 
              title="Chưa có giao dịch nào" 
              description="Lịch sử giao dịch của bạn sẽ hiển thị tại đây."
              className="border-0 shadow-none my-8"
            />
          }
        />
      </div>
    </div>
  );
}
