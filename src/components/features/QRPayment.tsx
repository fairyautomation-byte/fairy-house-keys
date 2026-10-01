import React from 'react';
import Image from 'next/image';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';

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
  const [redirectCountdown, setRedirectCountdown] = React.useState(10);

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

  const formatCurrency = (val: number) => val.toLocaleString('vi-VN') + 'đ';

  return (
    <div className="w-full max-w-md mx-auto bg-fha-glass backdrop-blur-2xl rounded-3xl border border-fha-glass-border shadow-fha-outset overflow-hidden">
      
      {/* Header */}
      <div className="bg-fha-surface/40 p-5 border-b border-fha-glass-border text-center relative">
        <h3 className="text-lg font-bold text-fha-text">Thanh Toán Chuyển Khoản</h3>
        <p className="text-sm text-fha-text-muted mt-1">Mã đơn: <span className="font-mono text-fha-cyan">{transactionCode}</span></p>
        
        {displayState === 'pending' && currentTimeLeft > 0 && (
          <div className="absolute top-5 right-5 text-fha-warning bg-fha-warning-bg px-2 py-1 rounded text-xs font-bold font-mono">
            {formatTime(currentTimeLeft)}
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col items-center">
        
        {/* State Content */}
        <div className="w-full max-w-[240px] aspect-square rounded-2xl flex items-center justify-center bg-white p-2 relative overflow-hidden mb-6 shadow-fha-outset border-4 border-fha-surface/50">
          
          {displayState === 'loading' && (
            <div className="w-full h-full bg-slate-200 animate-shimmer" />
          )}

          {displayState === 'pending' && qrUrl && (
            <img src={qrUrl} alt="QR Code" className="w-full h-full object-contain p-2" />
          )}

          {displayState === 'checking' && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur flex flex-col items-center justify-center text-slate-800">
              <Spinner size="lg" color="cyan" />
              <p className="mt-4 font-semibold text-sm">Đang xác nhận...</p>
            </div>
          )}

          {displayState === 'success' && (
            <div className="absolute inset-0 bg-emerald-50 flex flex-col items-center justify-center text-emerald-600">
              <svg className="w-16 h-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-bold">Thành công!</p>
            </div>
          )}

          {displayState === 'expired' && (
            <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center text-slate-500">
              <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-bold text-sm">QR Đã Hết Hạn</p>
            </div>
          )}

          {displayState === 'failed' && (
            <div className="absolute inset-0 bg-rose-50 flex flex-col items-center justify-center text-rose-500">
              <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-bold text-sm text-center px-4">Lỗi giao dịch</p>
            </div>
          )}
        </div>

        {/* Amount */}
        <div className="text-center mb-6">
          <p className="text-sm text-fha-text-muted mb-1">Số tiền thanh toán</p>
          <div className="text-3xl font-black font-mono text-fha-cyan">
            {formatCurrency(amount)}
          </div>
        </div>

        {(displayState === 'pending' || displayState === 'loading' || displayState === 'checking') && bankInfo && (
          <div className="w-full bg-fha-bg shadow-fha-inset rounded-xl p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-fha-text-muted">Ngân hàng</span>
              <span className="font-semibold text-fha-text">{bankInfo.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fha-text-muted">Số tài khoản</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-fha-text">{bankInfo.accountNumber}</span>
                <button 
                  onClick={() => navigator.clipboard.writeText(bankInfo.accountNumber)}
                  className="text-fha-cyan hover:text-fha-cyan-hover"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </button>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-fha-text-muted">Nội dung (Bắt buộc)</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-fha-warning">{transactionCode}</span>
                <button 
                  onClick={() => navigator.clipboard.writeText(transactionCode)}
                  className="text-fha-cyan hover:text-fha-cyan-hover"
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
            <div className="w-full space-y-3">
              <p className="text-[13px] text-fha-text-muted text-center">
                Giao dịch hoàn tất. Tự động quay về Trang Quản Lý sau <span className="font-bold text-fha-text">{redirectCountdown}s</span>...
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
