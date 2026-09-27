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
  const planId = searchParams.get('plan');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [orderInfo, setOrderInfo] = useState<{transactionCode: string, amount: number} | null>(null);

  if (!planId || !PLAN_PRICES[planId]) {
    return <div className="p-8 text-center">Gói không hợp lệ. <a href="/">Quay lại trang chủ</a></div>;
  }

  const plan = PLAN_PRICES[planId];
  const isTrial = planId === 'trial';

  const handleCheckout = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/orders/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (data.error === 'TRIAL_ALREADY_USED') {
          throw new Error('Bạn đã sử dụng gói Trial trước đó. Mỗi người chỉ được dùng 1 lần.');
        }
        throw new Error(data.error || 'Lỗi hệ thống');
      }

      if (isTrial) {
        // Redirect to dashboard immediately for trial
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
    <div className="min-h-screen bg-slate-50 flex py-12 px-4 sm:px-6">
      <div className="max-w-3xl w-full mx-auto space-y-8">
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">Thanh toán</h1>
          <p className="mt-2 text-slate-500">Hoàn tất đăng ký gói {plan.name}</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-center font-medium">
            {error}
          </div>
        )}

        {!success ? (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold mb-6 border-b pb-4">Xác nhận thông tin</h2>
            
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-600">Gói đăng ký:</span>
              <span className="font-bold text-lg text-slate-900">{plan.name}</span>
            </div>
            
            <div className="flex justify-between items-center mb-8 pb-8 border-b">
              <span className="text-slate-600">Tổng tiền:</span>
              <span className="font-bold text-2xl text-blue-600">
                {plan.price === 0 ? 'Miễn phí' : `${plan.price.toLocaleString('vi-VN')}đ`}
              </span>
            </div>

            <button 
              onClick={handleCheckout} 
              disabled={loading}
              className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : (isTrial ? 'Kích hoạt ngay' : 'Tiến hành thanh toán')}
            </button>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-center mb-4 text-slate-900">Đơn hàng đã được tạo!</h2>
            <p className="text-center text-slate-600 mb-8">Vui lòng chuyển khoản đúng số tiền và nội dung bên dưới để hệ thống tự động kích hoạt.</p>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Ngân hàng:</span>
                <span className="font-semibold text-slate-900">MB Bank</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Chủ tài khoản:</span>
                <span className="font-semibold text-slate-900">Nguyễn Minh Trí</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Số tài khoản:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-blue-600">0378791667</span>
                  <button onClick={() => copyToClipboard('0378791667')} className="text-sm text-slate-400 hover:text-blue-600">Copy</button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Số tiền:</span>
                <span className="font-bold text-lg text-red-600">{orderInfo?.amount.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-slate-500">Nội dung CK:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg bg-yellow-100 text-yellow-800 px-3 py-1 rounded">{orderInfo?.transactionCode}</span>
                  <button onClick={() => copyToClipboard(orderInfo?.transactionCode || '')} className="text-sm text-slate-400 hover:text-blue-600">Copy</button>
                </div>
              </div>
            </div>

            <div className="flex justify-center mb-8">
              <div className="p-4 bg-white rounded-xl border-2 border-dashed border-blue-200">
                <img 
                  src={`https://img.vietqr.io/image/970422-0378791667-compact2.png?amount=${orderInfo?.amount}&addInfo=${orderInfo?.transactionCode}&accountName=Nguyen%20Minh%20Tri`} 
                  alt="VietQR" 
                  className="w-48 h-48 object-contain"
                />
                <p className="text-center text-xs font-semibold text-slate-500 mt-2">Quét mã để thanh toán nhanh</p>
              </div>
            </div>

            <div className="flex justify-center gap-4">
               <button onClick={() => router.push('/dashboard')} className="px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors">
                 Về trang quản lý
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
