'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultPlan = searchParams.get('plan') || 'monthly';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    zalo: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại!');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra');
      }

      // Success, go to verify OTP
      router.push(`/verify-otp?email=${encodeURIComponent(data.fullEmail)}&plan=${defaultPlan}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-fha-bg flex flex-col items-center justify-center p-4 py-10 relative overflow-hidden">
      
      {/* Background Aurora Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-fha-cyan rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-3 relative z-10 hover:scale-105 transition-transform">
        <Image src="/logo.png" alt="Logo" width={40} height={40} className="rounded-full shadow-fha-cyan" />
        <span className="font-bold text-xl tracking-tight text-fha-text">
          Fairy House <span className="text-fha-cyan">AutoData</span>
        </span>
      </Link>

      {/* Main Card */}
      <div className="w-full max-w-[440px] bg-fha-surface/80 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.3)] shadow-fha-cyan/5 rounded-fha-radius-lg border border-fha-border overflow-hidden animate-slide-up relative z-10">
        <div className="p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-fha-text mb-2">Tạo tài khoản</h1>
            <p className="text-sm text-fha-text-muted">
              Tham gia hệ sinh thái Fairy House AutoData
            </p>
          </div>

          {error && (
            <div className="mb-6">
              <div className="p-3 bg-fha-error-bg border border-fha-error-border rounded-fha-radius text-sm text-fha-error-text font-medium text-center">
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Họ và tên"
              type="text"
              required
              placeholder="Nguyễn Văn A"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />

            <Input
              label="Email"
              type="email"
              required
              placeholder="email@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <Input
              label="Số điện thoại / Zalo"
              type="text"
              placeholder="0912345678"
              value={form.zalo}
              onChange={(e) => setForm({ ...form, zalo: e.target.value })}
            />

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-fha-text-muted">Mật khẩu *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-fha-surface-2 border text-fha-text text-sm rounded-fha-radius placeholder-fha-text-faint transition-all focus:outline-none focus:ring-2 focus:ring-fha-cyan focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed pl-3 pr-10 border-fha-border py-2.5"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-fha-text-muted hover:text-fha-text focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5 pb-2">
              <label className="text-[13px] font-medium text-fha-text-muted">Xác nhận mật khẩu *</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full bg-fha-surface-2 border text-fha-text text-sm rounded-fha-radius placeholder-fha-text-faint transition-all focus:outline-none focus:ring-2 focus:ring-fha-cyan focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed pl-3 pr-3 border-fha-border py-2.5"
              />
            </div>

            <Button type="submit" variant="primary" fullWidth size="lg" loading={loading}>
              Đăng Ký Ngay
            </Button>
          </form>
        </div>

        {/* Footer Link */}
        <div className="px-8 py-5 border-t border-fha-border bg-fha-surface text-center">
          <p className="text-sm text-fha-text-muted">
            Đã có tài khoản?{' '}
            <Link href={`/login${defaultPlan ? `?plan=${defaultPlan}` : ''}`} className="font-semibold text-fha-cyan hover:text-fha-cyan-hover hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-fha-bg flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-fha-cyan/20 border-t-fha-cyan rounded-full"></div></div>}>
      <RegisterContent />
    </Suspense>
  );
}
