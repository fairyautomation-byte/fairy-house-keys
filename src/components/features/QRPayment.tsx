import React from 'react';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { formatCurrency } from '@/lib/format';

export type PaymentState = 'loading' | 'pending' | 'checking' | 'success' | 'expired' | 'failed';

interface QRPaymentProps {
  state: PaymentState;
  qrUrl?: string;
  amount: number;
  transactionCode: string;
  bankInfo?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  timeLeft?: number; // seconds
  onRetry?: () => void;
  onCancel?: () => void;
}

export default function QRPayment({
  state,
  qrUrl,
  amount,
  transactionCode,
  bankInfo,
  timeLeft = 0,
  onRetry,
  onCancel
}: QRPaymentProps) {
  const [currentTimeLeft, setCurrentTimeLeft] = React.useState(timeLeft);
  const [redirectCountdown, setRedirectCountdown] = React.useState(5);

  React.useEffect(() => {
    if (state === 'success' && redirectCountdown > 0) {
      const timer = setInterval(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (state === 'success' && redirectCountdown === 0) {
      window.location.href = '/dashboard';
    }
  }, [state, redirectCountdown]);

  React.useEffect(() => {
    setCurrentTimeLeft(timeLeft);
  }, [timeLeft]);

  React.useEffect(() => {
    if (state !== 'pending' || currentTimeLeft <= 0) return;

    const timer = setInterval(() => {
      setCurrentTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [state, currentTimeLeft]);

  const displayState = (state === 'pending' && currentTimeLeft <= 0) ? 'expired' : state;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // Ideally useToast here, but for simplicity we rely on OS visual feedback or just the quick flash
  };

  return (
    <div className="w-full max-w-[420px] mx-auto bg-white rounded-fha-lg border border-[var(--fha-border)] shadow-fha-md overflow-hidden">

      {/* Header */}
      <div className="bg-[var(--fha-surface-2)] p-5 border-b border-[var(--fha-border)] text-center relative">
        <h3 className="text-[17px] font-bold text-[var(--fha-text)]">Thanh Toán Chuyển Khoản</h3>
        <p className="text-[13px] text-[var(--fha-text-muted)] mt-1">Mã đơn: <span className="font-mono text-[var(--fha-brand)] font-semibold">{transactionCode}</span></p>

        {displayState === 'pending' && currentTimeLeft > 0 && (
          <div className="absolute top-5 right-5 text-[var(--fha-warning-text)] bg-[var(--fha-warning-bg)] border border-[var(--fha-warning-border)] px-2 py-1 rounded text-xs font-bold font-mono">
            {formatTime(currentTimeLeft)}
          </div>
        )}
      </div>

      <div className="p-6 sm:p-8 flex flex-col items-center">

        {/* State Content */}
        <div className="w-full max-w-[220px] aspect-square rounded-2xl flex items-center justify-center bg-white p-2 relative overflow-hidden mb-6 border-2 border-[var(--fha-border-strong)]">

          {displayState === 'loading' && (
            <div className="w-full h-full shimmer" />
          )}

          {displayState === 'pending' && qrUrl && (

            <img src={qrUrl} alt="QR Code" className="w-full h-full object-contain p-1" />
          )}

          {displayState === 'checking' && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center text-[var(--fha-text)]">
              <Spinner size="lg" color="brand" />
              <p className="mt-4 font-semibold text-sm">Đang xác nhận...</p>
            </div>
          )}

          {displayState === 'success' && (
            <div className="absolute inset-0 bg-[var(--fha-success-bg)] flex flex-col items-center justify-center text-[var(--fha-success)]">
              <svg className="w-14 h-14 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-bold">Thành công!</p>
            </div>
          )}

          {displayState === 'expired' && (
            <div className="absolute inset-0 bg-[var(--fha-surface-2)] flex flex-col items-center justify-center text-[var(--fha-text-muted)]">
              <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-bold text-sm">QR Đã Hết Hạn</p>
            </div>
          )}

          {displayState === 'failed' && (
            <div className="absolute inset-0 bg-[var(--fha-error-bg)] flex flex-col items-center justify-center text-[var(--fha-error)]">
              <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-bold text-sm text-center px-4">Lỗi giao dịch</p>
            </div>
          )}
        </div>

        {/* Amount */}
        <div className="text-center mb-6">
          <p className="text-[13px] font-medium text-[var(--fha-text-muted)] mb-1">Số tiền thanh toán</p>
          <div className="text-[32px] font-bold font-mono tracking-tight text-[var(--fha-brand)]">
            {formatCurrency(amount)}
          </div>
        </div>

        {(displayState === 'pending' || displayState === 'loading' || displayState === 'checking') && bankInfo && (
          <div className="w-full bg-[var(--fha-surface-2)] border border-[var(--fha-border)] rounded-fha p-4 space-y-3 text-[13px]">
            <div className="flex justify-between items-center">
              <span className="text-[var(--fha-text-muted)]">Ngân hàng</span>
              <span className="font-medium text-[var(--fha-text)]">{bankInfo.bankName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--fha-text-muted)]">Chủ tài khoản</span>
              <span className="font-medium text-[var(--fha-text)] uppercase">{bankInfo.accountName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--fha-text-muted)]">Số tài khoản</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-semibold text-[var(--fha-text)]">{bankInfo.accountNumber}</span>
                <button
                  onClick={() => handleCopy(bankInfo.accountNumber)}
                  className="p-1 rounded text-[var(--fha-text-faint)] hover:text-[var(--fha-brand)] hover:bg-[var(--fha-brand-soft)] transition-colors"
                  aria-label="Sao chép số tài khoản"
                  title="Sao chép"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </button>
              </div>
            </div>
            <div className="flex justify-between items-start pt-3 border-t border-[var(--fha-border-strong)]">
              <span className="text-[var(--fha-text-muted)] mt-0.5">Nội dung (Bắt buộc)</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-[var(--fha-brand)]">{transactionCode}</span>
                <button
                  onClick={() => handleCopy(transactionCode)}
                  className="p-1 rounded text-[var(--fha-text-faint)] hover:text-[var(--fha-brand)] hover:bg-[var(--fha-brand-soft)] transition-colors"
                  aria-label="Sao chép nội dung"
                  title="Sao chép"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="w-full mt-6 space-y-3">
          {(displayState === 'expired' || displayState === 'failed') && onRetry && (
            <Button variant="primary" fullWidth onClick={onRetry}>
              Thử lại / Tạo QR Mới
            </Button>
          )}

          {(displayState === 'pending' || displayState === 'expired' || displayState === 'failed') && onCancel && (
            <Button variant="ghost" fullWidth onClick={onCancel}>
              Hủy thanh toán
            </Button>
          )}

          {displayState === 'success' && (
            <div className="w-full space-y-4">
              <p className="text-sm text-[var(--fha-text-muted)] text-center">
                Giao dịch hoàn tất. Tự động quay về Trang Quản Lý sau <span className="font-bold text-[var(--fha-text)]">{redirectCountdown}s</span>...
              </p>
              <Button variant="primary" fullWidth onClick={() => window.location.href = '/dashboard'}>
                Vào Trang Quản Lý
              </Button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
