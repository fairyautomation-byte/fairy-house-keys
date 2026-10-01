'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

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

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } finally {
      setLoading(false);
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
            <h1 className="text-2xl font-bold text-fha-text mb-2">Quên Mật Khẩu</h1>
            <p className="text-sm text-fha-text-muted">
              {step === 1 && "Nhập email của bạn để nhận mã khôi phục."}
              {step === 2 && "Nhập mã xác thực gồm 6 chữ số và mật khẩu mới."}
              {step === 3 && "Đổi mật khẩu thành công!"}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-fha-error-bg border border-fha-error-border rounded-fha-radius text-sm text-fha-error-text font-medium text-center">
              {error}
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
              />

              <Button type="submit" variant="primary" fullWidth size="lg" loading={loading}>
                Gửi Mã Xác Thực (OTP)
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <Input
                label="Mã xác thực (OTP)"
                type="text"
                required
                placeholder="Nhập 6 chữ số"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="text-center tracking-widest text-lg font-mono"
              />

              <Input
                label="Mật khẩu mới"
                type="password"
                required
                placeholder="Nhập mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
              />

              <Button type="submit" variant="primary" fullWidth size="lg" loading={loading}>
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
        {step !== 3 && (
          <div className="px-8 py-5 border-t border-fha-border bg-fha-surface text-center">
            <Link href="/login" className="text-sm font-medium text-fha-text-muted hover:text-fha-text transition-colors">
              &larr; Quay lại đăng nhập
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
