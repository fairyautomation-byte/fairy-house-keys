'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import { Plan } from '@/components/features/PlanCard';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import Alert from '@/components/ui/Alert';
import { useToast } from '@/components/ui/ToastProvider';
import { formatCurrency } from '@/lib/format';

export default function StorePage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    Promise.all([
      fetch('/api/plans').then(res => res.json()),
      fetch('/api/user/dashboard').then(res => res.json())
    ])
    .then(([plansData, userData]) => {
      setPlans(Array.isArray(plansData) ? plansData : []);
      setWalletBalance(userData.user?.wallet_balance || 0);
      setLoading(false);
    })
    .catch(() => {
      setLoading(false);
    });
  }, []);

  const handleSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowConfirmModal(true);
  };

  const handlePurchase = async () => {
    if (!selectedPlan) return;
    
    if (walletBalance < selectedPlan.price) {
      error('Số dư không đủ. Vui lòng nạp thêm tiền vào ví!');
      return;
    }

    setPurchasing(true);
    
    try {
      const res = await fetch('/api/orders/pay-with-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan.id })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi thanh toán');
      }

      setShowConfirmModal(false);
      success(`Đã mua thành công! Key đã được tạo và lưu vào mục License Của Tôi.`);
      setWalletBalance(data.newBalance);
    } catch (err: any) {
      error(err.message || 'Lỗi kết nối tới máy chủ.');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-16 w-full rounded-fha-lg" />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[420px] w-full rounded-fha-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Cửa Hàng License Bản Quyền" 
        description="Lựa chọn gói cước phù hợp với quy mô quét data và tiếp cận khách hàng của bạn"
        actions={
          <div className="flex items-center gap-3">
            <div className="text-xs px-3.5 py-2 bg-white border border-[var(--fha-border)] rounded-fha flex items-center gap-2 shadow-sm">
              <span className="text-[var(--fha-text-muted)] font-medium">Số dư khả dụng:</span>
              <span className="font-bold font-mono text-[var(--fha-brand)] text-sm">{formatCurrency(walletBalance)}</span>
            </div>
            <Link href="/dashboard/wallet" passHref>
              <Button variant="secondary" size="sm">
                + Nạp Ví PayOS
              </Button>
            </Link>
          </div>
        }
      />

      {/* Plan Matrix */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {plans.map((plan) => {
          const isPopular = plan.popular || plan.id === 'quarterly';
          const canAfford = walletBalance >= plan.price;

          return (
            <div
              key={plan.id}
              className={`rounded-fha-lg border-2 p-6 flex flex-col justify-between transition-all bg-white relative ${
                isPopular 
                  ? 'border-[var(--fha-brand)] shadow-fha-md scale-[1.02] z-10' 
                  : 'border-[var(--fha-border)] hover:border-[var(--fha-border-strong)] shadow-fha-sm'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[var(--fha-brand)] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
                  Khuyên Dùng
                </div>
              )}

              <div>
                <div className="mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fha-text-muted)]">
                    {plan.id === 'trial' ? 'Khám Phá' : plan.id === 'monthly' ? 'Chuẩn' : plan.id === 'quarterly' ? 'Tiết Kiệm 40%' : 'Doanh Nghiệp'}
                  </span>
                  <h3 className="text-xl font-bold text-[var(--fha-text)] mt-1">
                    {plan.name}
                  </h3>
                </div>

                <div className="mb-6 pb-5 border-b border-[var(--fha-border)]">
                  <div className="text-3xl font-black font-mono text-[var(--fha-text)] tracking-tight">
                    {plan.price === 0 ? '0đ' : formatCurrency(plan.price)}
                  </div>
                  <div className="text-xs font-semibold text-[var(--fha-brand)] mt-1">
                    {plan.duration} • {plan.scanLimit}
                  </div>
                </div>

                <div className="space-y-2.5 mb-8">
                  <div className="text-[10px] font-bold uppercase text-[var(--fha-text-faint)] tracking-wider">
                    Quyền lợi gói:
                  </div>
                  {plan.features?.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2 text-xs text-[var(--fha-text)]">
                      <svg className="w-3.5 h-3.5 text-[var(--fha-brand)] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-[var(--fha-border)]">
                {canAfford ? (
                  <Button 
                    variant={isPopular ? 'primary' : 'outline'} 
                    fullWidth 
                    size="md"
                    onClick={() => handleSelect(plan)}
                    className="font-bold text-xs"
                  >
                    Mua Ngay Bằng Ví
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button 
                      variant="primary" 
                      fullWidth 
                      size="md"
                      onClick={() => window.location.href = `/checkout?plan=${plan.id}`}
                      className="font-bold text-xs"
                    >
                      Quét QR PayOS Mua Ngay
                    </Button>
                    <div className="text-[10px] text-center text-[var(--fha-text-muted)]">
                      Thiếu {formatCurrency(plan.price - walletBalance)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      <Modal
        open={showConfirmModal}
        onClose={() => !purchasing && setShowConfirmModal(false)}
        title="Xác Nhận Kích Hoạt Key Bản Quyền"
      >
        {selectedPlan && (
          <div className="space-y-5">
            <div className="bg-[var(--fha-surface-2)] border border-[var(--fha-border)] p-4 rounded-fha space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2.5 border-b border-[var(--fha-border)]">
                <span className="text-[var(--fha-text-muted)] font-medium">Gói cước đã chọn</span>
                <span className="font-bold text-sm text-[var(--fha-text)]">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-[var(--fha-border)]">
                <span className="text-[var(--fha-text-muted)] font-medium">Đơn giá thanh toán</span>
                <span className="font-bold font-mono text-[var(--fha-brand)] text-base">{formatCurrency(selectedPlan.price)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--fha-text-muted)] font-medium">Số dư ví hiện tại</span>
                <span className={`font-bold font-mono text-sm ${walletBalance < selectedPlan.price ? 'text-[var(--fha-error)]' : 'text-[var(--fha-success)]'}`}>
                  {formatCurrency(walletBalance)}
                </span>
              </div>
            </div>

            {walletBalance < selectedPlan.price ? (
              <Alert variant="danger">
                Số dư ví không đủ. Vui lòng nạp thêm <strong className="font-mono ml-1">{formatCurrency(selectedPlan.price - walletBalance)}</strong>
              </Alert>
            ) : (
              <div className="text-xs text-[var(--fha-text-muted)] leading-relaxed">
                Số tiền <strong>{formatCurrency(selectedPlan.price)}</strong> sẽ được trừ trực tiếp vào số dư ví của bạn. Key bản quyền sẽ được tạo tức thì.
              </div>
            )}

            <div className="flex gap-2.5 justify-end pt-3 border-t border-[var(--fha-border)]">
              <Button variant="ghost" onClick={() => setShowConfirmModal(false)} disabled={purchasing} size="sm">
                Đóng
              </Button>
              {walletBalance >= selectedPlan.price ? (
                <Button variant="primary" onClick={handlePurchase} loading={purchasing} size="sm" className="font-bold">
                  Xác Nhận Mua
                </Button>
              ) : (
                <Button variant="primary" onClick={() => window.location.href = `/checkout?plan=${selectedPlan.id}`} size="sm">
                  Thanh Toán Qua PayOS &rarr;
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
