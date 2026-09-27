'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        router.push('/admin/requests');
        router.refresh();
      } else {
        setError(data.error || 'Sai thông tin đăng nhập');
      }
    } catch {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1e] via-[#0d1429] to-[#0a0f1e] flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-3xl mx-auto mb-4 glow-purple">
            🔐
          </div>
          <h1 className="text-2xl font-black gradient-text">Admin Panel</h1>
          <p className="text-slate-400 text-sm mt-1">Fairy House AutoData</p>
        </div>

        <div className="glass rounded-2xl p-6 shadow-2xl">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-sm">
              ⚠️ {error}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Tên đăng nhập</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                className="w-full bg-slate-800/80 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 transition-all"
                placeholder="admin"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Mật khẩu</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="w-full bg-slate-800/80 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-bold hover:brightness-110 transition-all shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Đang đăng nhập...</>
              ) : '🔓 Đăng Nhập'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
