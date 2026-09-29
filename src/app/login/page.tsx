'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultPlan = searchParams.get('plan');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'EMAIL_NOT_VERIFIED') {
          throw new Error(data.error + ` [EMAIL:${data.email}]`);
        }
        throw new Error(data.error || 'Có lỗi xảy ra');
      }

      if (defaultPlan) {
        router.push(`/checkout?plan=${defaultPlan}`);
      } else {
        router.push(`/dashboard`);
      }
    } catch (err: any) {
      if (err.message.includes('EMAIL_NOT_VERIFIED')) {
        // extract email if possible, or just redirect
        const match = err.message.match(/\[EMAIL:(.*?)\]/);
        const email = match ? match[1] : form.email;
        router.push(`/verify-otp?email=${encodeURIComponent(email)}${defaultPlan ? `&plan=${defaultPlan}` : ''}`);
      } else {
        setError(err.message.replace(/\[EMAIL:.*?\]/, ''));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Aurora Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-600/20 blur-[120px] pointer-events-none"></div>

      <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden relative z-10">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 relative flex items-center justify-center overflow-hidden rounded-full shadow-[0_0_20px_rgba(6,182,212,0.3)] border border-slate-700">
              <Image src="/logo.png" alt="Fairy House Auto Data" fill className="object-cover" />
            </div>
          </div>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 mb-2">Đăng nhập</h1>
            <p className="text-slate-400 text-sm">Chào mừng trở lại <strong className="text-emerald-400">Fairy House Auto Data</strong></p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 text-rose-400 text-sm font-medium border border-rose-500/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Email</label>
              <input required type="email" className="w-full px-4 py-3 rounded-xl bg-slate-950/50 border border-slate-700/80 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@example.com" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Mật khẩu</label>
                <Link href="/forgot-password" className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline transition-colors">
                  Quên mật khẩu?
                </Link>
              </div>
              <input required type="password" className="w-full px-4 py-3 rounded-xl bg-slate-950/50 border border-slate-700/80 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" />
            </div>

            <button disabled={loading} type="submit" className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 transition-all mt-6">
              {loading ? 'Đang xử lý...' : 'ĐĂNG NHẬP'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-400 flex flex-col gap-3">
            <div>
              Chưa có tài khoản? <Link href={`/register${defaultPlan ? `?plan=${defaultPlan}` : ''}`} className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors hover:underline">Đăng ký ngay</Link>
            </div>
            <div>
              <Link href="/" className="text-slate-500 hover:text-slate-300 transition-colors mt-2 text-xs">
                &larr; Quay lại trang chủ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
