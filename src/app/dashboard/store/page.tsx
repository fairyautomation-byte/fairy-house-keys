'use client';
import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import PlanCard, { Plan } from '@/components/features/PlanCard';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/ToastProvider';

export default function StorePage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const { toast } = useToast();

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
      toast.error('Số dư không đủ. Vui lòng nạp thêm tiền vào ví!');
      return;
    }

    setPurchasing(true);
    
    // Simulate API call for purchase via wallet
    setTimeout(() => {
      setPurchasing(false);
      setShowConfirmModal(false);
      toast.success(`Đã mua thành công gói ${selectedPlan.name}!`);
      setWalletBalance(prev => prev - selectedPlan.price);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-fha-surface-2 rounded-lg animate-pulse"></div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-96 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Cửa Hàng Key" 
        description="Mua license key để sử dụng dịch vụ"
        actions={
          <div className="text-sm px-4 py-2 bg-fha-surface border border-fha-border rounded-fha-radius flex items-center gap-2">
            <span className="text-fha-text-muted">Số dư ví:</span>
            <span className="font-bold font-mono text-fha-cyan">{walletBalance.toLocaleString('vi-VN')}đ</span>
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
          <div className="col-span-full py-12 text-center text-fha-text-muted border border-dashed border-fha-border rounded-lg">
            Hiện chưa có gói cước nào được cấu hình
          </div>
        )}
      </div>

      <Modal
        open={showConfirmModal}
        onClose={() => !purchasing && setShowConfirmModal(false)}
        title="Xác nhận mua hàng"
      >
        {selectedPlan && (
          <div className="space-y-6">
            <div className="bg-fha-surface border border-fha-border p-4 rounded-fha-radius-md space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-fha-border-muted">
                <span className="text-fha-text-muted">Gói dịch vụ</span>
                <span className="font-bold text-fha-text">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-fha-border-muted">
                <span className="text-fha-text-muted">Giá tiền</span>
                <span className="font-bold font-mono text-fha-text">{selectedPlan.price.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-fha-text-muted">Số dư hiện tại</span>
                <span className={`font-bold font-mono ${walletBalance < selectedPlan.price ? 'text-fha-error' : 'text-fha-success'}`}>
                  {walletBalance.toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>

            {walletBalance < selectedPlan.price && (
              <div className="p-3 bg-fha-error-bg/30 border border-fha-error-border rounded-fha-radius text-sm text-fha-error text-center">
                Số dư không đủ. Vui lòng nạp thêm {(selectedPlan.price - walletBalance).toLocaleString('vi-VN')}đ để tiếp tục.
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" onClick={() => setShowConfirmModal(false)} disabled={purchasing}>
                Hủy
              </Button>
              {walletBalance >= selectedPlan.price ? (
                <Button variant="primary" onClick={handlePurchase} loading={purchasing}>
                  Thanh Toán Bằng Ví
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
