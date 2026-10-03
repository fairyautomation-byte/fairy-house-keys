'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PasswordInput from '@/components/ui/PasswordInput';
import Alert from '@/components/ui/Alert';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultPlan = searchParams.get('plan') || 'monthly';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div className="min-h-screen bg-[var(--fha-surface-2)] flex flex-col items-center justify-center p-4 py-10 relative overflow-hidden">
      
      {/* Logo */}
      <Link href="/" className="mb-8 flex flex-col items-center gap-3 relative z-10 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)] rounded-fha">
        <Image src="/logo.png" alt="Logo" width={48} height={48} className="rounded" />
      </Link>

      <div className="w-full max-w-[420px] bg-white shadow-fha-lg rounded-fha-lg border border-[var(--fha-border)] overflow-hidden animate-slide-up relative z-10">
        <div className="p-6 sm:p-8">
          <div className="text-center mb-8">
            <h1 className="text-[22px] font-bold text-[var(--fha-text)] mb-1">Tạo tài khoản</h1>
            <p className="text-[14px] text-[var(--fha-text-muted)]">
              Tham gia hệ sinh thái Fairy House AutoData
            </p>
          </div>

          {error && (
            <Alert variant="danger" className="mb-6">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Họ và tên"
              type="text"
              required
              placeholder="Nguyễn Văn A"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              leftIcon={
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />

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

            <Input
              label="Số điện thoại / Zalo"
              type="text"
              placeholder="0912345678"
              value={form.zalo}
              onChange={(e) => setForm({ ...form, zalo: e.target.value })}
              leftIcon={
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              }
            />

            <PasswordInput
              label="Mật khẩu"
              required
              minLength={6}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              leftIcon={
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />

            <PasswordInput
              label="Xác nhận mật khẩu"
              required
              minLength={6}
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              leftIcon={
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />

            <Button type="submit" variant="primary" fullWidth size="lg" loading={loading} className="mt-2 h-[44px]">
              Đăng Ký Ngay
            </Button>
          </form>
        </div>

        {/* Footer Link */}
        <div className="px-6 py-5 border-t border-[var(--fha-border)] bg-[var(--fha-surface-2)] text-center">
          <p className="text-[14px] text-[var(--fha-text-muted)]">
            Đã có tài khoản?{' '}
            <Link href={`/login${defaultPlan ? `?plan=${defaultPlan}` : ''}`} className="font-semibold text-[var(--fha-brand)] hover:text-[var(--fha-brand-hover)] focus-visible:outline-none focus-visible:underline">
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
    <Suspense fallback={<div className="min-h-screen bg-[var(--fha-surface-2)] flex items-center justify-center"><div className="shimmer w-10 h-10 rounded-fha"></div></div>}>
      <RegisterContent />
    </Suspense>
  );
}
