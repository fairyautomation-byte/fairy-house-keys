'use client';
import { useState, useEffect } from 'react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState(false);

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

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Bạn có chắc chắn muốn BAN (xóa vĩnh viễn) tài khoản: ${email}?\n\nHành động này sẽ XÓA TOÀN BỘ dữ liệu người dùng, bao gồm tất cả License Key và Đơn hàng của họ. Không thể khôi phục!`)) return;
    
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      alert(`Đã xóa vĩnh viễn tài khoản ${email}!`);
      fetchUsers();
    } else {
      const err = await res.json();
      alert('Lỗi: ' + err.error);
    }
  };

  const handleCleanup = async () => {
    if (!confirm('Bạn có chắc chắn muốn dọn dẹp các tài khoản rác (chưa xác thực email quá 24h)?')) return;
    
    setCleanupLoading(true);
    try {
      const res = await fetch('/api/admin/cleanup-users', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(`Đã dọn dẹp thành công!\n- Xóa ${data.deletedUsers} tài khoản rác\n- Xóa ${data.deletedSessions} phiên OTP cũ`);
        fetchUsers();
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (err: any) {
      alert('Lỗi hệ thống');
    } finally {
      setCleanupLoading(false);
    }
  };

  if (loading && users.length === 0) return <div className="py-20 text-center">Đang tải danh sách người dùng...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Người dùng</h1>
          <div className="text-sm text-slate-500 font-medium mt-1">Tổng số: {users.length} tài khoản</div>
        </div>
        <button 
          onClick={handleCleanup} 
          disabled={cleanupLoading}
          className="px-4 py-2 bg-rose-100 text-rose-700 font-semibold rounded-xl hover:bg-rose-200 transition-colors border border-rose-200 shadow-sm disabled:opacity-50 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          {cleanupLoading ? 'Đang dọn dẹp...' : 'Dọn dẹp acc rác'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                <th className="p-4 font-semibold whitespace-nowrap">Họ Tên</th>
                <th className="p-4 font-semibold whitespace-nowrap">Email</th>
                <th className="p-4 font-semibold whitespace-nowrap">Trạng thái</th>
                <th className="p-4 font-semibold whitespace-nowrap">Zalo</th>
                <th className="p-4 font-semibold whitespace-nowrap">Ngày đăng ký</th>
                <th className="p-4 font-semibold whitespace-nowrap text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-medium text-slate-900">{u.full_name}</td>
                  <td className="p-4">{u.email}</td>
                  <td className="p-4">
                    {u.email_verified ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        Đã xác thực
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                        Chưa xác thực
                      </span>
                    )}
                  </td>
                  <td className="p-4">{u.zalo || <span className="text-slate-400 italic">Không có</span>}</td>
                  <td className="p-4">
                    {u.created_at ? new Date(u.created_at._seconds * 1000 || u.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(u.id, u.email)}
                      className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white font-medium transition-colors border border-red-100 hover:border-red-600 shadow-sm"
                      title="Ban tài khoản này"
                    >
                      Xóa / Ban
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Chưa có người dùng nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
