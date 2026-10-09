'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PasswordInput from '@/components/ui/PasswordInput';
import OTPInput from '@/components/features/OTPInput';
import Alert from '@/components/ui/Alert';
import AuthSplitLayout from '@/components/auth/AuthSplitLayout';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
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
      
      setResendMessage('Đã gửi mã mới. Vui lòng kiểm tra hộp thư.');
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
    <AuthSplitLayout
      title={step === 1 ? 'Khôi Phục Mật Khẩu' : step === 2 ? 'Nhập Mã OTP & Đặt Lại' : 'Đổi Mật Khẩu Hoàn Tất'}
      subtitle={
        step === 1 
          ? 'Nhập email tài khoản của bạn để nhận mã khôi phục mật khẩu' 
          : step === 2 
            ? `Mã xác thực đã được gửi tới ${email}` 
            : 'Mật khẩu của bạn đã được cập nhật an toàn'
      }
    >
      {error && (
        <Alert variant="danger">
          {error}
        </Alert>
      )}

      {resendMessage && step === 2 && (
        <Alert variant="success">
          {resendMessage}
        </Alert>
      )}

      {step === 1 && (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <Input
            label="Địa chỉ Email đăng ký"
            type="email"
            required
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            loading={loading}
            className="text-sm font-bold"
          >
            {loading ? 'Đang gửi mã...' : 'Gửi Mã Xác Thực (OTP)'}
          </Button>

          <div className="text-center pt-2">
            <Link href="/login" className="text-xs text-[var(--fha-text-muted)] hover:text-[var(--fha-brand)] font-medium">
              &larr; Quay lại trang đăng nhập
            </Link>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--fha-text)] block text-center">
              Nhập mã OTP 6 chữ số
            </label>
            <OTPInput
              value={otp}
              onChange={setOtp}
              disabled={loading}
            />
          </div>

          <PasswordInput
            label="Mật khẩu mới"
            required
            placeholder="Tối thiểu 8 ký tự"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
          />

          <PasswordInput
            label="Xác nhận mật khẩu mới"
            required
            placeholder="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            loading={loading}
            disabled={otp.length !== 6 || !newPassword || newPassword !== confirmPassword}
            className="text-sm font-bold"
          >
            {loading ? 'Đang cập nhật...' : 'Xác Nhận Đổi Mật Khẩu'}
          </Button>

          <div className="flex items-center justify-between text-xs pt-2">
            <button
              type="button"
              onClick={() => { setStep(1); setOtp(''); }}
              className="text-[var(--fha-text-muted)] hover:text-[var(--fha-brand)]"
            >
              &larr; Đổi email khác
            </button>
            {countdown > 0 ? (
              <span className="text-[var(--fha-text-muted)] font-mono">
                Gửi lại ({countdown}s)
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="font-bold text-[var(--fha-brand)] hover:underline"
              >
                Gửi lại mã
              </button>
            )}
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="py-4 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[var(--fha-success-bg)] border border-[var(--fha-success-border)] text-[var(--fha-success)] flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="font-bold text-sm text-[var(--fha-text)]">
            Mật khẩu mới đã được kích hoạt!
          </div>
          <Button
            type="button"
            variant="primary"
            fullWidth
            size="lg"
            onClick={() => router.push('/login')}
            className="text-sm font-bold"
          >
            Đăng nhập ngay với mật khẩu mới
          </Button>
        </div>
      )}
    </AuthSplitLayout>
  );
}
