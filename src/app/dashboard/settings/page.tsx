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

      <div className="max-w-[480px]">
        <Card variant="default">
          <div className="mb-6">
            <h3 className="text-[17px] font-bold text-[var(--fha-text)]">Đổi mật khẩu</h3>
            <p className="text-[13px] text-[var(--fha-text-muted)] mt-1">Sử dụng mật khẩu mạnh để bảo vệ tài khoản của bạn</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <PasswordInput
              label="Mật khẩu cũ"
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

            <div className="pt-2 border-t border-[var(--fha-border)] mt-6 pt-6">
              <Button 
                variant="primary" 
                type="submit" 
                disabled={loading || !form.oldPassword || !form.newPassword || !form.confirmPassword}
                fullWidth
                loading={loading}
              >
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </Card>

        {/* Navigation Section */}
        <Card variant="default">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-[17px] font-bold text-[var(--fha-text)]">Trang chủ website</h3>
              <p className="text-[13px] text-[var(--fha-text-muted)] mt-1">Quay lại trang giới thiệu sản phẩm và bảng giá</p>
            </div>
            <Link href="/" passHref className="w-full sm:w-auto">
              <Button variant="secondary" fullWidth className="sm:w-auto justify-center">
                <svg className="w-4 h-4 mr-2 text-[var(--fha-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Về Trang Chủ Web
              </Button>
            </Link>
          </div>
        </Card>

        {/* Logout Section */}
        <Card variant="default">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-[17px] font-bold text-[var(--fha-text)]">Đăng xuất tài khoản</h3>
              <p className="text-[13px] text-[var(--fha-text-muted)] mt-1">Đăng xuất khỏi phiên làm việc trên thiết bị này</p>
            </div>
            <Button 
              variant="danger" 
              onClick={handleLogout}
              loading={loggingOut}
              className="w-full sm:w-auto"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              }
            >
              Đăng xuất
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
