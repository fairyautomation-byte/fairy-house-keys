'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const PLAN_PRICES: Record<string, {name: string, price: number}> = {
  trial: { name: '3 Ngày Dùng Thử', price: 0 },
  monthly: { name: '1 Tháng', price: 69000 },
  quarterly: { name: '3 Tháng', price: 179000 },
  yearly: { name: '1 Năm', price: 479000 },
};

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get('plan') || 'monthly';
  
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlan);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [orderInfo, setOrderInfo] = useState<{transactionCode: string, amount: number} | null>(null);

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
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Đã copy: ' + text);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex py-12 px-4 sm:px-6 relative overflow-hidden font-sans">
      {/* Background Aurora Orbs */}
      <div className="absolute top-[0%] left-[20%] w-[50%] h-[50%] rounded-full bg-violet-600/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[0%] right-[20%] w-[50%] h-[50%] rounded-full bg-cyan-600/20 blur-[120px] pointer-events-none"></div>

      <div className="max-w-4xl w-full mx-auto space-y-8 relative z-10">
        
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">Thanh toán</h1>
          <p className="mt-3 text-slate-400">Chọn gói dịch vụ phù hợp với nhu cầu của bạn</p>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20 text-center font-medium">
            {error}
          </div>
        )}

        {!success ? (
          <div className="bg-slate-900/60 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl border border-slate-700/50">
            <h2 className="text-xl font-bold mb-6 border-b border-slate-700/50 pb-4 text-white">Chọn Gói Đăng Ký</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {Object.entries(PLAN_PRICES).map(([id, p]) => (
                <div 
                  key={id}
                  onClick={() => setSelectedPlanId(id)}
                  className={`cursor-pointer rounded-2xl p-4 border transition-all ${selectedPlanId === id ? 'bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-slate-950/50 border-slate-700/80 hover:border-slate-500'}`}
                >
                  <h3 className="text-lg font-bold text-slate-200">{p.name}</h3>
                  <p className={`mt-2 font-black text-xl ${selectedPlanId === id ? 'text-cyan-400' : 'text-slate-400'}`}>
                    {p.price === 0 ? 'Miễn phí' : `${p.price.toLocaleString('vi-VN')}đ`}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center mb-8 pb-8 border-b border-slate-700/50">
              <span className="text-slate-400 text-lg">Tổng tiền thanh toán:</span>
              <span className="font-bold text-3xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                {plan.price === 0 ? 'Miễn phí' : `${plan.price.toLocaleString('vi-VN')}đ`}
              </span>
            </div>

            <button 
              onClick={handleCheckout} 
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all disabled:opacity-50 text-lg"
            >
              {loading ? 'Đang xử lý...' : (isTrial ? 'Kích hoạt ngay' : 'Tiến hành thanh toán')}
            </button>
          </div>
        ) : (
          <div className="bg-slate-900/60 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl border border-slate-700/50">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-3xl font-extrabold text-center mb-4 text-white">Đơn hàng đã được tạo!</h2>
            <p className="text-center text-slate-400 mb-8 text-lg">Vui lòng chuyển khoản đúng số tiền và nội dung bên dưới để hệ thống tự động kích hoạt.</p>

            <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-700/50 mb-8 space-y-5">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Ngân hàng:</span>
                <span className="font-semibold text-slate-200">MB Bank</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Chủ tài khoản:</span>
                <span className="font-semibold text-slate-200">Nguyễn Minh Trí</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Số tài khoản:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xl text-cyan-400">0378791667</span>
                  <button onClick={() => copyToClipboard('0378791667')} className="text-sm px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors">Copy</button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Số tiền:</span>
                <span className="font-bold text-xl text-rose-400">{orderInfo?.amount.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between items-center pt-5 border-t border-slate-700/50">
                <span className="text-slate-400">Nội dung CK:</span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-xl px-4 py-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 tracking-wider">{orderInfo?.transactionCode}</span>
                  <button onClick={() => copyToClipboard(orderInfo?.transactionCode || '')} className="text-sm px-3 py-2 rounded bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors">Copy</button>
                </div>
              </div>
            </div>

            <div className="flex justify-center mb-8">
              <div className="p-5 bg-white rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)] relative">
                <img 
                  src={`https://img.vietqr.io/image/970422-0378791667-compact2.png?amount=${orderInfo?.amount}&addInfo=${orderInfo?.transactionCode}&accountName=Nguyen%20Minh%20Tri`} 
                  alt="VietQR" 
                  className="w-56 h-56 object-contain"
                />
                <p className="text-center text-xs font-bold text-slate-800 mt-3 uppercase tracking-wider">Quét mã để thanh toán</p>
              </div>
            </div>

            <div className="flex justify-center gap-4">
               <button onClick={() => router.push('/dashboard')} className="px-8 py-4 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 hover:text-cyan-400 transition-colors border border-slate-600">
                 Trở về trang quản lý
               </button>
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
