'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Step = 1 | 2 | 3;
type PackageType = 'trial' | 'standard' | 'pro' | 'lifetime';

const PACKAGES = [
  {
    id: 'trial' as PackageType,
    name: 'Trial',
    duration: '1 ngày',
    price: 'Miễn phí',
    limit: '50 lần scan/ngày',
    icon: '🆓',
    color: 'from-slate-600 to-slate-700',
    border: 'border-slate-600',
    highlight: false,
  },
  {
    id: 'standard' as PackageType,
    name: 'Standard',
    duration: '30 ngày',
    price: 'Liên hệ',
    limit: '500 lần scan/ngày',
    icon: '⭐',
    color: 'from-blue-700 to-blue-800',
    border: 'border-blue-600',
    highlight: false,
  },
  {
    id: 'pro' as PackageType,
    name: 'Pro',
    duration: '90 ngày',
    price: 'Liên hệ',
    limit: 'Không giới hạn',
    icon: '🚀',
    color: 'from-violet-700 to-violet-800',
    border: 'border-violet-500',
    highlight: true,
  },
  {
    id: 'lifetime' as PackageType,
    name: 'Lifetime',
    duration: 'Vĩnh viễn ♾️',
    price: 'Liên hệ',
    limit: 'Không giới hạn + Ưu tiên',
    icon: '💎',
    color: 'from-amber-600 to-orange-700',
    border: 'border-amber-500',
    highlight: false,
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [selectedPackage, setSelectedPackage] = useState<PackageType>('pro');
  const [form, setForm] = useState({ fullName: '', email: '', zalo: '', purpose: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, packageType: selectedPackage }),
      });
      const data = await res.json();
      if (data.ok) {
        router.push('/activate');
      } else {
        setError(data.error || 'Có lỗi xảy ra, vui lòng thử lại');
        setStep(2);
      }
    } catch {
      setError('Không kết nối được server. Vui lòng thử lại.');
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const pkg = PACKAGES.find(p => p.id === selectedPackage)!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1e] via-[#0d1429] to-[#0a0f1e] flex items-center justify-center p-4">
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative w-full max-w-2xl animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-2xl shadow-lg glow-purple">
              🏠
            </div>
            <div className="text-left">
              <h1 className="text-xl font-black text-white leading-tight">Fairy House AutoData</h1>
              <p className="text-xs text-cyan-400 font-semibold">V2.0 — AI Automation Facebook</p>
            </div>
          </div>
          <h2 className="text-3xl font-black gradient-text mb-2">Đăng Ký Key Kích Hoạt</h2>
          <p className="text-slate-400 text-sm">Điền thông tin để nhận key — Admin sẽ duyệt trong 24h</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                step === s ? 'bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-lg glow-purple scale-110' :
                step > s ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'
              }`}>
                {step > s ? '✓' : s}
              </div>
              {s < 3 && <div className={`w-16 h-0.5 transition-all duration-300 ${step > s ? 'bg-emerald-600' : 'bg-slate-700'}`} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-6 md:p-8 shadow-2xl">

          {/* Step 1: Chọn gói */}
          {step === 1 && (
            <div className="animate-slide-up">
              <h3 className="text-lg font-bold text-white mb-1">Chọn gói phù hợp</h3>
              <p className="text-slate-400 text-sm mb-6">Bạn có thể đề xuất gói, Admin sẽ xem xét và xác nhận</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {PACKAGES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPackage(p.id)}
                    className={`relative text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedPackage === p.id
                        ? `border-violet-500 bg-gradient-to-br ${p.color} shadow-lg glow-purple`
                        : `${p.border} bg-slate-800/50 hover:bg-slate-700/50`
                    }`}
                  >
                    {p.highlight && selectedPackage !== p.id && (
                      <span className="absolute -top-2 -right-2 bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Phổ biến</span>
                    )}
                    <div className="text-2xl mb-2">{p.icon}</div>
                    <div className="font-bold text-white">{p.name}</div>
                    <div className="text-xs text-slate-300 mt-0.5">{p.duration}</div>
                    <div className="text-xs text-violet-300 mt-1">{p.limit}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-bold hover:brightness-110 transition-all shadow-lg glow-purple"
              >
                Tiếp theo →
              </button>
            </div>
          )}

          {/* Step 2: Thông tin */}
          {step === 2 && (
            <div className="animate-slide-up">
              <div className="flex items-center gap-3 mb-6">
                <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${pkg.color} text-white text-sm font-bold`}>
                  {pkg.icon} {pkg.name} — {pkg.duration}
                </div>
                <button onClick={() => setStep(1)} className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
                  Đổi gói
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-sm">
                  ⚠️ {error}
                </div>
              )}

              <div className="space-y-4">
                {[
                  { key: 'fullName', label: 'Họ và tên', placeholder: 'Nguyễn Văn A', type: 'text', icon: '👤' },
                  { key: 'email', label: 'Email nhận key', placeholder: 'email@gmail.com', type: 'email', icon: '📧' },
                  { key: 'zalo', label: 'Số Zalo', placeholder: '0901234567', type: 'tel', icon: '📱' },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      {field.icon} {field.label}
                    </label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={form[field.key as keyof typeof form]}
                      onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full bg-slate-800/80 border border-slate-600/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 transition-all"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">💬 Mục đích sử dụng (tùy chọn)</label>
                  <textarea
                    rows={2}
                    placeholder="Bạn dùng tool để làm gì?"
                    value={form.purpose}
                    onChange={e => setForm(prev => ({ ...prev, purpose: e.target.value }))}
                    className="w-full bg-slate-800/80 border border-slate-600/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 transition-all text-sm font-semibold"
                >
                  ← Quay lại
                </button>
                <button
                  onClick={() => {
                    if (!form.fullName || !form.email || !form.zalo) {
                      setError('Vui lòng điền đầy đủ họ tên, email và Zalo');
                      return;
                    }
                    setError('');
                    setStep(3);
                  }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-bold hover:brightness-110 transition-all shadow-lg"
                >
                  Xem lại →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Xác nhận */}
          {step === 3 && (
            <div className="animate-slide-up">
              <h3 className="text-lg font-bold text-white mb-1">Xác nhận thông tin</h3>
              <p className="text-slate-400 text-sm mb-6">Kiểm tra lại trước khi gửi</p>

              <div className="bg-slate-800/60 rounded-xl p-4 space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">📦 Gói đăng ký:</span>
                  <span className="text-violet-300 font-bold">{pkg.icon} {pkg.name} ({pkg.duration})</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">👤 Họ tên:</span>
                  <span className="text-white font-semibold">{form.fullName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">📧 Email:</span>
                  <span className="text-white">{form.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">📱 Zalo:</span>
                  <span className="text-white">{form.zalo}</span>
                </div>
                {form.purpose && (
                  <div className="pt-2 border-t border-slate-700">
                    <p className="text-slate-400 text-xs">💬 Mục đích: <span className="text-slate-200">{form.purpose}</span></p>
                  </div>
                )}
              </div>

              <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 mb-6 text-xs text-amber-200">
                ⏱️ Admin sẽ xem xét và gửi key qua email <strong>{form.email}</strong> trong vòng <strong>24 giờ</strong>.
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 transition-all text-sm font-semibold disabled:opacity-50"
                >
                  ← Sửa lại
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-bold hover:brightness-110 transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Đang gửi...
                    </>
                  ) : '✅ Gửi đơn đăng ký'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-6">
          Hỗ trợ: <span className="text-cyan-400 font-semibold">Zalo 0378791667</span> • Fairy House AutoData V2.0
        </p>
      </div>
    </div>
  );
}
