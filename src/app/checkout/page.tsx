'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';

const PLAN_PRICES: Record<string, {name: string, price: number, features: string[]}> = {
  trial: { name: '3 Ngày Dùng Thử', price: 0, features: ['100 lượt scan/ngày', 'Dùng 1 lần duy nhất'] },
  monthly: { name: '1 Tháng', price: 69000, features: ['1.000 lượt scan/ngày', 'Nâng cấp linh hoạt'] },
  quarterly: { name: '3 Tháng', price: 179000, features: ['3.000 lượt scan/ngày', 'Tiết kiệm chi phí'] },
  yearly: { name: '1 Năm', price: 479000, features: ['Không giới hạn scan', 'Hỗ trợ ưu tiên 24/7'] },
};

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get('plan') || 'monthly';
  
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlan);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successState, setSuccessState] = useState(false);
  const [orderInfo, setOrderInfo] = useState<{transactionCode: string, amount: number} | null>(null);
  
  const { success } = useToast();

  // Fallback if invalid initial plan
  useEffect(() => {
    if (!PLAN_PRICES[selectedPlanId]) setSelectedPlanId('monthly');
  }, [selectedPlanId]);

  const plan = PLAN_PRICES[selectedPlanId] || PLAN_PRICES['monthly'];
  const isTrial = selectedPlanId === 'trial';

  const handleCheckout = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/orders/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlanId })
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (data.error === 'TRIAL_ALREADY_USED') {
          throw new Error('Bạn đã sử dụng gói Trial trước đó. Mỗi người chỉ được dùng 1 lần.');
        }
        throw new Error(data.error || 'Lỗi hệ thống');
      }

      if (isTrial) {
        router.push('/dashboard');
      } else {
        setOrderInfo({
          transactionCode: data.transactionCode,
          amount: data.amount
        });
        setSuccessState(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    success('Đã copy: ' + text);
  };

  return (
    <div className="min-h-screen bg-[var(--fha-surface-2)] flex py-12 px-4 sm:px-6 relative overflow-hidden font-sans">
      <div className="max-w-[800px] w-full mx-auto space-y-8 relative z-10">
        
        <div className="text-center mb-8 flex flex-col items-center">
          <Link href="/" className="mb-4 inline-flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)] rounded p-1">
            <Image src="/logo.png" alt="Fairy House" width={40} height={40} className="rounded shrink-0" />
            <span className="font-bold text-base tracking-tight text-[var(--fha-text)]">
              Fairy House <span className="text-[var(--fha-brand)]">AutoData</span>
            </span>
          </Link>
          <h1 className="text-[32px] font-black text-[var(--fha-text)] tracking-tight">Thanh toán</h1>
          <p className="mt-2 text-[var(--fha-text-muted)]">Chọn gói dịch vụ phù hợp với nhu cầu của bạn</p>
        </div>

        {error && (
          <Alert type="danger" message={error} />
        )}

        {!successState ? (
          <div className="bg-white p-8 sm:p-10 rounded-fha-lg shadow-sm border border-[var(--fha-border)]">
            <h2 className="text-[20px] font-bold mb-6 border-b border-[var(--fha-border)] pb-4 text-[var(--fha-text)]">Chọn Gói Đăng Ký</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {Object.entries(PLAN_PRICES).map(([id, p]) => (
                <div 
                  key={id}
                  onClick={() => setSelectedPlanId(id)}
                  className={`cursor-pointer rounded-fha p-5 border transition-all flex flex-col relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fha-brand)] ${selectedPlanId === id ? 'bg-[var(--fha-brand-soft)] border-[var(--fha-brand)] shadow-sm' : 'bg-white border-[var(--fha-border-strong)] hover:border-[var(--fha-text-muted)]'}`}
                  tabIndex={0}
                  onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') setSelectedPlanId(id); }}
                >
                  {selectedPlanId === id && <div className="absolute top-0 right-0 bg-[var(--fha-brand)] text-white text-[10px] font-bold px-2 py-1 rounded-bl">ĐANG CHỌN</div>}
                  <h3 className="text-[15px] font-bold text-[var(--fha-text)] mb-1">{p.name}</h3>
                  <p className={`font-black text-[22px] mb-4 pb-4 border-b ${selectedPlanId === id ? 'text-[var(--fha-brand)] border-[var(--fha-brand)]/20' : 'text-[var(--fha-text)] border-[var(--fha-border)]'}`}>
                    {p.price === 0 ? 'Miễn phí' : `${p.price.toLocaleString('vi-VN')}đ`}
                  </p>
                  <ul className="space-y-2 mt-auto">
                    {p.features.map((f, i) => (
                      <li key={i} className="text-[13px] text-[var(--fha-text-muted)] flex items-start gap-2">
                        <span className={`font-bold mt-0.5 ${selectedPlanId === id ? 'text-[var(--fha-brand)]' : 'text-[var(--fha-text-muted)]'}`}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center mb-8 pb-8 border-b border-[var(--fha-border)]">
              <span className="text-[var(--fha-text-muted)] text-[16px] font-medium">Tổng tiền thanh toán:</span>
              <span className="font-black text-[28px] text-[var(--fha-text)]">
                {plan.price === 0 ? 'Miễn phí' : `${plan.price.toLocaleString('vi-VN')}đ`}
              </span>
            </div>

            <Button 
              onClick={handleCheckout} 
              loading={loading}
              size="lg"
              variant="primary"
              fullWidth
              className="mb-4 h-[52px] text-[16px]"
            >
              {isTrial ? 'Kích hoạt dùng thử ngay' : 'Tiến hành thanh toán'}
            </Button>

            <Button
              onClick={() => router.push('/')}
              variant="ghost"
              fullWidth
              className="text-[var(--fha-text-muted)]"
            >
              <svg className="w-[18px] h-[18px] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Trở về Trang Chủ
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-fha-lg shadow-sm border border-[var(--fha-border)] overflow-hidden max-w-[800px] mx-auto w-full animate-fade-in">
            {/* Header / Banner */}
            <div className="bg-[var(--fha-surface-2)] p-6 text-center border-b border-[var(--fha-border)]">
              <h2 className="text-[20px] font-black text-[var(--fha-text)] uppercase tracking-wide">Thông tin chuyển khoản</h2>
              <p className="text-[var(--fha-text-muted)] text-[13px] font-medium mt-1">Fairy House Auto Data</p>
            </div>
            
            <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-10 relative">
              
              {/* Left: QR Code */}
              <div className="flex flex-col items-center justify-center bg-[var(--fha-surface-2)] rounded-fha-lg p-8 border border-[var(--fha-border-strong)] relative overflow-hidden">
                <div className="p-4 bg-white rounded-fha border border-[var(--fha-border-strong)] relative mb-6">
                  <img 
                    src={`https://img.vietqr.io/image/970422-0378791667-compact2.png?amount=${orderInfo?.amount}&addInfo=${orderInfo?.transactionCode}&accountName=Nguyen%20Minh%20Tri`} 
                    alt="VietQR" 
                    className="w-56 h-56 object-contain"
                  />
                </div>
                <h3 className="text-[var(--fha-text)] font-bold uppercase tracking-widest text-[13px] mb-2">Quét mã QR</h3>
                <p className="text-center text-[12px] text-[var(--fha-text-muted)] leading-relaxed font-medium">
                  Sử dụng ứng dụng ngân hàng để quét.<br/>Kiểm tra đúng số tiền và nội dung trước khi thanh toán.
                </p>
              </div>

              {/* Right: Bank Details */}
              <div className="flex flex-col justify-center space-y-6">
                
                {/* Plan Info */}
                <div className="flex justify-between items-center bg-[var(--fha-brand-soft)] p-5 rounded-fha border border-[var(--fha-brand)]/20">
                  <div>
                    <div className="text-[11px] text-[var(--fha-brand)] uppercase tracking-wider mb-1 font-bold">Gói đang chọn</div>
                    <div className="text-[16px] font-bold text-[var(--fha-text)]">{plan.name}</div>
                  </div>
                  <div className="text-[22px] font-black text-[var(--fha-brand)]">
                    {orderInfo?.amount.toLocaleString('vi-VN')}đ
                  </div>
                </div>

                {/* Details List */}
                <div className="space-y-1">
                  
                  <div className="flex justify-between items-center py-3 border-b border-[var(--fha-border)]">
                    <span className="text-[14px] text-[var(--fha-text-muted)] font-medium">Ngân hàng</span>
                    <span className="font-bold text-[var(--fha-text)]">MB Bank</span>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-[var(--fha-border)]">
                    <span className="text-[14px] text-[var(--fha-text-muted)] font-medium">Người nhận</span>
                    <span className="font-bold text-[var(--fha-text)] uppercase">Nguyễn Minh Trí</span>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-[var(--fha-border)]">
                    <span className="text-[14px] text-[var(--fha-text-muted)] font-medium">Số tài khoản</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[var(--fha-text)] tracking-wider text-[15px] font-mono">0378791667</span>
                      <button onClick={() => copyToClipboard('0378791667')} className="text-[12px] px-3 py-1.5 rounded bg-white text-[var(--fha-text)] border border-[var(--fha-border-strong)] hover:border-[var(--fha-brand)] hover:text-[var(--fha-brand)] font-semibold transition-colors">Copy</button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-[var(--fha-border)]">
                    <span className="text-[14px] text-[var(--fha-text-muted)] font-medium">Số tiền</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[var(--fha-text)] tracking-wider text-[15px] font-mono">{orderInfo?.amount.toLocaleString('vi-VN')}</span>
                      <button onClick={() => copyToClipboard(orderInfo?.amount.toString() || '')} className="text-[12px] px-3 py-1.5 rounded bg-white text-[var(--fha-text)] border border-[var(--fha-border-strong)] hover:border-[var(--fha-brand)] hover:text-[var(--fha-brand)] font-semibold transition-colors">Copy</button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-[var(--fha-border)]">
                    <span className="text-[14px] text-[var(--fha-text-muted)] font-medium">Nội dung CK</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[var(--fha-brand)] tracking-wider text-[15px] font-mono">{orderInfo?.transactionCode}</span>
                      <button onClick={() => copyToClipboard(orderInfo?.transactionCode || '')} className="text-[12px] px-3 py-1.5 rounded bg-white text-[var(--fha-text)] border border-[var(--fha-border-strong)] hover:border-[var(--fha-brand)] hover:text-[var(--fha-brand)] font-semibold transition-colors">Copy</button>
                    </div>
                  </div>

                </div>

                {/* Warning / Note */}
                <Alert 
                  type="warning"
                  title="Lưu ý quan trọng"
                  message="Vui lòng nhập chính xác Nội dung CK ở trên. Sau khi chuyển khoản thành công, chụp biên lai gửi qua Zalo để được kích hoạt nhanh nhất."
                />

                {/* Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <a 
                    href="https://zalo.me/0378791667" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-fha bg-[#0068ff] hover:bg-[#0055d4] text-white font-bold transition-colors shadow-sm text-[14px]"
                  >
                    Gửi biên lai Zalo
                  </a>
                  <Button onClick={() => router.push('/dashboard')} variant="secondary" className="w-full h-full text-[14px]">
                    Về Trang Quản Lý
                  </Button>
                </div>

              </div>
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
