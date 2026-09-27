'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UserDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user/dashboard')
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then(setData)
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  if (!data) return null;

  const { user, license, orders } = data;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Đã copy License Key!');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-bold text-lg text-slate-900">Dashboard</div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 font-medium">{user.full_name}</span>
            <button onClick={() => {
              fetch('/api/auth/login', { method: 'DELETE' }).then(() => router.push('/login'));
            }} className="text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Active License */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">License hiện tại</h2>
          {license ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  {license.status}
                </span>
              </div>
              
              <div className="mb-8">
                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">License Key</h3>
                <div className="flex items-center gap-3">
                  <code className="text-2xl font-bold text-slate-900 bg-slate-100 px-4 py-2 rounded-xl tracking-widest">{license.license_key}</code>
                  <button onClick={() => handleCopy(license.license_key)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-4 rounded-2xl bg-slate-50">
                  <div className="text-sm text-slate-500 mb-1">Gói dịch vụ</div>
                  <div className="font-bold text-lg text-slate-900 uppercase">{license.plan_id}</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50">
                  <div className="text-sm text-slate-500 mb-1">Ngày hết hạn</div>
                  <div className="font-bold text-lg text-slate-900">
                    {license.expires_at ? new Date(license.expires_at._seconds * 1000).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50">
                  <div className="text-sm text-slate-500 mb-1">Tổng lượt scan</div>
                  <div className="font-bold text-lg text-slate-900">{license.total_scans.toLocaleString()}</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-8 p-6 rounded-2xl border border-slate-100 bg-white">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <div className="text-sm font-medium text-slate-500 mb-1">Hạn mức hôm nay</div>
                    <div className="font-bold text-xl text-slate-900">
                      <span className="text-blue-600">{license.daily_used}</span>
                      <span className="text-slate-400 mx-1">/</span>
                      {license.daily_limit === -1 || license.daily_limit === null ? '∞' : license.daily_limit}
                    </div>
                  </div>
                  {license.daily_limit !== -1 && license.daily_limit !== null && (
                    <div className="text-sm font-semibold text-slate-500">
                      Còn lại: {license.daily_limit - license.daily_used}
                    </div>
                  )}
                </div>
                {license.daily_limit !== -1 && license.daily_limit !== null && (
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${license.daily_used / license.daily_limit > 0.9 ? 'bg-red-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(100, (license.daily_used / license.daily_limit) * 100)}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
              <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Bạn chưa có License nào</h3>
              <p className="text-slate-500 mb-6">Đăng ký một gói dịch vụ để bắt đầu sử dụng extension.</p>
              <button onClick={() => router.push('/#pricing')} className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors">
                Xem bảng giá
              </button>
            </div>
          )}
        </section>

        {/* Lịch sử giao dịch */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Lịch sử đơn hàng</h2>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">Mã Giao Dịch</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">Gói</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">Số Tiền</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Chưa có giao dịch nào</td>
                  </tr>
                ) : (
                  orders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm">{order.transaction_code}</td>
                      <td className="px-6 py-4 font-medium uppercase text-sm">{order.plan_id}</td>
                      <td className="px-6 py-4 font-medium">{order.amount.toLocaleString('vi-VN')}đ</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'PAID' ? 'bg-green-100 text-green-800' : 
                          order.status === 'PENDING_PAYMENT_REVIEW' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  );
}
