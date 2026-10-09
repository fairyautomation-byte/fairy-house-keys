'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PasswordInput from '@/components/ui/PasswordInput';
import Alert from '@/components/ui/Alert';
import AuthSplitLayout from '@/components/auth/AuthSplitLayout';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultPlan = searchParams.get('plan') || 'trial';

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
      
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        throw new Error(
          res.status === 504 || res.status === 502
            ? 'Máy chủ đang phản hồi chậm hoặc tạm gián đoạn. Vui lòng thử lại sau.'
            : 'Lỗi phản hồi từ hệ thống máy chủ. Vui lòng thử lại sau.'
        );
      }

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
    <AuthSplitLayout
      title="Tạo Tài Khoản Mới"
      subtitle="Đăng ký tài khoản để nhận Key dùng thử 3 Ngày và trải nghiệm Extension"
    >
      {error && (
        <Alert variant="danger">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <Input
          label="Họ và tên của bạn"
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
          label="Địa chỉ Email (Nhận mã kích hoạt)"
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

        <Input
          label="Số điện thoại / Zalo (Hỗ trợ kỹ thuật)"
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
          label="Mật khẩu (Tối thiểu 6 ký tự)"
          required
          minLength={6}
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <PasswordInput
          label="Xác nhận lại mật khẩu"
          required
          minLength={6}
          placeholder="••••••••"
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
        />

        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          loading={loading}
          className="mt-2 text-sm font-bold"
        >
          {loading ? 'Đang khởi tạo...' : 'Tạo tài khoản & Tiếp tục'}
        </Button>
      </form>

      <div className="text-center text-xs text-[var(--fha-text-muted)]">
        Đã có tài khoản?{' '}
        <Link 
          href={`/login${defaultPlan ? `?plan=${defaultPlan}` : ''}`} 
          className="font-bold text-[var(--fha-brand)] hover:underline ml-1"
        >
          Đăng nhập ngay &rarr;
        </Link>
      </div>
    </AuthSplitLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--fha-surface-2)]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--fha-brand)] border-t-transparent animate-spin" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
