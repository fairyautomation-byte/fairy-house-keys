'use client';
import React, { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Mật khẩu mới không khớp');
      return;
    }
    
    if (form.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải từ 6 ký tự trở lên');
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
      
      toast.success(data.message || 'Đổi mật khẩu thành công');
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Tài Khoản & Bảo Mật" 
        description="Quản lý thông tin tài khoản và đổi mật khẩu"
      />

      <div className="max-w-xl">
        <Card variant="default">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-fha-text">Đổi mật khẩu</h3>
            <p className="text-sm text-fha-text-muted mt-1">Sử dụng mật khẩu mạnh để bảo vệ tài khoản của bạn</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-fha-text">Mật khẩu cũ</label>
              <input 
                name="oldPassword"
                required 
                type="password" 
                value={form.oldPassword} 
                onChange={handleChange} 
                className="w-full px-4 py-3 rounded-fha-radius bg-fha-surface-2 border border-fha-border text-fha-text focus:outline-none focus:border-fha-cyan transition-colors" 
                placeholder="Nhập mật khẩu hiện tại"
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-fha-text">Mật khẩu mới</label>
              <input 
                name="newPassword"
                required 
                minLength={6} 
                type="password" 
                value={form.newPassword} 
                onChange={handleChange} 
                className="w-full px-4 py-3 rounded-fha-radius bg-fha-surface-2 border border-fha-border text-fha-text focus:outline-none focus:border-fha-cyan transition-colors" 
                placeholder="Ít nhất 6 ký tự"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-fha-text">Xác nhận mật khẩu mới</label>
              <input 
                name="confirmPassword"
                required 
                minLength={6} 
                type="password" 
                value={form.confirmPassword} 
                onChange={handleChange} 
                className="w-full px-4 py-3 rounded-fha-radius bg-fha-surface-2 border border-fha-border text-fha-text focus:outline-none focus:border-fha-cyan transition-colors" 
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>

            <div className="pt-2">
              <Button 
                variant="primary" 
                type="submit" 
                disabled={loading || !form.oldPassword || !form.newPassword || !form.confirmPassword}
                fullWidth
              >
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
