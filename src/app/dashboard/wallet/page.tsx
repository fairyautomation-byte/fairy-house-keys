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
  const { error: toastError } = useToast();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  
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
            cache: 'no-store', // Prevent browser caching
            headers: { 'Cache-Control': 'no-cache' }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'PAID') {
              setPaymentState('success');
              setBalance(prev => prev + (transactionInfo.amount || 0));
              clearInterval(intervalId);
            } else if (data.status === 'CANCELLED') {
              setPaymentState('expired');
              clearInterval(intervalId);
            }
          }
        } catch (error) {
          console.error("Polling error:", error);
        }
      }, 3000); // Check every 3 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [paymentState, transactionInfo]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(depositAmount.replace(/[^0-9]/g, ''));
    if (isNaN(amount) || amount < 10000) {
      toastError('Số tiền nạp tối thiểu là 10.000đ');
      return;
    }

    // Initialize PayOS flow
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

      // Map popular BINs to Bank Names
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
        timeLeft: 300 // 5 minutes
      });
      setPaymentState('pending');
    } catch (err: any) {
      toastError(err.message || 'Lỗi tạo mã QR');
      setShowQR(false);
    }
  };

  const handleCancelPayment = () => {
    setShowQR(false);
    setDepositAmount('');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-white border border-[var(--fha-border)] rounded-fha-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[240px] w-full rounded-fha-lg" />
          <Skeleton className="h-[240px] w-full rounded-fha-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Ví & Nạp Tiền" 
        description="Quản lý số dư và nạp tiền vào ví qua QR PayOS"
      />

      {!showQR ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <Card variant="highlight" className="flex flex-col items-center justify-center py-12 bg-white border-[var(--fha-brand)] ring-1 ring-[var(--fha-brand)]">
            <span className="text-[var(--fha-text-muted)] mb-2 font-semibold tracking-wide text-sm uppercase">Số Dư Hiện Tại</span>
            <div className="text-[40px] md:text-[48px] font-black font-mono text-[var(--fha-brand)] tracking-tight">
              {formatCurrency(balance)}
            </div>
          </Card>

          <Card variant="default">
            <h3 className="text-[17px] font-bold text-[var(--fha-text)] mb-6">Nạp tiền vào ví</h3>
            <form onSubmit={handleDeposit} className="space-y-5">
              <Input
                label="Nhập số tiền cần nạp"
                type="text"
                placeholder="VD: 100,000"
                value={depositAmount}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setDepositAmount(val ? parseInt(val).toLocaleString('vi-VN') : '');
                }}
                rightIcon={<span className="text-[var(--fha-text-muted)] font-medium text-[13px]">VNĐ</span>}
              />
              
              <div className="flex flex-wrap gap-2">
                {[50000, 100000, 200000, 500000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt.toLocaleString('vi-VN'))}
                    className="flex-1 min-w-[70px] py-2 rounded-fha border border-[var(--fha-border)] bg-[var(--fha-surface-2)] hover:bg-[var(--fha-brand-soft)] hover:border-[var(--fha-brand)] hover:text-[var(--fha-brand)] text-[12px] font-semibold text-[var(--fha-text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)]"
                  >
                    {amt.toLocaleString('vi-VN')}
                  </button>
                ))}
              </div>

              <div className="pt-5 border-t border-[var(--fha-border)]">
                <Button type="submit" variant="primary" fullWidth size="lg">
                  Tạo QR Nạp Tiền
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : (
        <div className="flex justify-center animate-fade-in">
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
      )}
    </div>
  );
}
