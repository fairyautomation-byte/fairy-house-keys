'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import OTPInput from '@/components/features/OTPInput';

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
    <div className="min-h-screen bg-fha-bg flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fha-cyan to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-fha-cyan">
          FH
        </div>
        <span className="font-bold text-xl tracking-tight text-fha-text">
          Fairy House <span className="text-fha-cyan">AutoData</span>
        </span>
      </Link>

      {/* Main Card */}
      <div className="w-full max-w-[440px] bg-fha-surface-2 shadow-fha-lg rounded-fha-radius-lg border border-fha-border overflow-hidden animate-slide-up">
        <div className="p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-fha-text mb-2">Xác thực Email</h1>
            <p className="text-sm text-fha-text-muted">
              Chúng tôi đã gửi mã xác thực đến
              <br />
              <strong className="text-fha-text">{email}</strong>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-fha-error-bg border border-fha-error-border rounded-fha-radius text-sm text-fha-error-text font-medium text-center">
              {error}
            </div>
          )}

          {resendMessage && !success && (
            <div className="mb-6 p-3 bg-fha-success-bg border border-fha-success-border rounded-fha-radius text-sm text-fha-success-text font-medium text-center">
              {resendMessage}
            </div>
          )}

          {success ? (
            <div className="py-8 text-center animate-fade-in flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-fha-success-bg border-2 border-fha-success flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-fha-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-fha-text mb-2">Xác thực thành công!</h3>
              <p className="text-fha-success-text text-sm">Đang chuyển hướng...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <OTPInput 
                length={6} 
                value={otp} 
                onChange={setOtp} 
                disabled={loading} 
                error={!!error}
              />

              <div className="text-center text-[12px] text-fha-warning bg-fha-warning-bg/50 px-3 py-2 rounded-lg border border-fha-warning-border">
                💡 Vui lòng kiểm tra cả hộp thư <strong>Spam (Thư rác)</strong>
              </div>

              <Button 
                type="submit" 
                variant="primary" 
                fullWidth 
                size="lg" 
                loading={loading}
                disabled={otp.length !== 6}
              >
                Xác Thực
              </Button>
            </form>
          )}
        </div>

        {/* Footer Link */}
        {!success && (
          <div className="px-8 py-5 border-t border-fha-border bg-fha-surface text-center flex flex-col gap-3">
            <button
              onClick={handleResend}
              disabled={resendLoading || countdown > 0}
              className="text-sm font-medium text-fha-text-muted hover:text-fha-text transition-colors disabled:opacity-50 disabled:hover:text-fha-text-muted"
            >
              {resendLoading ? 'Đang gửi...' : countdown > 0 ? `Gửi lại mã (${countdown}s)` : 'Gửi lại mã xác thực'}
            </button>
            <div className="text-sm">
              <Link href="/register" className="text-fha-text-faint hover:text-fha-text transition-colors">
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
    <Suspense fallback={<div className="min-h-screen bg-fha-bg flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-fha-cyan/20 border-t-fha-cyan rounded-full"></div></div>}>
      <VerifyOTPContent />
    </Suspense>
  );
}
