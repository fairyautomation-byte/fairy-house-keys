'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function UserDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user/dashboard')
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then(setData)
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
    </div>
  );
  if (!data) return null;

  const { user, license, orders } = data;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Đã copy License Key!');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">
      
      {/* Background Aurora */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/10 blur-[120px]"></div>
      </div>

      {/* Header */}
      <header className="bg-slate-900/60 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="w-10 h-10 relative flex items-center justify-center rounded-xl bg-slate-800/50 p-1 border border-slate-700/50 shadow-[0_0_15px_rgba(6,182,212,0.2)] overflow-hidden hover:scale-105 transition-transform">
              <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-contain" />
            </Link>
            <span className="font-bold text-lg text-slate-100 hidden sm:block">Dashboard</span>
            <Link href="/" className="text-sm font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-500/10 px-3 py-1.5 rounded-full border border-cyan-500/20 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Về Trang Chủ
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-300 font-medium hidden sm:block">{user.full_name}</span>
            <button onClick={() => {
              fetch('/api/auth/login', { method: 'DELETE' }).then(() => router.push('/login'));
            }} className="text-sm text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 px-4 py-2 rounded-xl transition-all font-medium flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 relative z-10">
        
        {/* Active License */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-extrabold text-white">License hiện tại</h2>
            {license && (
              <Link href="/#pricing" className="text-sm font-bold bg-gradient-to-r from-cyan-500 to-violet-500 text-white px-4 py-2 rounded-xl hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Gia hạn / Nâng cấp gói
              </Link>
            )}
          </div>
          
          {license ? (
            <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-8 border border-slate-700/50 shadow-xl relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
              <div className="absolute top-0 right-0 p-6">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  {license.status}
                </span>
              </div>
              
              <div className="mb-10 mt-2">
                <h3 className="text-xs font-bold text-cyan-500/80 uppercase tracking-widest mb-3">License Key Bảo Mật</h3>
                <div className="flex items-center gap-3">
                  <code className="text-xl sm:text-2xl font-black text-white bg-slate-950 px-5 py-3 rounded-2xl tracking-widest border border-slate-800 shadow-inner break-all">{license.license_key}</code>
                  <button onClick={() => handleCopy(license.license_key)} className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-500/40 transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)] shrink-0" title="Sao chép Key">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800/80">
                  <div className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Gói dịch vụ</div>
                  <div className="font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 uppercase">{license.plan_id}</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800/80">
                  <div className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Ngày hết hạn</div>
                  <div className="font-bold text-xl text-slate-200">
                    {license.expires_at ? new Date(license.expires_at._seconds * 1000).toLocaleDateString('vi-VN') : 'Không giới hạn ♾️'}
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800/80">
                  <div className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Tổng lượt scan</div>
                  <div className="font-bold text-xl text-slate-200">{license.total_scans.toLocaleString()}</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-8 p-6 rounded-2xl border border-slate-800/80 bg-slate-950/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-violet-500/5"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <div className="text-xs font-bold text-cyan-500/80 uppercase tracking-widest mb-1">Hạn mức hôm nay</div>
                      <div className="font-black text-2xl text-slate-200">
                        <span className="text-cyan-400">{license.daily_used}</span>
                        <span className="text-slate-600 mx-2">/</span>
                        {license.daily_limit === -1 || license.daily_limit === null ? '∞' : license.daily_limit}
                      </div>
                    </div>
                    {license.daily_limit !== -1 && license.daily_limit !== null && (
                      <div className="text-sm font-bold text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                        Còn lại: <span className="text-white">{license.daily_limit - license.daily_used}</span>
                      </div>
                    )}
                  </div>
                  {license.daily_limit !== -1 && license.daily_limit !== null && (
                    <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-800 shadow-inner">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${license.daily_used / license.daily_limit > 0.9 ? 'bg-gradient-to-r from-rose-500 to-red-500' : 'bg-gradient-to-r from-cyan-500 to-violet-500'}`}
                        style={{ width: `${Math.min(100, (license.daily_used / license.daily_limit) * 100)}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-12 text-center border border-slate-700/50 shadow-xl">
              <div className="w-20 h-20 mx-auto bg-slate-800 rounded-2xl flex items-center justify-center text-cyan-400 mb-6 border border-slate-700 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h3 className="text-xl font-extrabold text-white mb-3">Bạn chưa có License nào</h3>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">Hãy bắt đầu bằng việc đăng ký gói Trial miễn phí hoặc nâng cấp lên gói cao cấp để sử dụng toàn bộ tính năng.</p>
              <Link href="/#pricing" className="inline-block px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:-translate-y-1 transition-all">
                ĐĂNG KÝ GÓI NGAY 👉
              </Link>
            </div>
          )}
        </section>

        {/* Lịch sử giao dịch */}
        <section>
          <h2 className="text-2xl font-extrabold text-white mb-4">Lịch sử giao dịch</h2>
          <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl border border-slate-700/50 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-950/80 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Mã Giao Dịch</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Gói</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Số Tiền</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">Chưa có giao dịch nào</td>
                    </tr>
                  ) : (
                    orders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-5 font-mono text-sm text-cyan-400">{order.transaction_code}</td>
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Change Password */}
        <section>
          <h2 className="text-2xl font-extrabold text-white mb-4">Bảo mật tài khoản</h2>
          <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl border border-slate-700/50 shadow-xl overflow-hidden max-w-xl">
            <ChangePasswordForm />
          </div>
        </section>

      </main>
    </div>
  );
}

function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ oldPassword: '', newPassword: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Có lỗi xảy ra');
      
      setSuccess(data.message);
      setForm({ oldPassword: '', newPassword: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h3 className="text-lg font-bold text-white mb-6">Đổi mật khẩu</h3>
      
      {error && <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">{error}</div>}
      {success && <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">{success}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-slate-400 mb-2">Mật khẩu cũ</label>
          <input required type="password" value={form.oldPassword} onChange={e => setForm({...form, oldPassword: e.target.value})} className="w-full px-5 py-3 rounded-xl bg-slate-950 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-white" placeholder="••••••••" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-400 mb-2">Mật khẩu mới</label>
          <input required minLength={6} type="password" value={form.newPassword} onChange={e => setForm({...form, newPassword: e.target.value})} className="w-full px-5 py-3 rounded-xl bg-slate-950 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-white" placeholder="Ít nhất 6 ký tự" />
        </div>
        <button disabled={loading || !form.oldPassword || form.newPassword.length < 6} type="submit" className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 border border-slate-600 disabled:opacity-50 transition-colors mt-2">
          {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </form>
    </div>
  );
}
