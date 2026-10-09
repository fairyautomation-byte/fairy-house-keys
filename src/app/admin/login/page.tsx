"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "", otp: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(data.error || "Sai thông tin đăng nhập");
      }
    } catch {
      setError("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--fha-surface-2)] flex items-center justify-center p-4 font-sans selection:bg-[var(--fha-brand-soft)]">
      <div className="w-full max-w-[400px] animate-fade-in relative z-10">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-1 bg-white rounded-fha border border-[var(--fha-border-strong)] shadow-sm mb-5">
            <Image
              src="/logo.png"
              alt="Admin Logo"
              width={48}
              height={48}
              className="rounded"
            />
          </div>
          <h1 className="text-[24px] font-black tracking-tight text-[var(--fha-text)] mb-1">
            Admin Panel
          </h1>
          <p className="text-[14px] font-medium text-[var(--fha-text-muted)]">
            Fairy House AutoData
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-fha-lg p-6 sm:p-8 shadow-sm border border-[var(--fha-border)]">
          {error && (
            <div className="mb-6">
              <Alert type="danger" message={error} />
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              label="Tên đăng nhập"
              placeholder="admin"
              value={form.username}
              onChange={(e) =>
                setForm((p) => ({ ...p, username: e.target.value }))
              }
              required
              autoComplete="username"
            />

            <PasswordInput
              label="Mật khẩu"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) =>
                setForm((p) => ({ ...p, password: e.target.value }))
              }
              required
              autoComplete="current-password"
            />

            <Input
              label="Mã xác thực quản trị (nếu đã bật)"
              value={form.otp}
              onChange={(e) => setForm((p) => ({ ...p, otp: e.target.value }))}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
            />
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                className="h-[48px]"
              >
                Đăng Nhập Quản Trị
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
