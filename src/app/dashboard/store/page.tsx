'use client';
import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import PlanCard, { Plan } from '@/components/features/PlanCard';
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
      setPlans(Array.isArray(plansData) ? plansData : []); // Ensure array
      setWalletBalance(userData.user?.wallet_balance || 0);
      setLoading(false);
    })
    .catch(() => {
      setLoading(false);
    });
  }, []);

  const handleSelect = (id: string) => {
    const plan = plans.find(p => p.id === id);
    if (plan) {
      setSelectedPlan(plan);
      setShowConfirmModal(true);
    }
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
      success(`Đã mua thành công! Key đã được gửi vào email.`);
      setWalletBalance(data.newBalance); // Sync balance exactly as backend calculated
    } catch (err: any) {
      error(err.message || 'Lỗi kết nối tới máy chủ.');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-16 bg-white border border-[var(--fha-border)] rounded-fha-lg animate-pulse" />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[400px] w-full rounded-fha-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Cửa Hàng Key" 
        description="Mua license key để sử dụng dịch vụ trên thiết bị của bạn"
        actions={
          <div className="text-[14px] px-4 py-2.5 bg-white border border-[var(--fha-border)] rounded-fha flex items-center gap-2 shadow-sm">
            <span className="text-[var(--fha-text-muted)] font-medium">Số dư ví:</span>
            <span className="font-bold font-mono text-[var(--fha-brand)] tracking-tight">{formatCurrency(walletBalance)}</span>
          </div>
        }
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <PlanCard 
            key={plan.id}
            plan={plan}
            onSelect={handleSelect}
          />
        ))}
        {plans.length === 0 && (
          <div className="col-span-full py-12 text-center text-[var(--fha-text-muted)] font-medium text-sm border border-dashed border-[var(--fha-border-strong)] bg-[var(--fha-surface-2)] rounded-fha-lg">
            Hiện chưa có gói cước nào được cấu hình
          </div>
        )}
      </div>

      <Modal
        open={showConfirmModal}
        onClose={() => !purchasing && setShowConfirmModal(false)}
        title="Xác nhận thanh toán"
      >
        {selectedPlan && (
          <div className="space-y-6">
            <div className="bg-[var(--fha-surface-2)] border border-[var(--fha-border)] p-5 rounded-fha space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-[var(--fha-border-strong)]">
                <span className="text-[14px] font-medium text-[var(--fha-text-muted)]">Gói dịch vụ</span>
                <span className="font-bold text-[var(--fha-text)]">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-[var(--fha-border-strong)]">
                <span className="text-[14px] font-medium text-[var(--fha-text-muted)]">Giá tiền</span>
                <span className="font-bold font-mono text-[var(--fha-text)] text-lg">{formatCurrency(selectedPlan.price)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[14px] font-medium text-[var(--fha-text-muted)]">Số dư hiện tại</span>
                <span className={`font-bold font-mono text-lg ${walletBalance < selectedPlan.price ? 'text-[var(--fha-error)]' : 'text-[var(--fha-success)]'}`}>
                  {formatCurrency(walletBalance)}
                </span>
              </div>
            </div>

            {walletBalance < selectedPlan.price && (
              <Alert variant="danger">
                Số dư không đủ. Vui lòng nạp thêm <strong className="font-mono text-lg ml-1">{formatCurrency(selectedPlan.price - walletBalance)}</strong>
              </Alert>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" onClick={() => setShowConfirmModal(false)} disabled={purchasing}>
                Hủy
              </Button>
              {walletBalance >= selectedPlan.price ? (
                <Button variant="primary" onClick={handlePurchase} loading={purchasing}>
                  Thanh Toán
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => window.location.href='/dashboard/wallet'}>
                  Nạp Tiền Vào Ví
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
