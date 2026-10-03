'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import OTPInput from '@/components/features/OTPInput';
import Alert from '@/components/ui/Alert';

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
      setError('Vui lòng nhập đủ 6 số');
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

      // Success
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
      // Clear OTP on error if it's max attempts or expired
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
      
      setResendMessage('Đã gửi mã mới. Vui lòng kiểm tra email.');
      setCountdown(60);
      setOtp('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResendLoading(false);
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
            <h1 className="text-[22px] font-bold text-[var(--fha-text)] mb-1">Xác thực Email</h1>
            <p className="text-[14px] text-[var(--fha-text-muted)]">
              Chúng tôi đã gửi mã xác thực đến
              <br />
              <strong className="text-[var(--fha-text)]">{email}</strong>
            </p>
          </div>

          {error && (
            <Alert variant="danger" className="mb-6">
              {error}
            </Alert>
          )}

          {resendMessage && !success && (
            <Alert variant="success" className="mb-6">
              {resendMessage}
            </Alert>
          )}

          {success ? (
            <div className="py-8 text-center animate-fade-in flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-[var(--fha-success-bg)] border-2 border-[var(--fha-success)] flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[var(--fha-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[var(--fha-text)] mb-2">Xác thực thành công!</h3>
              <p className="text-[var(--fha-success)] text-sm">Đang chuyển hướng...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-[var(--fha-text-muted)] mb-2">Mã xác thực (OTP)</label>
                <OTPInput 
                  length={6} 
                  value={otp} 
                  onChange={setOtp} 
                  disabled={loading} 
                  error={!!error}
                />
              </div>

              <Alert variant="warning">
                Vui lòng kiểm tra cả hộp thư <strong>Spam (Thư rác)</strong>
              </Alert>

              <Button 
                type="submit" 
                variant="primary" 
                fullWidth 
                size="lg" 
                loading={loading}
                disabled={otp.length !== 6}
                className="h-[44px]"
              >
                Xác Thực
              </Button>
            </form>
          )}
        </div>

        {/* Footer Link */}
        {!success && (
          <div className="px-6 py-5 border-t border-[var(--fha-border)] bg-[var(--fha-surface-2)] text-center flex flex-col gap-3">
            <button
              onClick={handleResend}
              disabled={resendLoading || countdown > 0}
              className="text-[14px] font-medium text-[var(--fha-text-muted)] hover:text-[var(--fha-brand)] transition-colors disabled:opacity-50 disabled:hover:text-[var(--fha-text-muted)] focus-visible:outline-none focus-visible:underline"
            >
              {resendLoading ? 'Đang gửi...' : countdown > 0 ? `Gửi lại mã (${countdown}s)` : 'Gửi lại mã xác thực'}
            </button>
            <div className="text-[14px]">
              <Link href="/register" className="text-[var(--fha-text-faint)] hover:text-[var(--fha-text)] transition-colors focus-visible:outline-none focus-visible:underline">
                &larr; Quay lại trang đăng ký
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--fha-surface-2)] flex items-center justify-center"><div className="shimmer w-10 h-10 rounded-fha"></div></div>}>
      <VerifyOTPContent />
    </Suspense>
  );
}
