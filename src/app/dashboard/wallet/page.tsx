'use client';
import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import QRPayment, { PaymentState } from '@/components/features/QRPayment';
import { formatCurrency } from '@/lib/format';
import { useToast } from '@/components/ui/ToastProvider';

export default function WalletPage() {
  const { error: toastError, success: toastSuccess } = useToast();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('100.000');
  
  // Payment Flow State
  const [paymentState, setPaymentState] = useState<PaymentState>('loading');
  const [showQR, setShowQR] = useState(false);
  const [transactionInfo, setTransactionInfo] = useState<any>(null);

  useEffect(() => {
    // Fetch wallet balance
    fetch('/api/user/dashboard')
      .then(res => res.json())
      .then(data => {
        setBalance(data.user?.wallet_balance || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Poll for payment status
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (paymentState === 'pending' && transactionInfo?.transactionCode) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`/api/payos/check-order?orderCode=${transactionInfo.transactionCode}`, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'PAID') {
              setPaymentState('success');
              setBalance(prev => prev + (transactionInfo.amount || 0));
              toastSuccess('Nạp tiền vào ví thành công!');
              clearInterval(intervalId);
            } else if (data.status === 'CANCELLED') {
              setPaymentState('expired');
              clearInterval(intervalId);
            }
          }
        } catch (error) {
          console.error("Polling error:", error);
        }
      }, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [paymentState, transactionInfo, toastSuccess]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(depositAmount.replace(/[^0-9]/g, ''));
    if (isNaN(amount) || amount < 10000) {
      toastError('Số tiền nạp tối thiểu là 10.000đ');
      return;
    }

    setShowQR(true);
    setPaymentState('loading');
    
    try {
      const res = await fetch('/api/payos/create-payment-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi tạo mã QR');
      }

      const bankNames: Record<string, string> = {
        '970422': 'MB Bank',
        '970436': 'Vietcombank',
        '970415': 'VietinBank',
        '970418': 'BIDV',
        '970407': 'Techcombank',
        '970423': 'TPBank',
        '970432': 'VPBank',
        '970403': 'Sacombank',
      };
      
      const niceBankName = bankNames[data.bin] || data.bin;

      setTransactionInfo({
        amount: data.amount,
        transactionCode: data.description || data.orderCode.toString(),
        qrUrl: `https://img.vietqr.io/image/${data.bin}-${data.accountNumber}-compact2.jpg?amount=${data.amount}&addInfo=${data.description || data.orderCode}&accountName=${encodeURIComponent(data.accountName)}`,
        bankInfo: {
          bankName: niceBankName,
          accountNumber: data.accountNumber,
          accountName: data.accountName
        },
        timeLeft: 300
      });
      setPaymentState('pending');
    } catch (err: any) {
      toastError(err.message || 'Lỗi tạo mã QR');
      setShowQR(false);
    }
  };

  const handleCancelPayment = () => {
    setShowQR(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-fha-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-5 h-[340px] w-full rounded-fha-lg" />
          <Skeleton className="lg:col-span-7 h-[340px] w-full rounded-fha-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Bàn Thu Ngân & Nạp Ví" 
        description="Nạp số dư tài khoản tự động 24/7 thông qua cổng chuyển khoản VietQR PayOS"
      />

      {/* 2-Column Split Cashier Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (5 cols): Balance Card & Deposit Form */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Balance Footprint Card */}
          <div className="bg-white rounded-fha-lg border-2 border-[var(--fha-border-strong)] p-6 shadow-fha-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--fha-text-muted)]">
                Số Dư Ví Của Bạn
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--fha-success-bg)] text-[var(--fha-success)] border border-[var(--fha-success-border)]">
                Sẵn Sàng Thanh Toán
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-black font-mono text-[var(--fha-brand)] tracking-tight">
              {formatCurrency(balance)}
            </div>

            <div className="mt-3 text-xs text-[var(--fha-text-muted)] leading-relaxed">
              Dùng để mua hoặc gia hạn các gói bản quyền Extension bất kỳ lúc nào với 1 click.
            </div>
          </div>

          {/* Deposit Form */}
          <div className="bg-white rounded-fha-lg border border-[var(--fha-border)] p-6 shadow-fha-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-[var(--fha-text)]">Cấu Hình Nạp Tiền</h3>
              <p className="text-xs text-[var(--fha-text-muted)] mt-0.5">Tạo mã VietQR tự động khớp nội dung</p>
            </div>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--fha-text)] block mb-1.5">
                  Số tiền muốn nạp (tối thiểu 10.000đ):
                </label>
                <Input
                  type="text"
                  placeholder="VD: 100.000"
                  value={depositAmount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setDepositAmount(val ? parseInt(val).toLocaleString('vi-VN') : '');
                  }}
                  rightIcon={<span className="text-[var(--fha-text-muted)] font-bold text-xs">VNĐ</span>}
                />
              </div>

              {/* Fast Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[var(--fha-text-muted)]">Mệnh giá phổ biến:</span>
                <div className="grid grid-cols-3 gap-2">
                  {[50000, 100000, 200000, 500000, 1000000, 2000000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDepositAmount(amt.toLocaleString('vi-VN'))}
                      className={`py-2 px-1 text-center rounded-fha text-xs font-bold border transition-colors active:scale-95 ${
                        depositAmount === amt.toLocaleString('vi-VN')
                          ? 'border-[var(--fha-brand)] bg-[var(--fha-brand-soft)] text-[var(--fha-brand)]'
                          : 'border-[var(--fha-border)] bg-[var(--fha-surface-2)] text-[var(--fha-text)] hover:border-[var(--fha-border-strong)]'
                      }`}
                    >
                      {amt >= 1000000 ? `${amt / 1000000} Triệu` : `${amt / 1000}k`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--fha-border)]">
                <Button 
                  type="submit" 
                  variant="primary" 
                  fullWidth 
                  size="lg" 
                  className="font-bold text-sm shadow-fha-sm"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Tạo Mã VietQR Nạp Tiền
                </Button>
              </div>
            </form>
          </div>

        </div>

        {/* Right Column (7 cols): Cashier Screen (Live QR or PayOS Instructions) */}
        <div className="lg:col-span-7">
          {showQR ? (
            <div className="animate-fade-in">
              <QRPayment 
                state={paymentState}
                amount={transactionInfo?.amount || 0}
                transactionCode={transactionInfo?.transactionCode || ''}
                qrUrl={transactionInfo?.qrUrl}
                bankInfo={transactionInfo?.bankInfo}
                timeLeft={transactionInfo?.timeLeft}
                onCancel={handleCancelPayment}
              />
            </div>
          ) : (
            <div className="bg-white rounded-fha-lg border border-[var(--fha-border)] p-7 space-y-6 shadow-fha-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fha-brand)] bg-[var(--fha-brand-soft)] px-2.5 py-0.5 rounded">
                  Cổng Thanh Toán Tự Động
                </span>
                <h3 className="text-xl font-bold text-[var(--fha-text)] mt-2">
                  Quy Trình Nạp Ví Tức Thì Qua VietQR
                </h3>
                <p className="text-xs text-[var(--fha-text-muted)] leading-relaxed">
                  Hệ thống kết nối trực tiếp với cổng trung gian thanh toán PayOS được Ngân hàng Nhà nước cấp phép.
                </p>
              </div>

              {/* 3 Step Guidelines */}
              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3.5 p-3.5 bg-[var(--fha-surface-2)] rounded-fha border border-[var(--fha-border)]">
                  <div className="w-7 h-7 rounded bg-white border border-[var(--fha-border-strong)] text-[var(--fha-text)] font-black text-xs flex items-center justify-center shrink-0 font-mono">
                    1
                  </div>
                  <div>
                    <div className="font-bold text-xs text-[var(--fha-text)]">Nhập số tiền & bấm Tạo Mã QR</div>
                    <div className="text-[11px] text-[var(--fha-text-muted)] mt-0.5">
                      Hệ thống tự động sinh mã VietQR động chứa chính xác số tiền và mã nhận diện.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 bg-[var(--fha-surface-2)] rounded-fha border border-[var(--fha-border)]">
                  <div className="w-7 h-7 rounded bg-white border border-[var(--fha-border-strong)] text-[var(--fha-text)] font-black text-xs flex items-center justify-center shrink-0 font-mono">
                    2
                  </div>
                  <div>
                    <div className="font-bold text-xs text-[var(--fha-text)]">Quét mã bằng App Ngân Hàng</div>
                    <div className="text-[11px] text-[var(--fha-text-muted)] mt-0.5">
                      Mở bất kỳ app ngân hàng nào (MBBank, Vietcombank, Techcombank, BIDV, Momo...) để quét QR.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 bg-[var(--fha-surface-2)] rounded-fha border border-[var(--fha-border)]">
                  <div className="w-7 h-7 rounded bg-white border border-[var(--fha-border-strong)] text-[var(--fha-text)] font-black text-xs flex items-center justify-center shrink-0 font-mono">
                    3
                  </div>
                  <div>
                    <div className="font-bold text-xs text-[var(--fha-text)]">Số dư cộng tự động trong 5 giây</div>
                    <div className="text-[11px] text-[var(--fha-text-muted)] mt-0.5">
                      Ngay sau khi ngân hàng báo trừ tiền, số dư ví sẽ lập tức được cập nhật trên màn hình.
                    </div>
                  </div>
                </div>
              </div>

              {/* Guarantees */}
              <div className="pt-4 border-t border-[var(--fha-border)] flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--fha-text-muted)]">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-[var(--fha-success)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Khớp lệnh tự động 100% không cần chụp bill</span>
                </div>

                <a 
                  href="https://zalo.me/0378791667" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="font-bold text-[var(--fha-brand)] hover:underline"
                >
                  Hotline Kế toán Zalo &rarr;
                </a>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
