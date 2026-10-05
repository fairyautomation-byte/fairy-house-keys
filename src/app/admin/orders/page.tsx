'use client';
import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Table, { Column } from '@/components/ui/Table';
import StatusBadge from '@/components/features/StatusBadge';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/format';

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
      render: (item) => <span className="font-mono text-[var(--fha-brand)] font-semibold">{item.transaction_code}</span>
    },
    {
      key: 'email',
      title: 'Khách hàng',
      render: (item) => <span className="text-[var(--fha-text)]">{item.email || 'N/A'}</span>
    },
    {
      key: 'plan_id',
      title: 'Gói',
      render: (item) => <span className="font-bold uppercase text-[var(--fha-text)]">{item.plan_id}</span>
    },
    {
      key: 'amount',
      title: 'Số Tiền',
      render: (item) => <span className="font-medium font-mono text-[var(--fha-text)]">{formatCurrency(item.amount)}</span>
    },
    {
      key: 'status',
      title: 'Trạng Thái',
      render: (item) => <StatusBadge status={item.status} size="sm" />
    }
  ];

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Quản Lý Đơn Hàng" 
        description="Tất cả giao dịch nạp tiền và mua gói trên hệ thống"
      />

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="w-full sm:w-[400px]">
          <Input 
            placeholder="Tìm kiếm mã GD, email, gói..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            }
          />
        </div>
        <Button variant="secondary" onClick={fetchOrders} size="sm" className="bg-white">
          <svg className="w-[16px] h-[16px] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Làm Mới
        </Button>
      </div>

      <div className="bg-white rounded-fha-lg border border-[var(--fha-border)] overflow-hidden shadow-sm">
        <Table
          columns={columns}
          data={filteredOrders}
          rowKey={(item) => item.id}
          loading={loading}
          mobileRender={(item) => (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[var(--fha-brand)] font-bold">{item.transaction_code}</span>
                <StatusBadge status={item.status} size="sm" />
              </div>
              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="font-bold text-sm text-[var(--fha-text)] truncate max-w-[200px]">{item.email || 'N/A'}</div>
                  <div className="text-[11px] font-semibold uppercase text-[var(--fha-text-muted)] mt-0.5">{item.plan_id}</div>
                </div>
                <div className="font-mono font-bold text-sm text-[var(--fha-text)]">
                  {formatCurrency(item.amount)}
                </div>
              </div>
            </div>
          )}
          emptyState={
            <div className="py-12 text-center text-[var(--fha-text-muted)] text-[14px]">Không tìm thấy đơn hàng nào</div>
          }
        />
      </div>
    </div>
  );
}
