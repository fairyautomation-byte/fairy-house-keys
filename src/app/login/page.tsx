'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ErrorState from '@/components/ui/ErrorState';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultPlan = searchParams.get('plan');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen bg-fha-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      


      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-3 relative z-10 hover:scale-105 transition-transform">
        <Image src="/logo.png" alt="Logo" width={40} height={40} className="rounded-full shadow-fha-cyan" />
        <span className="font-bold text-xl tracking-tight text-fha-text">
          Fairy House <span className="text-fha-cyan">AutoData</span>
        </span>
      </Link>

      <div className="w-full max-w-[440px] bg-fha-glass backdrop-blur-2xl shadow-fha-outset rounded-3xl border border-fha-glass-border overflow-hidden animate-slide-up relative z-10">
        <div className="p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-fha-text mb-2">Đăng nhập</h1>
            <p className="text-sm text-fha-text-muted">
              Chào mừng trở lại Fairy House AutoData
            </p>
          </div>

          {error && (
            <div className="mb-6">
              <div className="p-3 bg-fha-error-bg border border-fha-error-border rounded-fha-radius text-sm text-fha-error-text font-medium text-center">
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              required
              placeholder="email@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              leftIcon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[13px] font-medium text-fha-text-muted">Mật khẩu *</label>
                <Link href="/forgot-password" className="text-[12px] font-medium text-fha-cyan hover:text-fha-cyan-hover hover:underline transition-colors">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-fha-text-muted z-10">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-fha-bg border-none shadow-fha-inset text-fha-text text-sm rounded-xl placeholder-fha-text-faint transition-all focus:outline-none focus:ring-1 focus:ring-fha-cyan disabled:opacity-50 disabled:cursor-not-allowed pl-11 pr-11 py-3"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-fha-text-muted hover:text-fha-text focus:outline-none"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" variant="primary" fullWidth size="lg" loading={loading} className="mt-2">
              Đăng Nhập
            </Button>
          </form>
        </div>

        {/* Footer Link */}
        <div className="px-8 py-5 border-t border-fha-border bg-fha-surface text-center">
          <p className="text-sm text-fha-text-muted">
            Chưa có tài khoản?{' '}
            <Link href={`/register${defaultPlan ? `?plan=${defaultPlan}` : ''}`} className="font-semibold text-fha-cyan hover:text-fha-cyan-hover hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-fha-bg flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-fha-cyan/20 border-t-fha-cyan rounded-full"></div></div>}>
      <LoginContent />
    </Suspense>
  );
}
