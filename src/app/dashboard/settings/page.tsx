'use client';
import React, { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import PasswordInput from '@/components/ui/PasswordInput';
import { useToast } from '@/components/ui/ToastProvider';

export default function SettingsPage() {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

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
      </div>
    </div>
  );
}
