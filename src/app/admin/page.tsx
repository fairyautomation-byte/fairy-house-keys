'use client';
import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading && !data) return <div className="py-20 text-center">Đang tải...</div>;
  if (!data) return null;

  const { stats, recentOrders } = data;

  const handleApprove = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn duyệt đơn này và cấp License?')) return;
    const res = await fetch(`/api/admin/orders/${id}/approve`, { method: 'POST' });
    if (res.ok) {
      alert('Đã duyệt thành công!');
      fetchDashboard();
    } else {
      const err = await res.json();
      alert('Lỗi: ' + err.error);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Từ chối đơn hàng này?')) return;
    const res = await fetch(`/api/admin/orders/${id}/reject`, { method: 'POST' });
    if (res.ok) {
      alert('Đã từ chối!');
      fetchDashboard();
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Tổng quan hệ thống</h1>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-sm text-slate-500 font-medium mb-1">Tổng Users</div>
          <div className="text-3xl font-bold text-slate-900">{stats.totalUsers}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-sm text-slate-500 font-medium mb-1">Active Licenses</div>
          <div className="text-3xl font-bold text-blue-600">{stats.activeLicenses}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-sm text-slate-500 font-medium mb-1">Lượt Scan (All)</div>
          <div className="text-3xl font-bold text-slate-900">{stats.totalScans.toLocaleString()}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-sm text-slate-500 font-medium mb-1">Chờ Duyệt</div>
          <div className="text-3xl font-bold text-red-600">{stats.pendingOrders}</div>
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Giao dịch gần đây</h2>
          <button onClick={fetchDashboard} className="text-sm text-blue-600 hover:underline">Làm mới</button>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Mã GD</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Gói</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Số Tiền</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Trạng Thái</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Chưa có giao dịch nào</td></tr>
              ) : (
                recentOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm font-medium">{order.transaction_code}</td>
                    <td className="px-6 py-4 uppercase text-sm">{order.plan_id}</td>
                    <td className="px-6 py-4">{order.amount.toLocaleString('vi-VN')}đ</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'PAID' ? 'bg-green-100 text-green-800' : 
                        order.status === 'PENDING_PAYMENT_REVIEW' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {order.status === 'PENDING_PAYMENT_REVIEW' && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleApprove(order.id)} className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700">Duyệt</button>
                          <button onClick={() => handleReject(order.id)} className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded hover:bg-red-200">Từ chối</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
