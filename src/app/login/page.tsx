'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PasswordInput from '@/components/ui/PasswordInput';
import Alert from '@/components/ui/Alert';
import AuthSplitLayout from '@/components/auth/AuthSplitLayout';

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
    <AuthSplitLayout
      title="Đăng Nhập Tài Khoản"
      subtitle="Nhập thông tin đăng nhập để vào bảng điều khiển quản lý Key & Ví"
    >
      {error && (
        <Alert variant="danger">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Địa chỉ Email"
          type="email"
          required
          placeholder="name@company.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          leftIcon={
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[var(--fha-text)]">Mật khẩu</label>
            <Link 
              href="/forgot-password" 
              className="text-xs text-[var(--fha-brand)] hover:underline font-medium"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <PasswordInput
            required
            placeholder="Nhập mật khẩu của bạn"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={loading}
          size="lg"
          className="mt-2 text-sm font-bold"
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập vào hệ thống'}
        </Button>
      </form>

      <div className="text-center text-xs text-[var(--fha-text-muted)]">
        Chưa có tài khoản?{' '}
        <Link 
          href={`/register${defaultPlan ? `?plan=${defaultPlan}` : ''}`} 
          className="font-bold text-[var(--fha-brand)] hover:underline ml-1"
        >
          Đăng ký dùng thử 3 ngày (0đ) &rarr;
        </Link>
      </div>
    </AuthSplitLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--fha-surface-2)]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--fha-brand)] border-t-transparent animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
