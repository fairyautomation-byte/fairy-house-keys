'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import OTPInput from '@/components/features/OTPInput';
import Alert from '@/components/ui/Alert';
import AuthSplitLayout from '@/components/auth/AuthSplitLayout';

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const plan = searchParams.get('plan');

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!email) {
      router.push('/register');
    }
  }, [email, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (otp.length !== 6) {
      setError('Vui lòng nhập đủ 6 chữ số mã OTP');
      return;
    }

    setLoading(true);
    setError('');
    setResendMessage('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra');
      }

      setSuccess(true);
      setTimeout(() => {
        if (plan) {
          router.push(`/checkout?plan=${plan}`);
        } else {
          router.push('/dashboard');
        }
      }, 1500);
    } catch (err: any) {
      setError(err.message);
      if (err.message.includes('yêu cầu mã mới') || err.message.includes('hết hạn')) {
        setOtp('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    
    setResendLoading(true);
    setError('');
    setResendMessage('');
    
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra');
      }

      setResendMessage('Mã OTP mới đã được gửi lại vào hòm thư!');
      setCountdown(60);
      setOtp('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      title="Xác Thực Email (OTP)"
      subtitle={`Mã kích hoạt 6 số đã được gửi tới địa chỉ: ${email || 'email của bạn'}`}
    >
      {error && (
        <Alert variant="danger">
          {error}
        </Alert>
      )}

      {resendMessage && (
        <Alert variant="success">
          {resendMessage}
        </Alert>
      )}

      {success ? (
        <div className="p-6 bg-[var(--fha-success-bg)] border border-[var(--fha-success-border)] rounded-fha text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-[var(--fha-success)] text-white flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="font-bold text-sm text-[var(--fha-success)]">Xác thực thành công!</div>
          <div className="text-xs text-[var(--fha-text-muted)]">Đang chuyển tiếp vào hệ thống...</div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--fha-text)] block text-center">
              Nhập mã 6 chữ số
            </label>
            <OTPInput
              value={otp}
              onChange={setOtp}
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            loading={loading}
            disabled={otp.length !== 6}
            className="text-sm font-bold"
          >
            {loading ? 'Đang xác thực...' : 'Xác nhận mã OTP'}
          </Button>

          <div className="flex items-center justify-between text-xs pt-2">
            <span className="text-[var(--fha-text-muted)]">Chưa nhận được mã?</span>
            {countdown > 0 ? (
              <span className="text-[var(--fha-text-muted)] font-mono">
                Gửi lại sau <strong>{countdown}s</strong>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="font-bold text-[var(--fha-brand)] hover:underline disabled:opacity-50"
              >
                {resendLoading ? 'Đang gửi...' : 'Gửi lại mã OTP'}
              </button>
            )}
          </div>
        </form>
      )}

      <div className="text-center text-xs text-[var(--fha-text-muted)]">
        Nhập sai địa chỉ email?{' '}
        <Link href="/register" className="font-bold text-[var(--fha-brand)] hover:underline ml-1">
          Đăng ký lại &rarr;
        </Link>
      </div>
    </AuthSplitLayout>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--fha-surface-2)]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--fha-brand)] border-t-transparent animate-spin" />
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  );
}
