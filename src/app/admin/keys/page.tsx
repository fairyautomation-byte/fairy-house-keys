'use client';

import { useState, useEffect, useCallback } from 'react';

type LicenseKey = {
  id: string;
  key: string;
  type: string;
  userEmail: string;
  userName: string;
  status: string;
  createdAt: string | null;
  expiresAt: string | null;
  machineIds: string[];
  scanLimit: number;
};

const TYPE_INFO: Record<string, { icon: string; color: string }> = {
  trial: { icon: '🆓', color: 'text-slate-300' },
  standard: { icon: '⭐', color: 'text-blue-300' },
  pro: { icon: '🚀', color: 'text-violet-300' },
  lifetime: { icon: '💎', color: 'text-amber-300' },
};

const STATUS_INFO: Record<string, { icon: string; color: string }> = {
  active: { icon: '🟢', color: 'text-emerald-400' },
  expired: { icon: '🟡', color: 'text-yellow-400' },
  revoked: { icon: '🔴', color: 'text-red-400' },
};

export default function AdminKeysPage() {
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: filterStatus, type: filterType });
      const res = await fetch(`/api/admin/keys?${params}`);
      const data = await res.json();
      setKeys(data.keys || []);
    } catch {
      setToast({ msg: 'Lỗi tải dữ liệu', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType]);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleRevoke = async (keyId: string, keyStr: string) => {
    if (!confirm(`Thu hồi key:\n${keyStr}\n\nBạn chắc chắn?`)) return;
    setRevokingId(keyId);
    try {
      const res = await fetch('/api/admin/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast('✅ Đã thu hồi key thành công', 'success');
        fetchKeys();
      } else {
        showToast(`❌ ${data.error}`, 'error');
      }
    } catch {
      showToast('❌ Lỗi kết nối', 'error');
    } finally {
      setRevokingId(null);
    }
  };

  const handleCopy = async (keyStr: string, id: string) => {
    await navigator.clipboard.writeText(keyStr);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = keys.filter(k =>
    !search ||
    k.key.toLowerCase().includes(search.toLowerCase()) ||
    k.userEmail.toLowerCase().includes(search.toLowerCase()) ||
    k.userName.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('vi-VN') : '♾️ Vĩnh viễn';

  return (
    <div className="animate-fade-in">
      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold animate-slide-up ${
          toast.type === 'success' ? 'bg-emerald-900 border border-emerald-500/40 text-emerald-200' : 'bg-red-900 border border-red-500/40 text-red-200'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">🗝️ Quản Lý Key</h1>
          <p className="text-slate-400 text-sm mt-0.5">{filtered.length} key {filterStatus !== 'all' ? filterStatus : 'tổng cộng'}</p>
        </div>
        <button onClick={fetchKeys} className="px-4 py-2 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition-all text-sm font-semibold">
          🔄 Làm mới
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="🔍 Tìm theo key, email, tên..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition-all placeholder-slate-500"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-slate-300 text-sm focus:outline-none"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">🟢 Active</option>
          <option value="expired">🟡 Hết hạn</option>
          <option value="revoked">🔴 Đã thu hồi</option>
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-slate-300 text-sm focus:outline-none"
        >
          <option value="all">Tất cả gói</option>
          <option value="trial">🆓 Trial</option>
          <option value="standard">⭐ Standard</option>
          <option value="pro">🚀 Pro</option>
          <option value="lifetime">💎 Lifetime</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="glass rounded-xl h-16 shimmer" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-slate-400">Không tìm thấy key nào</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(k => {
            const typeInfo = TYPE_INFO[k.type] || { icon: '📦', color: 'text-slate-300' };
            const statusInfo = STATUS_INFO[k.status] || { icon: '⚪', color: 'text-slate-400' };
            return (
              <div key={k.id} className="glass rounded-xl p-3 md:p-4 border border-slate-700/50 hover:border-slate-600/50 transition-all">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <code className="text-xs font-mono text-violet-300 bg-violet-950/40 px-2 py-0.5 rounded border border-violet-800/50 truncate max-w-[280px]">
                        {k.key}
                      </code>
                      <button
                        onClick={() => handleCopy(k.key, k.id)}
                        className="text-xs text-slate-400 hover:text-white transition-colors"
                        title="Copy key"
                      >
                        {copiedId === k.id ? '✅' : '📋'}
                      </button>
                      <span className={`text-xs font-semibold ${typeInfo.color}`}>{typeInfo.icon} {k.type.toUpperCase()}</span>
                      <span className={`text-xs font-semibold ${statusInfo.color}`}>{statusInfo.icon} {k.status}</span>
                    </div>
                    <div className="text-xs text-slate-400 flex gap-4 flex-wrap">
                      <span>👤 {k.userName}</span>
                      <span>📧 {k.userEmail}</span>
                      <span>📅 Tạo: {formatDate(k.createdAt)}</span>
                      <span>⏰ HH: {formatDate(k.expiresAt)}</span>
                      <span>💻 {k.machineIds?.length || 0} máy</span>
                    </div>
                  </div>
                  {k.status === 'active' && (
                    <button
                      onClick={() => handleRevoke(k.id, k.key)}
                      disabled={revokingId === k.id}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-400 hover:bg-red-900/40 transition-all disabled:opacity-50 flex-shrink-0"
                    >
                      {revokingId === k.id ? '⏳...' : '🚫 Thu hồi'}
                    </button>
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
