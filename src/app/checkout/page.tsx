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

const PLAN_PRICES: Record<string, { name: string; price: number; originalPrice?: number; duration: string; scanLimit: string; features: string[] }> = {
  trial: { name: '3 Ngày Dùng Thử', price: 0, duration: '3 ngày', scanLimit: '100 lượt/ngày', features: ['100 lượt scan/ngày', 'Dùng thử 1 lần duy nhất', 'Kích hoạt ngay 0đ'] },
  monthly: { name: 'Gói 1 Tháng', price: 69000, originalPrice: 99000, duration: '30 ngày', scanLimit: '1.000 lượt/ngày', features: ['1.000 lượt scan/ngày', 'Nâng cấp linh hoạt', 'Kích hoạt tự động PayOS'] },
  quarterly: { name: 'Gói 3 Tháng', price: 179000, originalPrice: 297000, duration: '90 ngày', scanLimit: '3.000 lượt/ngày', features: ['3.000 lượt scan/ngày', 'Tiết kiệm 40% chi phí', 'Kích hoạt tự động PayOS'] },
  yearly: { name: 'Gói 1 Năm', price: 479000, originalPrice: 828000, duration: '365 ngày', scanLimit: 'Không giới hạn', features: ['Không giới hạn scan', 'Hỗ trợ ưu tiên 24/7', 'Kích hoạt tự động PayOS'] },
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
              } catch (e) {
                setPaymentStep('success');
                toastSuccess('Thanh toán PayOS thành công!');
              }
            } else if (data.status === 'CANCELLED') {
              setQrState('expired');
              clearInterval(intervalId);
            }
          }
        } catch (pollErr) {
          console.error("Polling error:", pollErr);
        }
      }, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [paymentStep, payosData, qrState, selectedPlanId, toastSuccess]);

  // Handle Trial or Direct Wallet Checkout
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
        throw new Error(data.error || 'Giao dịch không thành công');
      }

      setCreatedKey(data.licenseKey || '');
      setPaymentStep('success');
      toastSuccess(isTrial ? 'Kích hoạt gói dùng thử thành công!' : 'Thanh toán bằng số dư ví thành công!');
      if (typeof data.newBalance === 'number') setUserBalance(data.newBalance);
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
    <div className="min-h-screen bg-[var(--fha-surface-2)] py-10 px-4 sm:px-6 font-sans">
      <div className="max-w-[1200px] mx-auto space-y-8">
        
        {/* Brand Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-[var(--fha-border)]">
          <Link href="/" className="inline-flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)] rounded">
            <Image src="/logo.png" alt="Fairy House Logo" width={36} height={36} className="rounded shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-[var(--fha-text)]">
                Fairy House <span className="text-[var(--fha-brand)]">AutoData</span>
              </span>
              <span className="text-[11px] text-[var(--fha-text-muted)]">Cổng Thanh Toán Tự Động PayOS</span>
            </div>
          </Link>

          <Link href="/" className="text-xs font-semibold text-[var(--fha-text-muted)] hover:text-[var(--fha-brand)] flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Quay lại trang chủ</span>
          </Link>
        </div>

        {error && (
          <Alert variant="danger" title="Lỗi">
            {error}
          </Alert>
        )}

        {/* 2-Column Split Checkout Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ======================================================== */}
          {/* LEFT COLUMN (7 cols): Configuration & QR Terminal        */}
          {/* ======================================================== */}
          <div className="lg:col-span-7 space-y-6">
            
            {paymentStep === 'select' && (
              <div className="bg-white p-6 sm:p-7 rounded-fha-lg border border-[var(--fha-border)] shadow-fha-sm space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-[var(--fha-text)]">
                    1. Lựa Chọn Gói Dịch Vụ Cần Mua
                  </h2>
                  <p className="text-xs text-[var(--fha-text-muted)] mt-0.5">
                    Hệ thống cấp Key độc quyền 1 thiết bị và tự động kích hoạt tức thì.
                  </p>
                </div>

                {/* Plan Options Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {Object.entries(PLAN_PRICES).map(([id, p]) => {
                    const isSelected = selectedPlanId === id;

                    return (
                      <div
                        key={id}
                        onClick={() => setSelectedPlanId(id)}
                        className={`cursor-pointer rounded-fha p-4 border-2 transition-all flex flex-col justify-between relative ${
                          isSelected 
                            ? 'border-[var(--fha-brand)] bg-[var(--fha-brand-soft)] shadow-fha-sm' 
                            : 'border-[var(--fha-border)] bg-white hover:border-[var(--fha-border-strong)]'
                        }`}
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedPlanId(id); }}
                      >
                        {isSelected && (
                          <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--fha-brand)] text-white">
                            Đang chọn
                          </span>
                        )}

                        <div>
                          <div className="font-bold text-sm text-[var(--fha-text)]">{p.name}</div>
                          <div className="text-xs text-[var(--fha-text-muted)] mt-0.5">{p.duration} • {p.scanLimit}</div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[var(--fha-border)] flex items-baseline justify-between">
                          <span className="text-lg font-black font-mono text-[var(--fha-text)]">
                            {p.price === 0 ? '0đ' : formatCurrency(p.price)}
                          </span>
                          {p.originalPrice && (
                            <span className="text-xs line-through text-[var(--fha-text-faint)] font-mono">
                              {formatCurrency(p.originalPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Step 2: Choose Payment Method */}
                <div className="pt-6 border-t border-[var(--fha-border)] space-y-4">
                  <h2 className="text-lg font-bold text-[var(--fha-text)]">
                    2. Phương Thức Thanh Toán Tự Động
                  </h2>

                  {isTrial ? (
                    <div className="p-4 bg-[var(--fha-surface-2)] rounded-fha border border-[var(--fha-border)] space-y-3">
                      <div className="text-xs text-[var(--fha-text-muted)]">
                        Gói 3 Ngày Dùng Thử miễn phí 100% (0đ). Không yêu cầu thẻ ngân hàng.
                      </div>
                      <Button 
                        onClick={handleWalletOrTrialCheckout} 
                        loading={loading}
                        size="lg"
                        variant="primary"
                        fullWidth
                        className="font-bold text-sm"
                      >
                        Kích Hoạt Dùng Thử Miễn Phí (0đ) Ngay
                      </Button>
                    </div>
                  ) : hasEnoughBalance ? (
                    <div className="space-y-3">
                      <div className="p-4 bg-[var(--fha-success-bg)] border border-[var(--fha-success-border)] rounded-fha flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--fha-success)]">Số dư ví của bạn đủ để thanh toán:</span>
                        <span className="font-bold font-mono text-[var(--fha-text)] text-sm">{formatCurrency(userBalance || 0)}</span>
                      </div>
                      <Button 
                        onClick={handleWalletOrTrialCheckout} 
                        loading={loading}
                        size="lg"
                        variant="primary"
                        fullWidth
                        className="font-bold text-sm"
                      >
                        Thanh Toán Bằng Số Dư Ví ({formatCurrency(plan.price)})
                      </Button>
                      <Button 
                        onClick={handlePayOSCheckout} 
                        loading={loading}
                        size="md"
                        variant="outline"
                        fullWidth
                        className="text-xs bg-white"
                      >
                        Hoặc Quét Mã VietQR Trực Tiếp Qua PayOS
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Button 
                        onClick={handlePayOSCheckout} 
                        loading={loading}
                        size="lg"
                        variant="primary"
                        fullWidth
                        className="font-bold text-sm flex items-center justify-center gap-2 shadow-fha-sm"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        <span>Tạo Mã VietQR Thanh Toán Tự Động (PayOS)</span>
                      </Button>
                      <div className="text-[11px] text-center text-[var(--fha-text-muted)]">
                        Hệ thống tự động kích hoạt Key trong 5 giây sau khi ngân hàng trừ tiền
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PayOS QR Payment State */}
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

                <div className="text-center pt-2">
                  <Button variant="ghost" size="sm" onClick={handleCancelPayment} className="text-xs text-[var(--fha-text-muted)]">
                    &larr; Chọn lại gói cước khác
                  </Button>
                </div>
              </div>
            )}

            {/* Success State */}
            {paymentStep === 'success' && (
              <div className="bg-white rounded-fha-lg p-7 sm:p-8 shadow-fha-sm border border-[var(--fha-border)] space-y-6 animate-fade-in">
                <div className="w-14 h-14 rounded-full bg-[var(--fha-success-bg)] border border-[var(--fha-success-border)] text-[var(--fha-success)] flex items-center justify-center mx-auto">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <div className="text-center">
                  <h2 className="text-2xl font-black text-[var(--fha-text)] tracking-tight">Kích Hoạt Thành Công!</h2>
                  <p className="text-xs text-[var(--fha-text-muted)] mt-1">
                    Đơn hàng đã được duyệt tự động. Mã License Key của bạn đã sẵn sàng.
                  </p>
                </div>

                {createdKey && (
                  <div className="bg-[var(--fha-surface-2)] p-4 rounded-fha border border-[var(--fha-border)] space-y-2">
                    <CopyField label="Mã License Key của bạn" value={createdKey} />
                    <p className="text-[11px] text-[var(--fha-text-muted)] italic">
                      * Nhấp chuột để sao chép Key và dán vào tiện ích Chrome để liên kết thiết bị.
                    </p>
                  </div>
                )}

                <div className="space-y-2.5 pt-2">
                  <Link href="/dashboard/licenses" passHref className="block">
                    <Button variant="primary" fullWidth size="md" className="font-bold text-xs">
                      Xem Danh Sách License Của Tôi &rarr;
                    </Button>
                  </Link>
                  <Link href="/activate" passHref className="block">
                    <Button variant="outline" fullWidth size="md" className="text-xs bg-white">
                      Xem Hướng Dẫn Cài Đặt Vào Chrome
                    </Button>
                  </Link>
                </div>
              </div>
            )}

          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN (5 cols): Sticky Order Summary & Guarantees  */}
          {/* ======================================================== */}
          <div className="lg:col-span-5 sticky top-20 space-y-5">
            
            {/* Sticky Order Summary Card */}
            <div className="bg-white rounded-fha-lg border-2 border-[var(--fha-border-strong)] p-6 shadow-fha-sm space-y-5">
              <div className="border-b border-[var(--fha-border)] pb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fha-text-muted)]">
                  Tóm Tắt Đơn Hàng
                </span>
                <div className="flex items-center justify-between mt-1">
                  <h3 className="text-lg font-bold text-[var(--fha-text)]">{plan.name}</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[var(--fha-brand-soft)] text-[var(--fha-brand)]">
                    {plan.duration}
                  </span>
                </div>
              </div>

              {/* Line item breakdown */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-[var(--fha-text-muted)]">
                  <span>Giá cước niêm yết:</span>
                  <span className="font-mono text-[var(--fha-text)]">
                    {plan.originalPrice ? formatCurrency(plan.originalPrice) : formatCurrency(plan.price)}
                  </span>
                </div>

                {plan.originalPrice && (
                  <div className="flex justify-between items-center text-[var(--fha-success)] font-medium">
                    <span>Ưu đãi khuyến mại V2.0:</span>
                    <span className="font-mono">-{formatCurrency(plan.originalPrice - plan.price)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-[var(--fha-text-muted)]">
                  <span>Cổng thanh toán tự động PayOS:</span>
                  <span className="font-semibold text-[var(--fha-success)]">0đ (Miễn phí)</span>
                </div>

                <div className="flex justify-between items-center text-[var(--fha-text-muted)]">
                  <span>Giới hạn thiết bị:</span>
                  <span className="font-semibold text-[var(--fha-text)]">1 Thiết bị / 1 Key</span>
                </div>
              </div>

              {/* Total Row */}
              <div className="pt-4 border-t border-[var(--fha-border)] flex items-baseline justify-between">
                <div>
                  <span className="font-bold text-sm text-[var(--fha-text)] block">Tổng thanh toán:</span>
                  <span className="text-[10px] text-[var(--fha-text-muted)]">Đã bao gồm VAT & cấp Key</span>
                </div>
                <div className="text-2xl font-black font-mono text-[var(--fha-brand)]">
                  {plan.price === 0 ? '0đ' : formatCurrency(plan.price)}
                </div>
              </div>

              {/* Quota Highlights */}
              <div className="p-3 bg-[var(--fha-surface-2)] rounded border border-[var(--fha-border)] text-xs space-y-1">
                <div className="font-semibold text-[var(--fha-text)]">Quyền lợi hạn mức:</div>
                <div className="text-[var(--fha-text-muted)] text-[11px]">
                  {plan.scanLimit} • Tự động hồi phục hạn mức lúc 00:00 VN mỗi ngày.
                </div>
              </div>
            </div>

            {/* Trust Badges Card */}
            <div className="bg-white rounded-fha-lg border border-[var(--fha-border)] p-5 shadow-fha-sm space-y-3.5 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[var(--fha-success-bg)] text-[var(--fha-success)] flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="text-[var(--fha-text)]">
                  <strong>100% Tự Động:</strong> Không cần gửi ảnh chuyển khoản
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[var(--fha-success-bg)] text-[var(--fha-success)] flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="text-[var(--fha-text)]">
                  <strong>Bảo Hành 1 Đổi 1:</strong> Hỗ trợ kỹ thuật Zalo 24/7
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--fha-border)] text-center">
                <a 
                  href="https://zalo.me/0378791667" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="font-bold text-[var(--fha-brand)] hover:underline inline-flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4 text-[#0068ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Cần tư vấn trước khi mua? Chat Zalo</span>
                </a>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--fha-surface-2)]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--fha-brand)] border-t-transparent animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
