'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import LicenseKey from '@/components/features/LicenseKey';
import StatusBadge from '@/components/features/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import PasswordInput from '@/components/ui/PasswordInput';
import { formatDate } from '@/lib/format';

function getPlanName(planId: string) {
  switch (planId) {
    case 'trial': return 'Gói 3 Ngày Dùng Thử';
    case 'monthly': return 'Gói 1 Tháng (Chuẩn)';
    case 'quarterly': return 'Gói 3 Tháng (Tiết Kiệm)';
    case 'yearly': return 'Gói 1 Năm (Doanh Nghiệp)';
    default: return planId ? planId.toUpperCase() : 'BẢN QUYỀN';
  }
}

interface RestoreModalProps {
  license: any | null;
  installationId: string;
  onClose: () => void;
  onSuccess: (licenseId: string, isBound: boolean, notice: string) => void;
}

function RestoreDeviceModal({ license, installationId, onClose, onSuccess }: RestoreModalProps) {
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [customInstallId, setCustomInstallId] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  // Mặc định: nếu có installationId thì rebind, nếu không thì unbind (giải phóng key)
  const [actionType, setActionType] = useState<'rebind' | 'unbind'>(installationId ? 'rebind' : 'unbind');
  const [successData, setSuccessData] = useState<{ title: string; message: string; key: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (installationId) {
      setActionType('rebind');
    } else {
      setActionType('unbind');
    }
    setPassword('');
    setError('');
    setSuccessData(null);
    setCopied(false);
    setShowManualInput(false);
    setCustomInstallId('');
  }, [license, installationId]);

  if (!license) return null;

  const targetInstallId = showManualInput && customInstallId.trim()
    ? customInstallId.trim()
    : installationId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError('');

    if (!password) {
      setError('Vui lòng nhập mật khẩu tài khoản web.');
      return;
    }

    if (actionType === 'rebind' && !targetInstallId) {
      setError('Vui lòng cung cấp mã cài đặt (Installation ID) hoặc chọn tùy chọn Hủy liên kết thiết bị cũ.');
      return;
    }

    setSaving(true);
    try {
      if (actionType === 'rebind') {
        const res = await fetch('/api/user/license/rebind', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            licenseId: license.id,
            installationId: targetInstallId,
            password,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Chưa khôi phục được lần cài đặt này.');
        
        onSuccess(
          license.id,
          true,
          'Đã khôi phục bản quyền sang tiện ích hiện tại thành công. Thiết bị cũ đã mất quyền sử dụng.'
        );
        setSuccessData({
          title: 'Khôi phục thiết bị thành công!',
          message: 'Key bản quyền đã được chuyển quyền sử dụng sang tiện ích trên trình duyệt này. Thiết bị cũ đã được thu hồi.',
          key: license.license_key,
        });
      } else {
        const res = await fetch('/api/user/license/unbind', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            licenseId: license.id,
            password,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Chưa thể hủy liên kết thiết bị này.');

        onSuccess(
          license.id,
          false,
          'Đã hủy liên kết thiết bị cũ thành công. Key hiện đã sẵn sàng kích hoạt trên thiết bị mới.'
        );
        setSuccessData({
          title: 'Đã hủy liên kết thiết bị cũ thành công!',
          message: 'Key bản quyền đã được giải phóng. Bạn có thể mở tiện ích trên máy mới hoặc lần cài mới để kích hoạt lại ngay.',
          key: license.license_key,
        });
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!license}
      onClose={() => {
        if (!saving) onClose();
      }}
      title={successData ? 'Thông Báo Kết Quả' : 'Khôi Phục & Đổi Thiết Bị Kích Hoạt'}
      size="md"
    >
      {successData ? (
        <div className="py-2 space-y-5 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm ring-8 ring-emerald-50">
            <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl font-bold text-zinc-900">
              {successData.title}
            </h3>
            <p className="text-sm text-zinc-600 max-w-md mx-auto leading-relaxed">
              {successData.message}
            </p>
          </div>

          {/* Key Vault Display */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-fha p-3.5 max-w-md mx-auto flex items-center justify-between gap-3">
            <div className="text-left">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Mã Key Của Bạn
              </div>
              <div className="font-mono font-bold text-sm text-zinc-800 tracking-wider">
                {successData.key}
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (navigator?.clipboard?.writeText) {
                  navigator.clipboard.writeText(successData.key);
                }
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="text-xs shrink-0"
            >
              {copied ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Đã chép
                </span>
              ) : (
                'Sao chép Key'
              )}
            </Button>
          </div>

          {/* Steps Guide */}
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-fha p-4 text-left max-w-md mx-auto text-xs text-emerald-900 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-emerald-950">
              <span>👉 Các bước tiếp theo:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 pl-1 text-[12px] opacity-90 leading-relaxed">
              <li>Mở biểu tượng tiện ích <strong>Fairy House AutoData</strong> trên trình duyệt Chrome.</li>
              <li>Dán mã Key vừa sao chép ở trên vào ô nhập.</li>
              <li>Bấm nút <strong>"Kích hoạt License"</strong> để bắt đầu sử dụng ngay.</li>
            </ol>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              fullWidth
              onClick={onClose}
              className="font-bold py-2.5"
            >
              Đã hiểu & Hoàn tất
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* License Info Box */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-fha p-3.5 space-y-1.5 text-xs text-zinc-700">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Mã License:</span>
              <span className="font-mono font-bold text-zinc-900">{license.license_key}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Gói bản quyền:</span>
              <span className="font-semibold text-zinc-900">{getPlanName(license.plan_id)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Tình trạng hiện tại:</span>
              {license.bound_to_device ? (
                <span className="font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Đang gắn với 1 thiết bị cũ
                </span>
              ) : (
                <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Chưa gắn thiết bị (Sẵn sàng kích hoạt)
                </span>
              )}
            </div>
          </div>

          {/* Action Options */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
              Chọn thao tác xử lý:
            </div>

            {installationId && (
              <label className="flex items-start gap-3 p-3 rounded-fha border border-zinc-200 hover:border-zinc-300 bg-white cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="actionType"
                  value="rebind"
                  checked={actionType === 'rebind' && !showManualInput}
                  onChange={() => {
                    setActionType('rebind');
                    setShowManualInput(false);
                  }}
                  className="mt-0.5 text-[var(--fha-brand)]"
                />
                <div className="text-xs">
                  <div className="font-bold text-zinc-900">
                    Khôi phục cho tiện ích vừa mở trang này (Khuyên dùng)
                  </div>
                  <div className="text-zinc-500 mt-0.5">
                    Gán quyền kích hoạt trực tiếp sang tiện ích trên trình duyệt hiện tại.
                  </div>
                </div>
              </label>
            )}

            <label className="flex items-start gap-3 p-3 rounded-fha border border-zinc-200 hover:border-zinc-300 bg-white cursor-pointer transition-colors">
              <input
                type="radio"
                name="actionType"
                value="unbind"
                checked={actionType === 'unbind'}
                onChange={() => {
                  setActionType('unbind');
                  setShowManualInput(false);
                }}
                className="mt-0.5 text-[var(--fha-brand)]"
              />
              <div className="text-xs">
                <div className="font-bold text-zinc-900">
                  Hủy liên kết thiết bị cũ (Giải phóng Key)
                </div>
                <div className="text-zinc-500 mt-0.5">
                  Xóa thiết bị cũ khỏi key. Sau khi hủy, bạn có thể mang key sang bất kỳ máy tính nào mở tiện ích và kích hoạt lại.
                </div>
              </div>
            </label>

            {!installationId && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowManualInput(!showManualInput)}
                  className="text-[11px] font-semibold text-[var(--fha-brand)] hover:underline flex items-center gap-1"
                >
                  {showManualInput ? '− Ẩn nhập Installation ID thủ công' : '+ Nhập mã Installation ID thủ công (nâng cao)'}
                </button>
                {showManualInput && (
                  <div className="mt-2 space-y-1">
                    <input
                      type="text"
                      placeholder="Nhập mã Installation ID từ tiện ích..."
                      value={customInstallId}
                      onChange={e => {
                        setCustomInstallId(e.target.value);
                        setActionType('rebind');
                      }}
                      className="w-full text-xs font-mono p-2 border border-zinc-300 rounded-fha focus:outline-none focus:border-[var(--fha-brand)]"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Password Input Field */}
          <div className="space-y-1">
            <PasswordInput
              label="Mật khẩu tài khoản web"
              placeholder="Nhập mật khẩu tài khoản để xác thực chủ key"
              autoComplete="current-password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              required
              autoFocus
            />
            <p className="text-[11px] text-zinc-500">
              Nhập mật khẩu tài khoản bạn đang đăng nhập trên trang web này để bảo vệ quyền sở hữu key.
            </p>
          </div>

          {error && (
            <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-fha text-xs text-rose-800 leading-relaxed flex items-start gap-2">
              <svg className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-2 border-t border-zinc-100">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={onClose}
              disabled={saving}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={saving}
              className="font-bold"
            >
              {actionType === 'rebind' ? 'Xác nhận khôi phục sang máy này' : 'Xác nhận hủy liên kết thiết bị cũ'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default function LicensesPage() {
  const router = useRouter();
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [installationId, setInstallationId] = useState('');
  const [selectedLicense, setSelectedLicense] = useState<any | null>(null);
  const [bannerNotice, setBannerNotice] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  useEffect(() => {
    // 1. Kiểm tra query param từ extension
    let id = new URLSearchParams(window.location.search).get('installationId') || '';
    
    // 2. Nếu URL không có, kiểm tra cookie zt_installation_id nếu extension đã từng lưu
    if (!id && typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)zt_installation_id=([^;]+)/);
      if (match && match[1]) {
        try {
          const decoded = decodeURIComponent(match[1]);
          if (/^[a-zA-Z0-9_-]{8,64}$/.test(decoded)) id = decoded;
        } catch (_) {}
      }
    }

    if (/^[a-zA-Z0-9_-]{8,64}$/.test(id)) {
      setInstallationId(id);
    }

    fetch('/api/user/dashboard')
      .then(async res => {
        if (!res.ok) throw new Error(res.status === 401 ? 'Vui lòng đăng nhập lại.' : 'Chưa tải được danh sách key.');
        return res.json();
      })
      .then(data => {
        setLicenses(data.licenses || []);
        setLoading(false);
      })
      .catch(error => {
        setBannerNotice({ type: 'error', message: error.message });
        setLoading(false);
      });
  }, []);

  const handleRestoreSuccess = (licenseId: string, isBound: boolean, notice: string) => {
    setLicenses(items =>
      items.map(item => (item.id === licenseId ? { ...item, bound_to_device: isBound } : item))
    );
    setBannerNotice({ type: 'success', message: notice });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-fha-lg" />
        <Skeleton className="h-[240px] w-full rounded-fha-lg" />
        <Skeleton className="h-[240px] w-full rounded-fha-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Quản Lý License Bản Quyền" 
        description="Quản lý key và khôi phục kích hoạt khi cài lại tiện ích"
        actions={
          <Link href="/dashboard/store" passHref>
            <Button variant="primary" size="sm">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Mua Thêm Key Mới
            </Button>
          </Link>
        }
      />

      {/* Dynamic Status Banner */}
      {bannerNotice && (
        <div
          role="status"
          className={`p-4 rounded-fha border flex items-start justify-between gap-3 transition-all ${
            bannerNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : bannerNotice.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {bannerNotice.type === 'success' ? (
              <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <div className="text-sm font-medium leading-relaxed">{bannerNotice.message}</div>
          </div>
          <button
            onClick={() => setBannerNotice(null)}
            className="text-zinc-400 hover:text-zinc-700 p-1"
            aria-label="Đóng thông báo"
          >
            ✕
          </button>
        </div>
      )}

      {/* Reinstall Helper Notice */}
      <div className="bg-zinc-50 border border-zinc-200 p-3.5 rounded-fha text-xs text-zinc-600 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            {installationId
              ? 'Hệ thống đã nhận diện tiện ích trên trình duyệt này. Nhấn nút "Khôi phục" trên key tương ứng để kích hoạt ngay.'
              : 'Để chuyển key sang máy khác hoặc kích hoạt lại sau khi cài lại tiện ích, nhấn "Đổi Thiết Bị / Khôi Phục" trên key của bạn.'}
          </span>
        </div>
      </div>

      {licenses.length > 0 ? (
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
          {licenses.map((license, idx) => {
            const todayVN = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
            const isDifferentDay = license?.last_reset_date && license.last_reset_date !== todayVN;
            const dailyUsed = isDifferentDay ? 0 : (license.daily_used || 0);
            const dailyLimit = license.daily_limit === -1 || license.daily_limit === null ? null : (license.daily_limit || 1000);
            const quotaPercent = dailyLimit ? Math.min(100, Math.round((dailyUsed / dailyLimit) * 100)) : 0;
            const isUnlimited = dailyLimit === null;

            return (
              <div 
                key={license.id || idx} 
                className="bg-white rounded-fha-lg border-2 border-[var(--fha-border-strong)] p-6 sm:p-7 shadow-fha-sm relative overflow-hidden space-y-6"
              >
                {/* Accent Top Border */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${license.status === 'ACTIVE' ? 'bg-[var(--fha-brand)]' : 'bg-gray-300'}`} />

                {/* Card Header: Plan & Device Status */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--fha-border)] pb-5">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded bg-[var(--fha-brand-soft)] text-[var(--fha-brand)] flex items-center justify-center font-bold text-sm shrink-0 border border-[var(--fha-brand)]">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-base text-[var(--fha-text)]">
                        {getPlanName(license.plan_id)}
                      </div>
                      <div className="text-xs text-[var(--fha-text-muted)] flex items-center gap-2 mt-0.5">
                        {license.bound_to_device ? (
                          <span className="inline-flex items-center gap-1 font-medium text-[var(--fha-brand)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--fha-brand)]" />
                            Đang gắn với 1 thiết bị
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Chưa gắn thiết bị (Sẵn sàng kích hoạt)
                          </span>
                        )}
                        <span>•</span>
                        <span>Có thể đổi thiết bị bất cứ lúc nào</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={license.status} />
                  </div>
                </div>

                {/* Center: Key Vault */}
                <div className="space-y-3 max-w-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--fha-text-muted)]">
                      Mã Bản Quyền (License Key)
                    </span>
                    <span className="text-[11px] text-[var(--fha-text-faint)] italic">
                      * Nhấp chuột để sao chép key và dán vào Extension
                    </span>
                  </div>

                  <LicenseKey value={license.license_key} status={license.status} />

                  {/* Direct Action Button below key */}
                  {license.status === 'ACTIVE' && (
                    <div className="pt-0.5 flex flex-wrap items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedLicense(license)}
                        className="text-xs font-semibold flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5 text-[var(--fha-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {installationId ? 'Khôi phục cho tiện ích vừa cài' : 'Khôi phục / Đổi thiết bị'}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Bottom Matrix: Expiration + Daily Quota Gauge + Actions */}
                <div className="grid md:grid-cols-12 gap-6 pt-5 border-t border-[var(--fha-border)] items-center">
                  
                  {/* Expiration (4 cols) */}
                  <div className="md:col-span-4 space-y-1">
                    <div className="text-[11px] font-bold text-[var(--fha-text-muted)] uppercase tracking-wider">
                      Thời Hạn Sử Dụng
                    </div>
                    <div className="font-black text-sm text-[var(--fha-text)] font-mono">
                      {license.expires_at 
                        ? formatDate(license.expires_at._seconds ? license.expires_at._seconds * 1000 : license.expires_at) 
                        : 'Không giới hạn thời gian'}
                    </div>
                    <div className="text-[11px] text-[var(--fha-text-faint)]">
                      Tự động tính ngày sau khi thanh toán
                    </div>
                  </div>

                  {/* Quota Gauge (5 cols) */}
                  <div className="md:col-span-5 bg-[var(--fha-surface-2)] p-3.5 rounded-fha border border-[var(--fha-border)] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[var(--fha-text)]">Tiến độ scan hôm nay:</span>
                      <span className="font-mono text-[var(--fha-brand)] font-bold">
                        {dailyUsed.toLocaleString('vi-VN')} / {isUnlimited ? '∞' : dailyLimit?.toLocaleString('vi-VN')} UID
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-[var(--fha-border)]">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          quotaPercent > 90 ? 'bg-[var(--fha-error)]' : quotaPercent > 70 ? 'bg-[var(--fha-warning)]' : 'bg-[var(--fha-brand)]'
                        }`}
                        style={{ width: isUnlimited ? '100%' : `${quotaPercent}%` }}
                      />
                    </div>

                    <div className="text-[10px] text-[var(--fha-text-faint)] flex justify-between">
                      <span>{isUnlimited ? 'Không giới hạn hạn mức' : `Còn lại: ${Math.max(0, (dailyLimit || 0) - dailyUsed)} UID`}</span>
                      <span>Reset 00:00 VN</span>
                    </div>
                  </div>

                  {/* Action CTA (3 cols) */}
                  <div className="md:col-span-3 flex md:justify-end gap-2 flex-wrap">
                    {license.status === 'ACTIVE' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedLicense(license)}
                        className="font-bold text-xs whitespace-nowrap"
                      >
                        Đổi Thiết Bị
                      </Button>
                    )}
                    <Link href={`/dashboard/store?renew=${license.plan_id || 'monthly'}`} passHref className="w-full md:w-auto">
                      <Button variant="secondary" size="sm" fullWidth className="font-bold text-xs whitespace-nowrap">
                        Gia Hạn / Nâng Cấp
                      </Button>
                    </Link>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState 
          title="Bạn chưa có License nào đang hoạt động" 
          description="Hãy mua một gói License Key để bắt đầu sử dụng tiện ích trên trình duyệt của bạn."
          icon={
            <svg className="w-8 h-8 text-[var(--fha-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          }
          action={{
            label: 'Mua Key Bản Quyền Ngay',
            onClick: () => router.push('/dashboard/store')
          }}
        />
      )}

      {/* Modal Khôi Phục & Đổi Thiết Bị */}
      <RestoreDeviceModal
        license={selectedLicense}
        installationId={installationId}
        onClose={() => setSelectedLicense(null)}
        onSuccess={handleRestoreSuccess}
      />
    </div>
  );
}
