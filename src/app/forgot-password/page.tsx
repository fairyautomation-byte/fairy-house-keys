'use client';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function ForgotPasswordContent() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [success, setSuccess] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');
    setMessage('');

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

      setMessage(data.message);
      setStep(2);
      
      // Focus first OTP input after a short delay
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next
    if (value !== '' && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '' && index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1]?.focus();
      }
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
    }
  };

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Vui lòng nhập đủ 6 số');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải từ 6 ký tự');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpString, newPassword })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
      if (err.message.includes('yêu cầu mã mới') || err.message.includes('hết hạn')) {
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-600/20 blur-[120px] pointer-events-none"></div>

      <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden relative z-10">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 mb-2">
              Quên mật khẩu
            </h1>
            <p className="text-slate-400 text-sm">
              {step === 1 ? 'Nhập email của bạn để lấy mã xác thực' : 'Nhập mã xác thực và mật khẩu mới'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 text-rose-400 text-sm font-medium border border-rose-500/20">
              {error}
            </div>
          )}

          {message && !success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-medium border border-emerald-500/20">
              {message}
            </div>
          )}

          {success ? (
            <div className="py-12 text-center animate-fade-in flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Đổi mật khẩu thành công!</h3>
              <p className="text-emerald-400 text-sm">Đang chuyển hướng về đăng nhập...</p>
            </div>
          ) : step === 1 ? (
            <form onSubmit={handleRequestOTP} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Email đã đăng ký</label>
                <input required type="email" className="w-full px-4 py-3 rounded-xl bg-slate-950/50 border border-slate-700/80 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
              </div>
              <button disabled={loading || !email} type="submit" className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 transition-all mt-6">
                {loading ? 'Đang xử lý...' : 'GỬI MÃ XÁC THỰC'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 text-center">Mã OTP (6 số)</label>
                <div className="flex justify-between gap-2 sm:gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOTPChange(index, e.target.value)}
                      onKeyDown={(e) => handleOTPKeyDown(index, e)}
                      onPaste={handleOTPPaste}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl bg-slate-950/50 border border-slate-700/80 text-white focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all"
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 mt-2">Mật khẩu mới</label>
                <input required type="password" minLength={6} className="w-full px-4 py-3 rounded-xl bg-slate-950/50 border border-slate-700/80 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
              </div>

              <button 
                disabled={loading || otp.join('').length !== 6 || newPassword.length < 6} 
                type="submit" 
                className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 transition-all"
              >
                {loading ? 'Đang đổi mật khẩu...' : 'XÁC NHẬN ĐỔI MẬT KHẨU'}
              </button>
              
              <div className="text-center pt-2">
                <button type="button" onClick={() => setStep(1)} className="text-sm text-cyan-400 hover:text-cyan-300">
                  Sử dụng email khác
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 text-center text-sm text-slate-400 flex flex-col gap-3">
            <div>
              <Link href="/login" className="text-slate-500 hover:text-slate-300 transition-colors mt-2">
                &larr; Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
