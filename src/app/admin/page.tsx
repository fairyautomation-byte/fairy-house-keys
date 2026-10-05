'use client';
import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import StatStrip from '@/components/features/StatStrip';
import Card from '@/components/ui/Card';
import Table, { Column } from '@/components/ui/Table';
import StatusBadge from '@/components/features/StatusBadge';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';
import { ConfirmModal } from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/format';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [confirmAction, setConfirmAction] = useState<{type: 'approve' | 'reject', id: string} | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const { success, error } = useToast();

  const fetchDashboard = () => {
    setLoading(true);
    fetch('/api/admin/dashboard')
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const executeAction = async () => {
    if (!confirmAction) return;
    
    setActionLoading(true);
    const { type, id } = confirmAction;
    
    try {
      const res = await fetch(`/api/admin/orders/${id}/${type}`, { method: 'POST' });
      if (res.ok) {
        success(type === 'approve' ? 'Đã duyệt thành công!' : 'Đã từ chối đơn hàng');
        fetchDashboard();
      } else {
        const err = await res.json();
        throw new Error(err.error);
      }
    } catch (err: any) {
      error('Lỗi: ' + err.message);
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-16 bg-white border border-[var(--fha-border)] rounded-fha-lg"></div>
        <div className="h-24 bg-white border border-[var(--fha-border)] rounded-fha-lg"></div>
        <div className="h-64 bg-white border border-[var(--fha-border)] rounded-fha-lg"></div>
      </div>
    );
  }

  if (!data) return null;

  const { stats, recentOrders } = data;

  const columns: Column<any>[] = [
    {
      key: 'transaction_code',
      title: 'Mã GD',
      render: (item) => <span className="font-mono text-[var(--fha-brand)] font-semibold">{item.transaction_code}</span>
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
    },
    {
      key: 'actions',
      title: 'Hành động',
      align: 'right',
      render: (item) => {
        if (item.status === 'PENDING_PAYMENT_REVIEW') {
          return (
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setConfirmAction({type: 'reject', id: item.id})}>Từ chối</Button>
              <Button size="sm" variant="primary" onClick={() => setConfirmAction({type: 'approve', id: item.id})}>Duyệt</Button>
            </div>
          );
        }
        return null;
      }
    }
  ];

  const stripItems = [
    { label: 'Tổng Users', value: stats.totalUsers },
    { label: 'Active Licenses', value: stats.activeLicenses, highlight: 'success' as const },
    { label: 'Tổng Lượt Scan', value: stats.totalScans?.toLocaleString() || 0 },
    { label: 'Chờ Duyệt', value: stats.pendingOrders, highlight: stats.pendingOrders > 0 ? 'warning' as const : 'none' as const },
  ];

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Tổng Quan Hệ Thống" 
        actions={
          <Button variant="secondary" onClick={fetchDashboard} size="sm" className="bg-white">
            <svg className="w-[18px] h-[18px] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Làm Mới
          </Button>
        }
      />
      
      {/* Stats */}
      <StatStrip items={stripItems} />

      {/* Recent Orders */}
      <Card variant="default" padding="none" className="overflow-hidden">
        <div className="px-6 py-5 border-b border-[var(--fha-border-strong)] bg-[var(--fha-surface-2)]">
          <h3 className="text-[17px] font-bold text-[var(--fha-text)]">Giao Dịch Gần Đây</h3>
        </div>
        <Table
          columns={columns}
          data={recentOrders}
          rowKey={(item) => item.id}
          loading={loading}
          mobileRender={(item) => (
            <div className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[var(--fha-brand)]">{item.transaction_code}</span>
                <StatusBadge status={item.status} size="sm" />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase text-[var(--fha-text)]">{item.plan_id}</span>
                <span className="font-mono font-medium text-[var(--fha-text)]">{formatCurrency(item.amount)}</span>
              </div>
              {item.status === 'PENDING_PAYMENT_REVIEW' && (
                <div className="flex justify-end gap-2 pt-2 border-t border-[var(--fha-border)]">
                  <Button size="sm" variant="ghost" onClick={() => setConfirmAction({type: 'reject', id: item.id})}>Từ chối</Button>
                  <Button size="sm" variant="primary" onClick={() => setConfirmAction({type: 'approve', id: item.id})}>Duyệt</Button>
                </div>
              )}
            </div>
          )}
          emptyState={
            <div className="py-12 text-center text-[var(--fha-text-muted)] text-[14px]">Chưa có giao dịch nào</div>
          }
        />
      </Card>

      <ConfirmModal
        open={!!confirmAction}
        onClose={() => !actionLoading && setConfirmAction(null)}
        title={confirmAction?.type === 'approve' ? 'Xác nhận duyệt đơn' : 'Từ chối đơn hàng'}
        message={confirmAction?.type === 'approve' ? 'Bạn có chắc chắn muốn duyệt đơn này và cấp License cho người dùng?' : 'Bạn có chắc chắn muốn từ chối đơn hàng này?'}
        confirmText={confirmAction?.type === 'approve' ? 'Duyệt Đơn' : 'Từ Chối'}
        onConfirm={executeAction}
        loading={actionLoading}
        danger={confirmAction?.type === 'reject'}
      />
    </div>
  );
}
