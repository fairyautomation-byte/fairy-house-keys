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

  if (loading && !data) return (
    <div className="py-20 flex justify-center">
      <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
    </div>
  );
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
      <h1 className="text-3xl font-extrabold text-white">Tổng quan hệ thống</h1>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50 shadow-xl relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-cyan-500/10 transition-colors"></div>
          <div className="text-sm text-slate-400 font-bold mb-2 uppercase tracking-widest">Tổng Users</div>
          <div className="text-4xl font-black text-white">{stats.totalUsers}</div>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50 shadow-xl relative overflow-hidden group hover:border-violet-500/30 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-violet-500/10 transition-colors"></div>
          <div className="text-sm text-slate-400 font-bold mb-2 uppercase tracking-widest">Active Licenses</div>
          <div className="text-4xl font-black text-cyan-400">{stats.activeLicenses}</div>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50 shadow-xl relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-emerald-500/10 transition-colors"></div>
          <div className="text-sm text-slate-400 font-bold mb-2 uppercase tracking-widest">Lượt Scan (All)</div>
          <div className="text-4xl font-black text-emerald-400">{stats.totalScans.toLocaleString()}</div>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50 shadow-xl relative overflow-hidden group hover:border-rose-500/30 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-rose-500/10 transition-colors"></div>
          <div className="text-sm text-slate-400 font-bold mb-2 uppercase tracking-widest">Chờ Duyệt</div>
          <div className="text-4xl font-black text-rose-400">{stats.pendingOrders}</div>
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-extrabold text-white">Giao dịch gần đây</h2>
          <button onClick={fetchDashboard} className="text-sm font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-2 bg-cyan-500/10 px-4 py-2 rounded-xl border border-cyan-500/20 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Làm mới
          </button>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl border border-slate-700/50 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-950/80 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Mã GD</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Gói</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Số Tiền</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Trạng Thái</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {recentOrders.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">Chưa có giao dịch nào</td></tr>
                ) : (
                  recentOrders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-5 font-mono text-sm font-medium text-cyan-400">{order.transaction_code}</td>
                      <td className="px-6 py-5 font-bold uppercase text-sm text-slate-300">{order.plan_id}</td>
                      <td className="px-6 py-5 font-medium text-slate-300">{order.amount.toLocaleString('vi-VN')}đ</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                          order.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          order.status === 'PENDING_PAYMENT_REVIEW' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                          'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {order.status === 'PAID' ? 'THÀNH CÔNG' : order.status === 'PENDING_PAYMENT_REVIEW' ? 'ĐANG CHỜ DUYỆT' : 'THẤT BẠI'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        {order.status === 'PENDING_PAYMENT_REVIEW' && (
                          <div className="flex justify-end gap-3">
                            <button onClick={() => handleApprove(order.id)} className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-bold rounded-lg transition-colors">Duyệt</button>
                            <button onClick={() => handleReject(order.id)} className="px-4 py-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-bold rounded-lg transition-colors">Từ chối</button>
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
    </div>
  );
}
