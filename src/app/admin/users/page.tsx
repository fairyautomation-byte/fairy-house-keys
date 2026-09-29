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

  if (loading && users.length === 0) return (
    <div className="py-20 flex justify-center">
      <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Quản lý Người dùng</h1>
          <div className="text-sm font-bold text-cyan-500/80 uppercase tracking-widest mt-2">Tổng số: {users.length} tài khoản</div>
        </div>
        <button 
          onClick={handleCleanup} 
          disabled={cleanupLoading}
          className="px-5 py-2.5 bg-rose-500/10 text-rose-400 font-bold rounded-xl hover:bg-rose-500/20 transition-all border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)] disabled:opacity-50 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          {cleanupLoading ? 'Đang dọn dẹp...' : 'Dọn dẹp acc rác'}
        </button>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl border border-slate-700/50 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="p-5 whitespace-nowrap">Họ Tên</th>
                <th className="p-5 whitespace-nowrap">Email</th>
                <th className="p-5 whitespace-nowrap">Trạng thái</th>
                <th className="p-5 whitespace-nowrap">Zalo</th>
                <th className="p-5 whitespace-nowrap">Ngày đăng ký</th>
                <th className="p-5 whitespace-nowrap text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-sm text-slate-300">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-5 font-bold text-white">{u.full_name}</td>
                  <td className="p-5">{u.email}</td>
                  <td className="p-5">
                    {u.email_verified ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Đã xác thực
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Chưa xác thực
                      </span>
                    )}
                  </td>
                  <td className="p-5">{u.zalo || <span className="text-slate-500 italic">Không có</span>}</td>
                  <td className="p-5">
                    {u.created_at ? new Date(u.created_at._seconds * 1000 || u.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                  </td>
                  <td className="p-5 text-right">
                    <button
                      onClick={() => handleDelete(u.id, u.email)}
                      className="px-4 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white font-bold transition-all border border-rose-500/20 hover:border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.1)]"
                      title="Ban tài khoản này"
                    >
                      Xóa / Ban
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500 font-medium">Chưa có người dùng nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
