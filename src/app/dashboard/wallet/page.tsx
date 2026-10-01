'use client';
import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import QRPayment, { PaymentState } from '@/components/features/QRPayment';

export default function WalletPage() {
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

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(depositAmount.replace(/[^0-9]/g, ''));
    if (isNaN(amount) || amount < 10000) {
      alert('Số tiền nạp tối thiểu là 10.000đ');
      return;
    }

    // Initialize PayOS flow (placeholder for now)
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
          description: 'Nap Tien FHA',
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi tạo mã QR');
      }

      // Convert QR code data from PayOS
      setTransactionInfo({
        amount: data.amount,
        transactionCode: data.orderCode.toString(),
        // PayOS usually uses VietQR standard or provides qrCode string, we can use the VietQR string they provide
        qrUrl: data.qrCode || `https://img.vietqr.io/image/${data.bin}-${data.accountNumber}-compact2.jpg?amount=${data.amount}&addInfo=${data.description}&accountName=${encodeURIComponent(data.accountName)}`,
        bankInfo: {
          bankName: data.bin,
          accountNumber: data.accountNumber,
          accountName: data.accountName
        },
        timeLeft: 300 // 5 minutes
      });
      setPaymentState('pending');
    } catch (err: any) {
      alert(err.message);
      setShowQR(false);
    }
  };

  const formatCurrency = (val: number) => val.toLocaleString('vi-VN') + 'đ';

  const handleCancelPayment = () => {
    setShowQR(false);
    setDepositAmount('');
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-16 bg-fha-surface-2 rounded-lg"></div>
        <div className="h-48 bg-fha-surface-2 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Ví & Nạp Tiền" 
        description="Quản lý số dư và nạp tiền vào ví qua PayOS QR Code"
      />

      {!showQR ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="highlight" className="flex flex-col items-center justify-center py-10 bg-gradient-to-br from-fha-surface to-fha-cyan/5">
            <span className="text-fha-text-muted mb-2 font-medium">Số Dư Hiện Tại</span>
            <div className="text-4xl md:text-5xl font-black font-mono text-fha-cyan drop-shadow-fha-cyan">
              {formatCurrency(balance)}
            </div>
          </Card>

          <Card variant="default">
            <h3 className="text-lg font-bold text-fha-text mb-4">Nạp tiền vào ví</h3>
            <form onSubmit={handleDeposit} className="space-y-4">
              <Input
                label="Nhập số tiền cần nạp"
                type="text"
                placeholder="VD: 100,000"
                value={depositAmount}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setDepositAmount(val ? parseInt(val).toLocaleString('vi-VN') : '');
                }}
                rightIcon={<span className="text-fha-text-muted font-medium">VNĐ</span>}
              />
              
              <div className="flex gap-2">
                {[50000, 100000, 200000, 500000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt.toLocaleString('vi-VN'))}
                    className="flex-1 py-1.5 rounded-md border border-fha-border bg-fha-surface hover:bg-fha-surface-3 hover:border-fha-cyan-border text-[11px] font-medium text-fha-text transition-colors"
                  >
                    {amt.toLocaleString('vi-VN')}
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-fha-border">
                <Button type="submit" variant="primary" fullWidth size="lg">
                  Tạo QR Nạp Tiền (PayOS)
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : (
        <div className="flex justify-center">
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
