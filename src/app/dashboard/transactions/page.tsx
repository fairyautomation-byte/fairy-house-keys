'use client';
import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Table, { Column } from '@/components/ui/Table';
import StatusBadge from '@/components/features/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';

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

  const columns: Column<any>[] = [
    {
      key: 'transaction_code',
      title: 'Mã Giao Dịch',
      render: (item) => <span className="font-mono text-fha-cyan">{item.transaction_code}</span>
    },
    {
      key: 'created_at',
      title: 'Thời Gian',
      render: (item) => (
        <span className="text-fha-text-muted">
          {new Date(item.created_at?._seconds ? item.created_at._seconds * 1000 : item.created_at).toLocaleString('vi-VN')}
        </span>
      )
    },
    {
      key: 'type',
      title: 'Loại / Gói',
      render: (item) => (
        <span className="font-bold text-fha-text">
          {item.type === 'DEPOSIT' ? 'Nạp Tiền' : (item.plan_id || 'Mua Key')}
        </span>
      )
    },
    {
      key: 'amount',
      title: 'Số Tiền',
      align: 'right',
      render: (item) => (
        <span className={`font-bold font-mono ${item.type === 'DEPOSIT' ? 'text-fha-success-text' : 'text-fha-text'}`}>
          {item.type === 'DEPOSIT' ? '+' : ''}{item.amount?.toLocaleString('vi-VN')}đ
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
    <div className="space-y-6">
      <PageHeader 
        title="Lịch Sử Giao Dịch" 
        description="Chi tiết các giao dịch nạp tiền và mua gói của bạn"
      />

      <div className="bg-fha-surface rounded-fha-radius-lg border border-fha-border shadow-fha-md overflow-hidden">
        <Table
          columns={columns}
          data={orders}
          rowKey={(item) => item.id || item.transaction_code}
          loading={loading}
          emptyState={
            <EmptyState 
              title="Chưa có giao dịch nào" 
              description="Lịch sử giao dịch của bạn sẽ hiển thị tại đây."
              className="border-0 bg-transparent rounded-none my-8"
            />
          }
        />
      </div>
    </div>
  );
}
