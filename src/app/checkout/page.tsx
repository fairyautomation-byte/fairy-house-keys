'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
                  className={`cursor-pointer rounded-2xl p-5 border transition-all flex flex-col relative overflow-hidden ${selectedPlanId === id ? 'bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-[1.02]' : 'bg-slate-950/50 border-slate-700/80 hover:border-slate-500'}`}
                >
                  {selectedPlanId === id && <div className="absolute top-0 right-0 bg-cyan-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg z-10">ĐANG CHỌN</div>}
                  <h3 className="text-lg font-bold text-slate-200 mb-1">{p.name}</h3>
                  <p className={`font-black text-2xl mb-4 pb-4 border-b border-slate-800/80 ${selectedPlanId === id ? 'text-cyan-400' : 'text-slate-400'}`}>
                    {p.price === 0 ? 'Miễn phí' : `${p.price.toLocaleString('vi-VN')}đ`}
                  </p>
                  <ul className="space-y-2 mt-auto">
                    {p.features.map((f, i) => (
                      <li key={i} className="text-[13px] text-slate-400 flex items-start gap-2">
                        <span className={`font-bold mt-0.5 ${selectedPlanId === id ? 'text-cyan-400' : 'text-slate-600'}`}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
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
              className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all disabled:opacity-50 text-lg mb-4"
            >
              {loading ? 'Đang xử lý...' : (isTrial ? 'Kích hoạt ngay' : 'Tiến hành thanh toán')}
            </button>

            <button
              onClick={() => router.push('/')}
              className="w-full py-3.5 rounded-xl bg-transparent border border-slate-700 text-slate-400 font-medium hover:bg-slate-800 hover:text-white transition-all text-sm flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Để tôi suy nghĩ thêm, về Trang Chủ
            </button>
          </div>
        ) : (
          <div className="bg-slate-900/80 backdrop-blur-3xl p-1 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-700/50 overflow-hidden max-w-4xl mx-auto w-full animate-fade-in">
            {/* Header / Banner */}
            <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-violet-600 p-6 text-center rounded-t-3xl border-b border-slate-700/50">
              <h2 className="text-2xl font-extrabold text-white mb-1 uppercase tracking-wide drop-shadow-md">Thông tin thanh toán</h2>
              <p className="text-cyan-100/90 text-sm font-medium">Fairy House Auto Data</p>
            </div>
            
            <div className="p-6 md:p-10 bg-slate-900 grid grid-cols-1 md:grid-cols-2 gap-10 rounded-b-3xl relative">
              
              {/* Left: QR Code */}
              <div className="flex flex-col items-center justify-center bg-slate-950/60 rounded-3xl p-8 border border-slate-800/80 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="p-4 bg-white rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.15)] relative mb-6 transition-transform duration-300 group-hover:scale-[1.02]">
                  <img 
                    src={`https://img.vietqr.io/image/970422-0378791667-compact2.png?amount=${orderInfo?.amount}&addInfo=${orderInfo?.transactionCode}&accountName=Nguyen%20Minh%20Tri`} 
                    alt="VietQR" 
                    className="w-56 h-56 object-contain"
                  />
                  {/* Decorative corners */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-cyan-500 rounded-tl-xl"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-cyan-500 rounded-tr-xl"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-cyan-500 rounded-bl-xl"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-cyan-500 rounded-br-xl"></div>
                </div>
                <h3 className="text-cyan-400 font-bold uppercase tracking-widest text-sm mb-2">Quét mã QR</h3>
                <p className="text-center text-xs text-slate-400 leading-relaxed">
                  Sử dụng ứng dụng ngân hàng để quét.<br/>Vui lòng kiểm tra đúng người nhận trước khi thanh toán.
                </p>
              </div>

              {/* Right: Bank Details */}
              <div className="flex flex-col justify-center space-y-6">
                
                {/* Plan Info */}
                <div className="flex justify-between items-center bg-slate-800/60 p-5 rounded-2xl border border-slate-700/80 shadow-inner">
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-semibold">Gói đang chọn</div>
                    <div className="text-lg font-bold text-white">{plan.name}</div>
                  </div>
                  <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                    {orderInfo?.amount.toLocaleString('vi-VN')}đ
                  </div>
                </div>

                {/* Details List */}
                <div className="space-y-1">
                  
                  <div className="flex justify-between items-center py-3 border-b border-slate-800/60 group">
                    <span className="text-sm text-slate-400 font-medium">Ngân hàng</span>
                    <span className="font-bold text-slate-200">MB Bank</span>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-slate-800/60 group">
                    <span className="text-sm text-slate-400 font-medium">Tên người nhận</span>
                    <span className="font-bold text-slate-200 uppercase">Nguyễn Minh Trí</span>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-slate-800/60 group">
                    <span className="text-sm text-slate-400 font-medium">Số tài khoản</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-rose-400 tracking-wider text-base">0378791667</span>
                      <button onClick={() => copyToClipboard('0378791667')} className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-colors border border-slate-700 font-medium">Sao chép</button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-slate-800/60 group">
                    <span className="text-sm text-slate-400 font-medium">Số tiền</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-emerald-400 tracking-wider text-base">{orderInfo?.amount.toLocaleString('vi-VN')}</span>
                      <button onClick={() => copyToClipboard(orderInfo?.amount.toString() || '')} className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-colors border border-slate-700 font-medium">Sao chép</button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-slate-800/60 group">
                    <span className="text-sm text-slate-400 font-medium">Nội dung CK</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-yellow-400 tracking-wider bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 text-base">{orderInfo?.transactionCode}</span>
                      <button onClick={() => copyToClipboard(orderInfo?.transactionCode || '')} className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-colors border border-slate-700 font-medium">Sao chép</button>
                    </div>
                  </div>

                </div>

                {/* Warning / Note */}
                <div className="bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/30 rounded-2xl p-4 text-sm text-amber-200/90 leading-relaxed">
                  <strong className="text-amber-400 block mb-1.5 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Lưu ý quan trọng
                  </strong>
                  Vui lòng nhập chính xác <strong>Nội dung CK</strong> ở trên. Sau khi chuyển khoản thành công, hãy chụp lại biên lai và gửi qua Zalo để được duyệt và kích hoạt tài khoản nhanh nhất.
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <a 
                    href="https://zalo.me/0378791667" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)]"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M21.144 10.457c0-4.63-4.225-8.457-9.457-8.457-5.232 0-9.457 3.827-9.457 8.457 0 4.629 4.225 8.457 9.457 8.457 1.157 0 2.257-.184 3.284-.523l3.655 2.115c.348.201.769-.074.721-.476l-.422-3.159c1.65-1.579 2.676-3.834 2.676-6.414z"/></svg>
                    Gửi biên lai Zalo
                  </a>
                  <button onClick={() => router.push('/dashboard')} className="flex items-center justify-center px-4 py-3.5 rounded-full bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 hover:text-white transition-all border border-slate-600">
                    Trở về Trang Quản Lý
                  </button>
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
