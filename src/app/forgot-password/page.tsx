'use client';
import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Assuming you have an API route or will build one for this
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra');
      }

      setSuccess(true);
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
              Nhập email của bạn để nhận hướng dẫn khôi phục mật khẩu.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-fha-error-bg border border-fha-error-border rounded-fha-radius text-sm text-fha-error-text font-medium text-center">
              {error}
            </div>
          )}

          {success ? (
            <div className="py-4 text-center animate-fade-in flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-fha-info-bg border-2 border-fha-info flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-fha-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-fha-text mb-2">Kiểm tra email của bạn</h3>
              <p className="text-fha-text-muted text-sm leading-relaxed">
                Chúng tôi đã gửi một liên kết khôi phục mật khẩu đến <strong>{email}</strong>. Vui lòng kiểm tra hộp thư đến (và mục Spam).
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
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
                Gửi Yêu Cầu
              </Button>
            </form>
          )}
        </div>

        {/* Footer Link */}
        <div className="px-8 py-5 border-t border-fha-border bg-fha-surface text-center">
          <Link href="/login" className="text-sm font-medium text-fha-text-muted hover:text-fha-text transition-colors">
            &larr; Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
