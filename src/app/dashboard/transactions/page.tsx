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
