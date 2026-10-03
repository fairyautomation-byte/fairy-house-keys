'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import CopyField from '@/components/ui/CopyField';
import QRPayment, { PaymentState } from '@/components/features/QRPayment';
import { useToast } from '@/components/ui/ToastProvider';
import { formatCurrency } from '@/lib/format';

const PLAN_PRICES: Record<string, { name: string; price: number; features: string[] }> = {
  trial: { name: '3 Ngày Dùng Thử', price: 0, features: ['100 lượt scan/ngày', 'Dùng 1 lần duy nhất'] },
  monthly: { name: '1 Tháng', price: 69000, features: ['1.000 lượt scan/ngày', 'Nâng cấp linh hoạt', 'Kích hoạt tự động'] },
  quarterly: { name: '3 Tháng', price: 179000, features: ['3.000 lượt scan/ngày', 'Tiết kiệm chi phí', 'Kích hoạt tự động'] },
  yearly: { name: '1 Năm', price: 479000, features: ['Không giới hạn scan', 'Hỗ trợ ưu tiên 24/7', 'Kích hoạt tự động'] },
};

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get('plan') || 'monthly';
  
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlan);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userBalance, setUserBalance] = useState<number | null>(null);
  
  // Payment Flow State: 'select' | 'payos_qr' | 'success'
  const [paymentStep, setPaymentStep] = useState<'select' | 'payos_qr' | 'success'>('select');
  const [qrState, setQrState] = useState<PaymentState>('loading');
  const [payosData, setPayosData] = useState<{
    orderCode: number;
    amount: number;
    transactionCode: string;
    qrUrl: string;
    bankInfo: { bankName: string; accountNumber: string; accountName: string };
    timeLeft: number;
    checkoutUrl?: string;
  } | null>(null);
  const [createdKey, setCreatedKey] = useState<string>('');
  
  const { success: toastSuccess, error: toastError } = useToast();

  // Load user balance to support direct wallet payment if funds exist
  useEffect(() => {
    fetch('/api/user/dashboard')
      .then(res => res.json())
      .then(data => {
        if (data.user && typeof data.user.wallet_balance === 'number') {
          setUserBalance(data.user.wallet_balance);
        }
      })
      .catch(() => {});
  }, []);

  // Fallback if invalid initial plan
  useEffect(() => {
    if (!PLAN_PRICES[selectedPlanId]) setSelectedPlanId('monthly');
  }, [selectedPlanId]);

  const plan = PLAN_PRICES[selectedPlanId] || PLAN_PRICES['monthly'];
  const isTrial = selectedPlanId === 'trial';
  const hasEnoughBalance = userBalance !== null && userBalance >= plan.price && plan.price > 0;

  // Poll PayOS order status when QR is active
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (paymentStep === 'payos_qr' && payosData?.orderCode && qrState === 'pending') {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`/api/payos/check-order?orderCode=${payosData.orderCode}`, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'PAID') {
              clearInterval(intervalId);
              setQrState('checking');
              
              // Automatically activate key with the credited wallet
              try {
                const buyRes = await fetch('/api/orders/pay-with-wallet', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ planId: selectedPlanId })
                });
                const buyData = await buyRes.json();
                
                if (buyRes.ok && buyData.licenseKey) {
                  setCreatedKey(buyData.licenseKey);
                  setQrState('success');
                  setPaymentStep('success');
                  toastSuccess('Thanh toán thành công qua PayOS! Key đã được kích hoạt.');
                } else {
                  setPaymentStep('success');
                  toastSuccess('Thanh toán PayOS thành công!');
                }
              } catch (err: any) {
                setPaymentStep('success');
              }
            } else if (data.status === 'CANCELLED' || data.status === 'EXPIRED') {
              clearInterval(intervalId);
              setQrState('expired');
            }
          }
        } catch (e) {
          // ignore network glitch
        }
      }, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [paymentStep, payosData, qrState, selectedPlanId, toastSuccess]);

  // Handle Trial Activation or Direct Wallet Payment
  const handleWalletOrTrialCheckout = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/orders/pay-with-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlanId })
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'TRIAL_ALREADY_USED') {
          throw new Error('Mỗi tài khoản chỉ được đăng ký gói Dùng thử 1 lần duy nhất.');
        }
        if (data.error === 'INSUFFICIENT_FUNDS') {
          throw new Error('Số dư ví không đủ, vui lòng thanh toán tự động qua PayOS.');
        }
        throw new Error(data.error || 'Có lỗi xảy ra');
      }

      setCreatedKey(data.licenseKey || '');
      setPaymentStep('success');
      toastSuccess(isTrial ? 'Kích hoạt dùng thử thành công!' : 'Thanh toán thành công! Key đã sẵn sàng.');
    } catch (err: any) {
      setError(err.message);
      toastError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle PayOS Automatic Checkout
  const handlePayOSCheckout = async () => {
    setLoading(true);
    setError('');
    setPaymentStep('payos_qr');
    setQrState('loading');

    try {
      const res = await fetch('/api/payos/create-payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: plan.price,
          description: `FH ${selectedPlanId}`,
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Không thể tạo cổng thanh toán PayOS');
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
      const niceBankName = bankNames[data.bin] || data.bin || 'MB Bank';

      setPayosData({
        orderCode: data.orderCode,
        amount: data.amount,
        transactionCode: data.description || data.orderCode.toString(),
        qrUrl: `https://img.vietqr.io/image/${data.bin}-${data.accountNumber}-compact2.jpg?amount=${data.amount}&addInfo=${encodeURIComponent(data.description || data.orderCode)}&accountName=${encodeURIComponent(data.accountName)}`,
        bankInfo: {
          bankName: niceBankName,
          accountNumber: data.accountNumber,
          accountName: data.accountName
        },
        timeLeft: 300,
        checkoutUrl: data.checkoutUrl
      });
      setQrState('pending');
    } catch (err: any) {
      setError(err.message);
      toastError(err.message);
      setPaymentStep('select');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPayment = () => {
    setPaymentStep('select');
    setPayosData(null);
  };

  return (
    <div className="min-h-screen bg-[var(--fha-surface-2)] flex py-10 px-4 sm:px-6 relative overflow-hidden font-sans">
      <div className="max-w-[800px] w-full mx-auto space-y-8 relative z-10">
        
        {/* Header with Brand Logo */}
        <div className="text-center mb-6 flex flex-col items-center">
          <Link href="/" className="mb-3 inline-flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)] rounded p-1">
            <Image src="/logo.png" alt="Fairy House" width={40} height={40} className="rounded shrink-0" />
            <span className="font-bold text-base tracking-tight text-[var(--fha-text)]">
              Fairy House <span className="text-[var(--fha-brand)]">AutoData</span>
            </span>
          </Link>
          <h1 className="text-[28px] sm:text-[32px] font-black text-[var(--fha-text)] tracking-tight">
            {paymentStep === 'success' ? 'Kích Hoạt Thành Công' : paymentStep === 'payos_qr' ? 'Thanh Toán Tự Động PayOS' : 'Thanh Toán & Kích Hoạt Key'}
          </h1>
          <p className="mt-1 text-[var(--fha-text-muted)] text-[14px]">
            {paymentStep === 'success'
              ? 'Đơn hàng đã được thanh toán và kích hoạt tức thì'
              : paymentStep === 'payos_qr'
              ? 'Quét mã VietQR bằng bất kỳ App ngân hàng nào để kích hoạt tự động'
              : 'Hệ thống tự động duyệt đơn & cấp License Key trong vài giây'}
          </p>
        </div>

        {error && (
          <Alert variant="danger" title="Lỗi">
            {error}
          </Alert>
        )}

        {/* STEP 1: Select Plan */}
        {paymentStep === 'select' && (
          <div className="bg-white p-6 sm:p-10 rounded-fha-lg shadow-sm border border-[var(--fha-border)]">
            <div className="flex items-center justify-between mb-6 border-b border-[var(--fha-border)] pb-4">
              <h2 className="text-[18px] sm:text-[20px] font-bold text-[var(--fha-text)]">Chọn Gói Cần Mua</h2>
              {userBalance !== null && (
                <div className="text-[13px] text-[var(--fha-text-muted)]">
                  Số dư ví: <span className="font-bold text-[var(--fha-brand)]">{formatCurrency(userBalance)}</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {Object.entries(PLAN_PRICES).map(([id, p]) => (
                <div 
                  key={id}
                  onClick={() => setSelectedPlanId(id)}
                  className={`cursor-pointer rounded-fha p-5 border transition-all flex flex-col relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)] ${selectedPlanId === id ? 'bg-[var(--fha-brand-soft)] border-[var(--fha-brand)] shadow-sm' : 'bg-white border-[var(--fha-border-strong)] hover:border-[var(--fha-text-muted)]'}`}
                  tabIndex={0}
                  onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') setSelectedPlanId(id); }}
                >
                  {selectedPlanId === id && <div className="absolute top-0 right-0 bg-[var(--fha-brand)] text-white text-[10px] font-bold px-2 py-0.5 rounded-bl">ĐANG CHỌN</div>}
                  <h3 className="text-[15px] font-bold text-[var(--fha-text)] mb-1">{p.name}</h3>
                  <p className={`font-black text-[22px] mb-4 pb-4 border-b ${selectedPlanId === id ? 'text-[var(--fha-brand)] border-[var(--fha-brand)]/20' : 'text-[var(--fha-text)] border-[var(--fha-border)]'}`}>
                    {p.price === 0 ? 'Miễn phí' : `${p.price.toLocaleString('vi-VN')}đ`}
                  </p>
                  <ul className="space-y-2 mt-auto">
                    {p.features.map((f, i) => (
                      <li key={i} className="text-[12px] text-[var(--fha-text-muted)] flex items-start gap-1.5">
                        <span className={`font-bold mt-0.5 ${selectedPlanId === id ? 'text-[var(--fha-brand)]' : 'text-[var(--fha-text-muted)]'}`}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-[var(--fha-border)]">
              <div>
                <span className="text-[var(--fha-text-muted)] text-[15px] font-medium block">Tổng tiền thanh toán:</span>
                <span className="text-[12px] text-[var(--fha-text-muted)]">Cấp key tự động 100% qua PayOS</span>
              </div>
              <span className="font-black text-[28px] text-[var(--fha-text)]">
                {plan.price === 0 ? 'Miễn phí' : `${plan.price.toLocaleString('vi-VN')}đ`}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {isTrial ? (
                <Button 
                  onClick={handleWalletOrTrialCheckout} 
                  loading={loading}
                  size="lg"
                  variant="primary"
                  fullWidth
                  className="h-[52px] text-[16px]"
                >
                  Kích hoạt dùng thử ngay (0đ)
                </Button>
              ) : hasEnoughBalance ? (
                <div className="space-y-3">
                  <Button 
                    onClick={handleWalletOrTrialCheckout} 
                    loading={loading}
                    size="lg"
                    variant="primary"
                    fullWidth
                    className="h-[52px] text-[16px]"
                  >
                    Thanh toán ngay bằng Số dư ví ({formatCurrency(plan.price)})
                  </Button>
                  <Button 
                    onClick={handlePayOSCheckout} 
                    loading={loading}
                    size="md"
                    variant="secondary"
                    fullWidth
                    className="h-[46px]"
                  >
                    Thanh toán bằng VietQR qua PayOS
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={handlePayOSCheckout} 
                  loading={loading}
                  size="lg"
                  variant="primary"
                  fullWidth
                  className="h-[52px] text-[16px] flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <span>Thanh toán tự động qua PayOS (VietQR)</span>
                </Button>
              )}

              <div className="flex items-center justify-between pt-2">
                <Link href="/" className="inline-flex items-center text-sm font-medium text-[var(--fha-text-muted)] hover:text-[var(--fha-brand)] transition-colors">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Về Trang Chủ Web
                </Link>
                <Link href="/dashboard" className="text-sm font-medium text-[var(--fha-brand)] hover:underline">
                  Vào Dashboard
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PayOS QR Payment (100% Automated) */}
        {paymentStep === 'payos_qr' && payosData && (
          <div className="space-y-4 animate-fade-in">
            <QRPayment 
              state={qrState}
              qrUrl={payosData.qrUrl}
              amount={payosData.amount}
              transactionCode={payosData.transactionCode}
              bankInfo={payosData.bankInfo}
              timeLeft={payosData.timeLeft}
              onRetry={handlePayOSCheckout}
              onCancel={handleCancelPayment}
            />

            <div className="max-w-[420px] mx-auto text-center space-y-2">
              {payosData.checkoutUrl && (
                <a 
                  href={payosData.checkoutUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block text-xs font-semibold text-[var(--fha-brand)] hover:underline"
                >
                  Mở trang thanh toán PayOS trong tab mới →
                </a>
              )}
              <div className="pt-2">
                <Button variant="ghost" size="sm" onClick={handleCancelPayment} className="text-[var(--fha-text-muted)]">
                  ← Chọn lại gói dịch vụ khác
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Success State with Generated License Key */}
        {paymentStep === 'success' && (
          <div className="bg-white rounded-fha-lg p-8 sm:p-10 shadow-sm border border-[var(--fha-border)] max-w-[600px] mx-auto animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[var(--fha-success-bg)] border border-[var(--fha-success-border)] text-[var(--fha-success)] flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-[22px] font-black text-[var(--fha-text)] tracking-tight">Kích Hoạt Thành Công!</h2>
              <p className="text-[14px] text-[var(--fha-text-muted)] mt-1">
                Gói <span className="font-bold text-[var(--fha-text)]">{plan.name}</span> đã sẵn sàng sử dụng.
              </p>
            </div>

            {createdKey && (
              <div className="mb-6 bg-[var(--fha-surface-2)] p-5 rounded-fha border border-[var(--fha-border)]">
                <CopyField label="License Key của bạn" value={createdKey} />
                <p className="text-[12px] text-[var(--fha-text-muted)] mt-2">
                  * Vui lòng sao chép Key và dán vào Extension để kích hoạt. Key cũng đã được gửi về email của bạn.
                </p>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <Link href="/dashboard/licenses" passHref className="block">
                <Button variant="primary" fullWidth size="lg">
                  Quản lý License Của Tôi
                </Button>
              </Link>
              <Link href="/" passHref className="block">
                <Button variant="secondary" fullWidth size="md">
                  Về Trang Chủ Web
                </Button>
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
