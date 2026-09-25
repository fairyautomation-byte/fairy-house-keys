'use client';

import { useState, useEffect, useCallback } from 'react';

type Request = {
  id: string;
  fullName: string;
  email: string;
  zalo: string;
  packageType: string;
  purpose: string;
  status: string;
  createdAt: string | null;
};

const PACKAGE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  trial: { label: 'Trial (1 ngày)', icon: '🆓', color: 'text-slate-300 bg-slate-700' },
  standard: { label: 'Standard (30 ngày)', icon: '⭐', color: 'text-blue-300 bg-blue-900/40' },
  pro: { label: 'Pro (90 ngày)', icon: '🚀', color: 'text-violet-300 bg-violet-900/40' },
  lifetime: { label: 'Lifetime (Vĩnh viễn)', icon: '💎', color: 'text-amber-300 bg-amber-900/40' },
};

const GRANT_PACKAGES = [
  { id: 'trial', label: '🆓 Trial (1 ngày)', btnClass: 'bg-slate-700 hover:bg-slate-600 text-slate-200' },
  { id: 'standard', label: '⭐ Standard (30 ngày)', btnClass: 'bg-blue-800 hover:bg-blue-700 text-blue-200' },
  { id: 'pro', label: '🚀 Cấp Pro (90 ngày)', btnClass: 'bg-violet-800 hover:bg-violet-700 text-violet-200' },
  { id: 'lifetime', label: '💎 Lifetime', btnClass: 'bg-amber-800 hover:bg-amber-700 text-amber-200' },
];

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'granted' | 'all'>('pending');
  const [grantingId, setGrantingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/requests?status=${filter}`);
      const data = await res.json();
      setRequests(data.requests || []);
    } catch {
      setToast({ msg: 'Lỗi tải dữ liệu', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleGrant = async (requestId: string, packageType: string) => {
    setGrantingId(requestId + packageType);
    try {
      const res = await fetch('/api/admin/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, packageType }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast(`✅ Đã cấp key ${packageType.toUpperCase()} và gửi email cho khách!`, 'success');
        fetchRequests();
      } else {
        showToast(`❌ Lỗi: ${data.error}`, 'error');
      }
    } catch {
      showToast('❌ Lỗi kết nối', 'error');
    } finally {
      setGrantingId(null);
    }
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('vi-VN');
  };

  return (
    <div className="animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold animate-slide-up ${
          toast.type === 'success' ? 'bg-emerald-900 border border-emerald-500/40 text-emerald-200' : 'bg-red-900 border border-red-500/40 text-red-200'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">📋 Đơn Xin Key</h1>
          <p className="text-slate-400 text-sm mt-0.5">Xem xét và cấp key cho khách hàng</p>
        </div>
        <button onClick={fetchRequests} className="px-4 py-2 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition-all text-sm font-semibold">
          🔄 Làm mới
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['pending', 'granted', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === f
                ? 'bg-violet-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {f === 'pending' ? '⏳ Chờ duyệt' : f === 'granted' ? '✅ Đã xử lý' : '📋 Tất cả'}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="glass rounded-xl p-4 h-32 shimmer" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-slate-400">Không có đơn nào {filter === 'pending' ? 'đang chờ' : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const pkg = PACKAGE_LABELS[req.packageType] || { label: req.packageType, icon: '📦', color: 'text-slate-300 bg-slate-700' };
            const isPending = req.status === 'pending';
            return (
              <div
                key={req.id}
                className={`glass rounded-xl p-4 border transition-all ${
                  isPending ? 'border-violet-500/20 hover:border-violet-500/40' : 'border-slate-700/50 opacity-80'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="font-bold text-white">{req.fullName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${pkg.color}`}>
                        {pkg.icon} {pkg.label}
                      </span>
                      {req.status === 'granted' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-300 font-semibold">✅ Đã cấp</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm text-slate-400">
                      <span>📧 {req.email}</span>
                      <span>📱 {req.zalo}</span>
                      <span>🕐 {formatTime(req.createdAt)}</span>
                      {req.purpose && <span className="md:col-span-2">💬 {req.purpose}</span>}
                    </div>
                  </div>

                  {/* Grant buttons */}
                  {isPending && (
                    <div className="flex flex-wrap gap-2 flex-shrink-0">
                      {GRANT_PACKAGES.map(gp => (
                        <button
                          key={gp.id}
                          onClick={() => handleGrant(req.id, gp.id)}
                          disabled={!!grantingId}
                          className={`px-3 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${gp.btnClass}`}
                        >
                          {grantingId === req.id + gp.id ? '⏳...' : gp.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
