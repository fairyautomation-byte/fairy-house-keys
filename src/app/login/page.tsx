'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PasswordInput from '@/components/ui/PasswordInput';
import Alert from '@/components/ui/Alert';

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
    <div className="min-h-screen bg-[var(--fha-surface-2)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Logo */}
      <Link href="/" className="mb-8 flex flex-col items-center gap-3 relative z-10 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)] rounded-fha">
        <Image src="/logo.png" alt="Logo" width={48} height={48} className="rounded" />
      </Link>

      <div className="w-full max-w-[420px] bg-white shadow-fha-lg rounded-fha-lg border border-[var(--fha-border)] overflow-hidden animate-slide-up relative z-10">
        <div className="p-6 sm:p-8">
          <div className="text-center mb-8">
            <h1 className="text-[22px] font-bold text-[var(--fha-text)] mb-1">Đăng nhập</h1>
            <p className="text-[14px] text-[var(--fha-text-muted)]">
              Chào mừng trở lại Fairy House AutoData
            </p>
          </div>

          {error && (
            <Alert variant="danger" className="mb-6">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              required
              placeholder="email@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              leftIcon={
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />

            <PasswordInput
              label={
                <div className="flex justify-between items-center w-full">
                  <span>Mật khẩu</span>
                  <Link href="/forgot-password" className="text-xs font-semibold text-[var(--fha-brand)] hover:text-[var(--fha-brand-hover)] transition-colors focus-visible:outline-none focus-visible:underline">
                    Quên mật khẩu?
                  </Link>
                </div>
              }
              required
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              leftIcon={
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />

            <Button type="submit" variant="primary" fullWidth size="lg" loading={loading} className="mt-2 h-[44px]">
              Đăng Nhập
            </Button>
          </form>
        </div>

        {/* Footer Link */}
        <div className="px-6 py-5 border-t border-[var(--fha-border)] bg-[var(--fha-surface-2)] text-center">
          <p className="text-[14px] text-[var(--fha-text-muted)]">
            Chưa có tài khoản?{' '}
            <Link href={`/register${defaultPlan ? `?plan=${defaultPlan}` : ''}`} className="font-semibold text-[var(--fha-brand)] hover:text-[var(--fha-brand-hover)] focus-visible:outline-none focus-visible:underline">
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
    <Suspense fallback={<div className="min-h-screen bg-[var(--fha-surface-2)] flex items-center justify-center"><div className="shimmer w-10 h-10 rounded-fha"></div></div>}>
      <LoginContent />
    </Suspense>
  );
}
