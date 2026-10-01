'use client';
import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import StatCard from '@/components/features/StatCard';
import Card from '@/components/ui/Card';
import Table, { Column } from '@/components/ui/Table';
import StatusBadge from '@/components/features/StatusBadge';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';
import { ConfirmModal } from '@/components/ui/Modal';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [confirmAction, setConfirmAction] = useState<{type: 'approve' | 'reject', id: string} | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const { toast } = useToast();

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
        toast.success(type === 'approve' ? 'Đã duyệt thành công!' : 'Đã từ chối đơn hàng');
        fetchDashboard();
      } else {
        const err = await res.json();
        throw new Error(err.error);
      }
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-16 bg-fha-surface-2 rounded-lg"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-fha-surface-2 rounded-lg"></div>)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { stats, recentOrders } = data;

  const columns: Column<any>[] = [
    {
      key: 'transaction_code',
      title: 'Mã GD',
      render: (item) => <span className="font-mono text-fha-cyan">{item.transaction_code}</span>
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

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Tổng Quan Hệ Thống" 
        actions={
          <Button variant="secondary" onClick={fetchDashboard} size="sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Làm Mới
          </Button>
        }
      />
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard 
          label="Tổng Users" 
          value={stats.totalUsers} 
          icon={<svg className="w-5 h-5 text-fha-text-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
        <StatCard 
          label="Active Licenses" 
          value={stats.activeLicenses}
          className="border-fha-cyan-border shadow-fha-sm" 
          icon={<svg className="w-5 h-5 text-fha-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>}
        />
        <StatCard 
          label="Tổng Lượt Scan" 
          value={stats.totalScans?.toLocaleString() || 0} 
          icon={<svg className="w-5 h-5 text-fha-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard 
          label="Chờ Duyệt" 
          value={stats.pendingOrders} 
          className={stats.pendingOrders > 0 ? "border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]" : ""}
          icon={<svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {/* Recent Orders */}
      <Card variant="default" padding="none">
        <div className="px-6 py-4 border-b border-fha-border">
          <h3 className="text-base font-semibold text-fha-text">Giao Dịch Gần Đây</h3>
        </div>
        <Table
          columns={columns}
          data={recentOrders}
          rowKey={(item) => item.id}
          loading={loading}
          emptyState={
            <div className="py-12 text-center text-fha-text-muted">Chưa có giao dịch nào</div>
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
