'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PasswordInput from '@/components/ui/PasswordInput';
import OTPInput from '@/components/features/OTPInput';
import Alert from '@/components/ui/Alert';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step 1: Input email
  // Step 2: Input OTP & New Password
  // Step 3: Success
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (step === 2 && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, step]);

  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra');
      }

      setStep(2);
      setCountdown(60);
    } catch (err: any) {
      setError(err.message);
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
      const res = await fetch('/api/auth/forgot-password', {
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      setError('Vui lòng nhập đủ 6 số xác thực');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra');
      }

      setStep(3);
    } catch (err: any) {
      setError(err.message);
      if (err.message.includes('yêu cầu mã mới') || err.message.includes('hết hạn')) {
        setOtp('');
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
            <h1 className="text-[22px] font-bold text-[var(--fha-text)] mb-1">Quên Mật Khẩu</h1>
            <p className="text-[14px] text-[var(--fha-text-muted)]">
              {step === 1 && "Nhập email của bạn để nhận mã khôi phục."}
              {step === 2 && (
                <>
                  Chúng tôi đã gửi mã xác thực đến
                  <br />
                  <strong className="text-[var(--fha-text)]">{email}</strong>
                </>
              )}
              {step === 3 && "Đổi mật khẩu thành công!"}
            </p>
          </div>

          {error && (
            <Alert variant="danger" className="mb-6">
              {error}
            </Alert>
          )}

          {resendMessage && step === 2 && (
            <Alert variant="success" className="mb-6">
              {resendMessage}
            </Alert>
          )}

          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <Input
                label="Email đăng ký"
                type="email"
                required
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={
                  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />

              <Button type="submit" variant="primary" fullWidth size="lg" loading={loading} className="mt-2 h-[44px]">
                Gửi Mã Xác Thực (OTP)
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
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

              <div className="space-y-4">
                <PasswordInput
                  label="Mật khẩu mới"
                  required
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  leftIcon={
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
                />

                <PasswordInput
                  label="Xác nhận mật khẩu"
                  required
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  leftIcon={
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
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
                disabled={otp.length !== 6 || !newPassword || newPassword !== confirmPassword}
                className="h-[44px]"
              >
                Xác Nhận Đổi Mật Khẩu
              </Button>
            </form>
          )}

          {step === 3 && (
            <div className="py-4 text-center animate-fade-in flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-[var(--fha-success-bg)] border-2 border-[var(--fha-success)] flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-[var(--fha-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[var(--fha-text)] mb-6">Hoàn tất!</h3>
              <Button type="button" variant="primary" fullWidth onClick={() => router.push('/login')} className="h-[44px]">
                Đăng Nhập Ngay
              </Button>
            </div>
          )}
        </div>

        {/* Footer Link */}
        {step === 1 && (
          <div className="px-6 py-5 border-t border-[var(--fha-border)] bg-[var(--fha-surface-2)] text-center">
            <Link href="/login" className="text-[14px] font-medium text-[var(--fha-text-muted)] hover:text-[var(--fha-brand)] transition-colors focus-visible:outline-none focus-visible:underline">
              &larr; Quay lại đăng nhập
            </Link>
          </div>
        )}
        
        {step === 2 && (
          <div className="px-6 py-5 border-t border-[var(--fha-border)] bg-[var(--fha-surface-2)] text-center flex flex-col gap-3">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading || countdown > 0}
              className="text-[14px] font-medium text-[var(--fha-text-muted)] hover:text-[var(--fha-brand)] transition-colors disabled:opacity-50 disabled:hover:text-[var(--fha-text-muted)] focus-visible:outline-none focus-visible:underline"
            >
              {resendLoading ? 'Đang gửi...' : countdown > 0 ? `Gửi lại mã (${countdown}s)` : 'Gửi lại mã xác thực'}
            </button>
            <div className="text-[14px]">
              <button
                type="button"
                onClick={() => { setStep(1); setOtp(''); }}
                className="text-[var(--fha-text-faint)] hover:text-[var(--fha-text)] transition-colors focus-visible:outline-none focus-visible:underline"
              >
                &larr; Đổi email khác
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
