'use client';
import { useState, useEffect } from 'react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading && users.length === 0) return <div className="py-20 text-center">Đang tải danh sách người dùng...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý Người dùng</h1>
        <div className="text-sm text-slate-500 font-medium">Tổng số: {users.length} tài khoản</div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                <th className="p-4 font-semibold whitespace-nowrap">Họ Tên</th>
                <th className="p-4 font-semibold whitespace-nowrap">Email</th>
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
