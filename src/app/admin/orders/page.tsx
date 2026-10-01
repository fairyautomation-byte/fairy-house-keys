'use client';
import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Table, { Column } from '@/components/ui/Table';
import StatusBadge from '@/components/features/StatusBadge';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = () => {
    setLoading(true);
    // Fallback to dashboard API if specific orders API doesn't exist
    fetch('/api/admin/dashboard')
      .then(res => res.json())
      .then(data => {
        setOrders(data.recentOrders || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(o => 
    o.transaction_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.plan_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: Column<any>[] = [
    {
      key: 'transaction_code',
      title: 'Mã GD',
      render: (item) => <span className="font-mono text-fha-cyan">{item.transaction_code}</span>
    },
    {
      key: 'email',
      title: 'Khách hàng',
      render: (item) => <span className="text-fha-text">{item.email || 'N/A'}</span>
    },
    {
      key: 'plan_id',
      title: 'Gói',
      render: (item) => <span className="font-bold uppercase text-fha-text">{item.plan_id}</span>
    },
    {
      key: 'amount',
      title: 'Số Tiền',
      render: (item) => <span className="font-medium text-fha-text">{item.amount?.toLocaleString('vi-VN')}đ</span>
    },
    {
      key: 'status',
      title: 'Trạng Thái',
      render: (item) => <StatusBadge status={item.status} size="sm" />
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Quản Lý Đơn Hàng" 
        description="Tất cả giao dịch nạp tiền và mua gói trên hệ thống"
      />

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="w-full sm:w-96">
          <Input 
            placeholder="Tìm kiếm mã GD, email, gói..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            }
          />
        </div>
        <Button variant="secondary" onClick={fetchOrders} size="sm">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Làm Mới
        </Button>
      </div>

      <div className="bg-fha-surface rounded-fha-radius-lg border border-fha-border shadow-fha-md overflow-hidden">
        <Table
          columns={columns}
          data={filteredOrders}
          rowKey={(item) => item.id}
          loading={loading}
          emptyState={
            <div className="py-12 text-center text-fha-text-muted">Không tìm thấy đơn hàng nào</div>
          }
        />
      </div>
    </div>
  );
}
