'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import PasswordInput from '@/components/ui/PasswordInput';
import { useToast } from '@/components/ui/ToastProvider';

export default function SettingsPage() {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [form, setForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (err) {
      setLoggingOut(false);
      error('Không thể đăng xuất');
    }
  };

  const handleChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      error('Mật khẩu mới không khớp');
      return;
    }
    
    if (form.newPassword.length < 6) {
      error('Mật khẩu mới phải từ 6 ký tự trở lên');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: form.oldPassword,
          newPassword: form.newPassword
        })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Có lỗi xảy ra');
      
      success(data.message || 'Đổi mật khẩu thành công');
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Tài Khoản & Bảo Mật" 
        description="Quản lý thông tin tài khoản và đổi mật khẩu"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* Left Column (5 cols): Security & Account Overview */}
        <div className="lg:col-span-5 space-y-6">
          <Card variant="default">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-fha bg-[var(--fha-brand-soft)] border border-[var(--fha-brand)] text-[var(--fha-brand)] flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--fha-text)]">Tiêu Chuẩn Bảo Mật</h3>
                  <p className="text-xs text-[var(--fha-text-muted)]">Cơ chế bảo vệ tài khoản và bản quyền</p>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-[var(--fha-border)] text-xs text-[var(--fha-text-muted)]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--fha-success)] shrink-0" />
                  <span>Mã hóa đường truyền an toàn TLS 256-bit</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--fha-success)] shrink-0" />
                  <span>Xác thực Hardware ID 1 Key / 1 Thiết bị</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--fha-success)] shrink-0" />
                  <span>Không thu thập hoặc lưu trữ mật khẩu Facebook</span>
                </div>
              </div>

              <div className="p-3.5 bg-[var(--fha-surface-2)] rounded-fha border border-[var(--fha-border)] text-xs space-y-1">
                <div className="font-semibold text-[var(--fha-text)]">Cần hỗ trợ chuyển máy?</div>
                <p className="text-[var(--fha-text-muted)] leading-relaxed">
                  Chúng tôi hỗ trợ cấp lại định danh phần cứng khi bạn đổi máy tính. Vui lòng liên hệ hotline Zalo 24/7.
                </p>
                <div className="pt-1">
                  <a href="https://zalo.me/0378791667" target="_blank" rel="noopener noreferrer" className="font-bold text-[var(--fha-brand)] hover:underline inline-flex items-center gap-1">
                    <span>Chat Zalo Kỹ Thuật &rarr;</span>
                  </a>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions Card */}
          <Card variant="default">
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--fha-text-muted)]">Thao tác tài khoản</h4>
              <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5">
                <Link href="/" passHref className="w-full">
                  <Button variant="secondary" fullWidth className="justify-center text-xs font-semibold">
                    <svg className="w-4 h-4 mr-2 text-[var(--fha-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Quay Lại Trang Chủ Web
                  </Button>
                </Link>

                <Button 
                  variant="danger" 
                  onClick={handleLogout}
                  loading={loggingOut}
                  fullWidth
                  className="justify-center text-xs font-semibold"
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  }
                >
                  Đăng Xuất Khỏi Thiết Bị
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (7 cols): Change Password Form */}
        <div className="lg:col-span-7">
          <Card variant="default">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-[var(--fha-text)]">Đổi Mật Khẩu Đăng Nhập</h3>
              <p className="text-xs text-[var(--fha-text-muted)] mt-1">Sử dụng mật khẩu mạnh từ 6 ký tự trở lên để bảo vệ bản quyền Key</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <PasswordInput
                label="Mật khẩu hiện tại"
                name="oldPassword"
                required 
                value={form.oldPassword} 
                onChange={(e) => handleChange('oldPassword', e.target.value)} 
                placeholder="Nhập mật khẩu hiện tại"
              />
              
              <PasswordInput
                label="Mật khẩu mới"
                name="newPassword"
                required 
                minLength={6} 
                value={form.newPassword} 
                onChange={(e) => handleChange('newPassword', e.target.value)} 
                placeholder="Ít nhất 6 ký tự"
              />

              <PasswordInput
                label="Xác nhận mật khẩu mới"
                name="confirmPassword"
                required 
                minLength={6} 
                value={form.confirmPassword} 
                onChange={(e) => handleChange('confirmPassword', e.target.value)} 
                placeholder="Nhập lại mật khẩu mới"
              />

              <div className="pt-2 border-t border-[var(--fha-border)] mt-6">
                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={loading || !form.oldPassword || !form.newPassword || !form.confirmPassword}
                  fullWidth
                  loading={loading}
                  className="font-bold text-sm h-11"
                >
                  Cập Nhật Mật Khẩu
                </Button>
              </div>
            </form>
          </Card>
        </div>

      </div>
    </div>
  );
}
