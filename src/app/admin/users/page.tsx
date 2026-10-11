'use client';
import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Table, { Column } from '@/components/ui/Table';
import StatusBadge from '@/components/features/StatusBadge';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';
import { ConfirmModal } from '@/components/ui/Modal';
import { formatDate, formatCurrency } from '@/lib/format';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [confirmDelete, setConfirmDelete] = useState<{id: string, email: string} | null>(null);
  const [confirmCleanup, setConfirmCleanup] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const { success, error } = useToast();

  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [pageHistory, setPageHistory] = useState<Array<string | null>>([null]);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchUsers = async (targetCursor?: string | null, pageNum: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (targetCursor) params.set('cursor', targetCursor);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const nextCursor = res.headers.get('x-next-cursor');
      const more = res.headers.get('x-has-more') === 'true';
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
      setCursor(nextCursor);
      setHasMore(more);
      setCurrentPage(pageNum);
    } catch (_) {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (!cursor) return;
    const nextPage = currentPage + 1;
    setPageHistory(prev => [...prev.slice(0, currentPage), cursor]);
    fetchUsers(cursor, nextPage);
  };

  const handlePrevPage = () => {
    if (currentPage <= 1) return;
    const prevPage = currentPage - 1;
    const prevCursor = pageHistory[prevPage - 1] || null;
    fetchUsers(prevCursor, prevPage);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPageHistory([null]);
    fetchUsers(null, 1);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleteLoading(true);
    
    try {
      const res = await fetch(`/api/admin/users/${confirmDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        success(`Đã xóa vĩnh viễn tài khoản ${confirmDelete.email}!`);
        setUsers(prev => prev.filter(u => u.id !== confirmDelete.id));
        fetchUsers();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Không thể xóa tài khoản');
      }
    } catch (err: any) {
      error('Lỗi: ' + err.message);
    } finally {
      setDeleteLoading(false);
      setConfirmDelete(null);
    }
  };

  const handleCleanup = async () => {
    setCleanupLoading(true);
    try {
      const res = await fetch('/api/admin/cleanup-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: false }),
      });
      const data = await res.json();
      if (res.ok) {
        success(`Đã xóa ${data.deletedUsers} tài khoản rác và ${data.deletedSessions} phiên OTP cũ`);
        fetchUsers();
      } else {
        throw new Error(data.error || 'Lỗi dọn dẹp');
      }
    } catch (err: any) {
      error('Lỗi: ' + (err.message || 'Lỗi hệ thống'));
    } finally {
      setCleanupLoading(false);
      setConfirmCleanup(false);
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
      render: (item) => <span className="font-bold text-[var(--fha-text)]">{item.full_name}</span>
    },
    {
      key: 'email',
      title: 'Email',
      render: (item) => <span className="text-[var(--fha-text)]">{item.email}</span>
    },
    {
      key: 'email_verified',
      title: 'Trạng Thái',
      render: (item) => (
        item.status === 'DELETED'
          ? <StatusBadge status="REVOKED" size="sm" />
          : item.email_verified 
            ? <StatusBadge status="ACTIVE" size="sm" /> 
            : <StatusBadge status="PENDING" size="sm" />
      )
    },
    {
      key: 'zalo',
      title: 'Zalo',
      render: (item) => <span className="text-[var(--fha-text)]">{item.zalo || <span className="text-[var(--fha-text-faint)] italic">Không có</span>}</span>
    },
    {
      key: 'created_at',
      title: 'Ngày Đăng Ký',
      render: (item) => (
        <span className="text-[var(--fha-text-muted)] text-[13px] font-medium">
          {item.created_at ? formatDate(item.created_at._seconds ? item.created_at._seconds * 1000 : item.created_at) : 'N/A'}
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
    <div className="space-y-8">
      <PageHeader 
        title="Quản Lý Người Dùng" 
        description={`Tổng số: ${users.length} tài khoản`}
        actions={
          <Button 
            variant="ghost" 
            onClick={() => setConfirmCleanup(true)} 
            loading={cleanupLoading}
            className="text-[var(--fha-warning)] hover:text-[#d97706] hover:bg-[#fffbeb]"
          >
            <svg className="w-[16px] h-[16px] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Dọn Dẹp Acc Rác
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-auto">
          <div className="w-full sm:w-[400px]">
            <Input 
              placeholder="Tìm kiếm người dùng, email, zalo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              }
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="bg-white">
            Tìm
          </Button>
        </form>
        <Button variant="secondary" onClick={() => { setSearchQuery(''); setPageHistory([null]); fetchUsers(null, 1); }} size="sm" className="bg-white">
          Làm Mới
        </Button>
      </div>

      <div className="bg-white rounded-fha-lg border border-[var(--fha-border)] overflow-hidden shadow-sm">
        <Table
          columns={columns}
          data={filteredUsers}
          rowKey={(item) => item.id}
          mobileRender={(item) => (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[var(--fha-text)]">{item.full_name || 'Khách hàng'}</span>
                <StatusBadge status={item.email_verified ? 'ACTIVE' : 'PENDING'} size="sm" />
              </div>
              <div className="text-xs text-[var(--fha-text-muted)] truncate">{item.email}</div>
              <div className="flex items-center justify-between pt-1 border-t border-[var(--fha-border)] text-xs">
                <span className="font-mono text-[var(--fha-brand)] font-bold">{formatCurrency(item.wallet_balance || 0)}</span>
                <button
                  onClick={() => setConfirmDelete({ id: item.id, email: item.email })}
                  className="text-xs font-semibold text-[var(--fha-error)] hover:underline"
                >
                  Xóa tài khoản
                </button>
              </div>
            </div>
          )}
          emptyState={
            <div className="py-12 text-center text-[var(--fha-text-muted)] text-[14px]">Không tìm thấy người dùng nào</div>
          }
        />

        {/* Keyset / Cursor Pagination Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--fha-border)] bg-gray-50/50">
          <div className="text-sm text-[var(--fha-text-muted)]">
            Trang <span className="font-semibold text-[var(--fha-text)]">{currentPage}</span>
            {users.length > 0 && <span> ({users.length} người dùng hiển thị)</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage <= 1 || loading}
            >
              ← Trang trước
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleNextPage}
              disabled={!hasMore || !cursor || loading}
            >
              Trang tiếp →
            </Button>
          </div>
        </div>
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

      <ConfirmModal
        open={confirmCleanup}
        onClose={() => !cleanupLoading && setConfirmCleanup(false)}
        title="Dọn dẹp tài khoản rác"
        message="Bạn có chắc chắn muốn dọn dẹp các tài khoản rác (chưa xác thực email quá 24h)? Việc này sẽ giúp giải phóng dung lượng hệ thống."
        confirmText="Dọn Dẹp Ngay"
        onConfirm={async () => {
          await handleCleanup();
          setConfirmCleanup(false);
        }}
        loading={cleanupLoading}
      />
    </div>
  );
}
