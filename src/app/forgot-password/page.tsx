'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import OTPInput from '@/components/features/OTPInput';

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
    <div className="min-h-screen bg-fha-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
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

      <div className="w-full max-w-[440px] bg-fha-glass backdrop-blur-2xl shadow-fha-outset rounded-3xl border border-fha-glass-border overflow-hidden animate-slide-up relative z-10">
        <div className="p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-fha-text mb-2">Quên Mật Khẩu</h1>
            <p className="text-sm text-fha-text-muted">
              {step === 1 && "Nhập email của bạn để nhận mã khôi phục."}
              {step === 2 && (
                <>
                  Chúng tôi đã gửi mã xác thực đến
                  <br />
                  <strong className="text-fha-text">{email}</strong>
                </>
              )}
              {step === 3 && "Đổi mật khẩu thành công!"}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-fha-error-bg border border-fha-error-border rounded-fha-radius text-sm text-fha-error-text font-medium text-center">
              {error}
            </div>
          )}

          {resendMessage && step === 2 && (
            <div className="mb-6 p-3 bg-fha-success-bg border border-fha-success-border rounded-fha-radius text-sm text-fha-success-text font-medium text-center">
              {resendMessage}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <Input
                label="Email đăng ký"
                type="email"
                required
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />

              <Button type="submit" variant="primary" fullWidth size="lg" loading={loading}>
                Gửi Mã Xác Thực (OTP)
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-8">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-fha-text mb-2">Mã xác thực (OTP)</label>
                <OTPInput 
                  length={6} 
                  value={otp} 
                  onChange={setOtp} 
                  disabled={loading} 
                  error={!!error}
                />
              </div>

              <div className="space-y-4">
                <Input
                  label="Mật khẩu mới"
                  type="password"
                  required
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
                />

                <Input
                  label="Xác nhận mật khẩu"
                  type="password"
                  required
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
                />
              </div>

              <div className="text-center text-[12px] text-fha-warning bg-fha-warning-bg/50 px-3 py-2 rounded-lg border border-fha-warning-border">
                💡 Vui lòng kiểm tra cả hộp thư <strong>Spam (Thư rác)</strong>
              </div>

              <Button 
                type="submit" 
                variant="primary" 
                fullWidth 
                size="lg" 
                loading={loading}
                disabled={otp.length !== 6 || !newPassword || newPassword !== confirmPassword}
              >
                Xác Nhận Đổi Mật Khẩu
              </Button>
            </form>
          )}

          {step === 3 && (
            <div className="py-4 text-center animate-fade-in flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-fha-success-bg border-2 border-fha-success flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-fha-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-fha-text mb-6">Hoàn tất!</h3>
              <Button type="button" variant="primary" fullWidth onClick={() => router.push('/login')}>
                Đăng Nhập Ngay
              </Button>
            </div>
          )}
        </div>

        {/* Footer Link */}
        {step === 1 && (
          <div className="px-8 py-5 border-t border-fha-border bg-fha-surface text-center">
            <Link href="/login" className="text-sm font-medium text-fha-text-muted hover:text-fha-text transition-colors">
              &larr; Quay lại đăng nhập
            </Link>
          </div>
        )}
        
        {step === 2 && (
          <div className="px-8 py-5 border-t border-fha-border bg-fha-surface text-center flex flex-col gap-3">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading || countdown > 0}
              className="text-sm font-medium text-fha-text-muted hover:text-fha-text transition-colors disabled:opacity-50 disabled:hover:text-fha-text-muted"
            >
              {resendLoading ? 'Đang gửi...' : countdown > 0 ? `Gửi lại mã (${countdown}s)` : 'Gửi lại mã xác thực'}
            </button>
            <div className="text-sm">
              <button
                type="button"
                onClick={() => { setStep(1); setOtp(''); }}
                className="text-fha-text-faint hover:text-fha-text transition-colors"
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
