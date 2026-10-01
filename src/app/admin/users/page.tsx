'use client';
import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Table, { Column } from '@/components/ui/Table';
import StatusBadge from '@/components/features/StatusBadge';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';
import { ConfirmModal } from '@/components/ui/Modal';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [confirmDelete, setConfirmDelete] = useState<{id: string, email: string} | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const { toast } = useToast();

  const fetchUsers = () => {
    setLoading(true);
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(setUsers)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleteLoading(true);
    
    try {
      const res = await fetch(`/api/admin/users/${confirmDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(`Đã xóa vĩnh viễn tài khoản ${confirmDelete.email}!`);
        fetchUsers();
      } else {
        const err = await res.json();
        throw new Error(err.error);
      }
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setDeleteLoading(false);
      setConfirmDelete(null);
    }
  };

  const handleCleanup = async () => {
    if (!confirm('Bạn có chắc chắn muốn dọn dẹp các tài khoản rác (chưa xác thực email quá 24h)?')) return;
    
    setCleanupLoading(true);
    try {
      const res = await fetch('/api/admin/cleanup-users', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Đã xóa ${data.deletedUsers} tài khoản rác và ${data.deletedSessions} phiên OTP cũ`);
        fetchUsers();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error('Lỗi: ' + (err.message || 'Lỗi hệ thống'));
    } finally {
      setCleanupLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.zalo?.includes(searchQuery)
  );

  const columns: Column<any>[] = [
    {
      key: 'full_name',
      title: 'Họ Tên',
      render: (item) => <span className="font-bold text-fha-text">{item.full_name}</span>
    },
    {
      key: 'email',
      title: 'Email',
      render: (item) => <span className="text-fha-text">{item.email}</span>
    },
    {
      key: 'email_verified',
      title: 'Trạng Thái',
      render: (item) => (
        item.email_verified 
          ? <StatusBadge status="ACTIVE" size="sm" /> 
          : <StatusBadge status="PENDING" size="sm" />
      )
    },
    {
      key: 'zalo',
      title: 'Zalo',
      render: (item) => <span className="text-fha-text">{item.zalo || <span className="text-fha-text-faint italic">Không có</span>}</span>
    },
    {
      key: 'created_at',
      title: 'Ngày Đăng Ký',
      render: (item) => (
        <span className="text-fha-text-muted text-sm">
          {item.created_at ? new Date(item.created_at._seconds ? item.created_at._seconds * 1000 : item.created_at).toLocaleDateString('vi-VN') : 'N/A'}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Hành Động',
      align: 'right',
      render: (item) => (
        <Button 
          variant="danger" 
          size="sm" 
          onClick={() => setConfirmDelete({ id: item.id, email: item.email })}
        >
          Xóa
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Quản Lý Người Dùng" 
        description={`Tổng số: ${users.length} tài khoản`}
        actions={
          <Button 
            variant="ghost" 
            onClick={handleCleanup} 
            loading={cleanupLoading}
            className="text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Dọn Dẹp Acc Rác
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="w-full sm:w-96">
          <Input 
            placeholder="Tìm kiếm người dùng, email, zalo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            }
          />
        </div>
        <Button variant="secondary" onClick={fetchUsers} size="sm">
          Làm Mới
        </Button>
      </div>

      <div className="bg-fha-surface rounded-fha-radius-lg border border-fha-border shadow-fha-md overflow-hidden">
        <Table
          columns={columns}
          data={filteredUsers}
          rowKey={(item) => item.id}
          loading={loading}
          emptyState={
            <div className="py-12 text-center text-fha-text-muted">Không tìm thấy người dùng nào</div>
          }
        />
      </div>

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => !deleteLoading && setConfirmDelete(null)}
        title="Xóa vĩnh viễn tài khoản?"
        message={
          <>
            Bạn có chắc chắn muốn BAN (xóa vĩnh viễn) tài khoản <strong>{confirmDelete?.email}</strong>?
            <br/><br/>
            Hành động này sẽ XÓA TOÀN BỘ dữ liệu người dùng, bao gồm tất cả License Key và Đơn hàng của họ. Không thể khôi phục!
          </>
        }
        confirmText="Xóa Vĩnh Viễn"
        onConfirm={handleDelete}
        loading={deleteLoading}
        danger
      />
    </div>
  );
}
