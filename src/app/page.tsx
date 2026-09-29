import Link from 'next/link';
import { cookies } from 'next/headers';
import { USER_COOKIE_NAME } from '@/lib/auth';

export default function Home() {
  const cookieStore = cookies();
  const isLoggedIn = cookieStore.has(USER_COOKIE_NAME);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30 overflow-hidden relative">
      {/* Aurora Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-600/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none"></div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-900/60 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white font-black text-lg shadow-[0_0_15px_rgba(6,182,212,0.4)]">F</div>
            <span className="font-extrabold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">Fairy House</span>
          </div>
          <div className="flex gap-4">
            {isLoggedIn ? (
              <Link href="/dashboard" className="text-sm font-bold bg-gradient-to-r from-cyan-500 to-violet-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] text-white px-5 py-2.5 rounded-full transition-all flex items-center gap-2">
                Vào Dashboard
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-cyan-400 flex items-center transition-colors">
                  Đăng nhập
                </Link>
                <Link href="/register" className="text-sm font-bold bg-gradient-to-r from-cyan-500 to-violet-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] text-white px-5 py-2.5 rounded-full transition-all">
                  Đăng ký ngay
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-32">
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/50 text-cyan-400 text-sm font-bold mb-8 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            CHROME EXTENSION TỰ ĐỘNG HÓA
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-8 leading-tight drop-shadow-lg">
            Quét Data Khách Hàng <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500">
              Chính Xác & Tự Động 100%
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Fairy House Auto Data là giải pháp hoàn hảo giúp bạn tự động hóa việc quét thông tin khách hàng tiềm năng trên Facebook. Tiết kiệm 90% thời gian, tăng doanh thu mạnh mẽ.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link href="/register?plan=trial" className="px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:-translate-y-1 transition-all w-full sm:w-auto text-lg flex items-center justify-center gap-2">
              Dùng thử miễn phí
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </Link>
            <a href="#pricing" className="px-8 py-4 rounded-full bg-slate-800/80 text-white font-bold hover:bg-slate-700 hover:text-cyan-400 border border-slate-700 transition-all hover:shadow-lg w-full sm:w-auto text-lg">
              Xem bảng giá
            </a>
          </div>

          {/* Placeholder for Video/Dashboard Image */}
          <div className="mt-20 relative mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-slate-900/50 p-2 shadow-2xl backdrop-blur-sm overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10"></div>
             <div className="aspect-[16/9] bg-slate-950 rounded-xl flex items-center justify-center border border-slate-800/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
                <div className="text-center z-20">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700 group-hover:scale-110 transition-transform cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                    <svg className="w-6 h-6 text-cyan-400 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                  <p className="text-slate-500 font-medium">Video Demo Sản Phẩm (Sắp ra mắt)</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 relative z-10 border-t border-slate-800/50 bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Tính năng nổi bật</h2>
            <p className="text-lg text-slate-400">Công nghệ thông minh giúp bạn làm việc hiệu quả hơn.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { t: 'Quét Data Thông Minh', d: 'Thu thập thông tin khách hàng tiềm năng cực kỳ nhanh chóng và chính xác.', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
              { t: 'Tự Động Hóa Nhắn Tin', d: 'Gửi tin nhắn hàng loạt theo kịch bản cá nhân hóa, tối ưu tỷ lệ phản hồi.', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
              { t: 'Bảo Mật Cao Cấp', d: 'Hệ thống License Key cá nhân hóa, xác thực OTP chống hack tài khoản.', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
              { t: 'Quản Lý Quota Tự Động', d: 'Tự động tính toán số lượt quét mỗi ngày, reset vào 0h đúng chuẩn giờ VN.', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
              { t: 'Dashboard Trực Quan', d: 'Bảng điều khiển hiện đại giúp bạn theo dõi chi tiết lịch sử và gói dịch vụ.', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
              { t: 'Hỗ Trợ Nhanh Chóng', d: 'Đội ngũ Admin sẵn sàng duyệt đơn và giải đáp thắc mắc ngay qua Zalo.', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' }
            ].map((f, i) => (
              <div key={i} className="p-8 rounded-3xl bg-slate-900/60 backdrop-blur-md border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all duration-300 group">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-cyan-400 mb-6 border border-slate-700 group-hover:bg-cyan-500/20 group-hover:border-cyan-500/50 transition-colors">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} /></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-100 mb-3">{f.t}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 relative z-10 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">4 Bước Bắt Đầu</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8 text-center relative">
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-[2px] bg-gradient-to-r from-slate-800 via-cyan-500/50 to-slate-800 z-0"></div>
            {[
              { s: '01', t: 'Đăng Ký Tài Khoản', d: 'Tạo tài khoản và xác thực email siêu tốc.' },
              { s: '02', t: 'Chọn Gói Dịch Vụ', d: 'Chọn gói Trial miễn phí hoặc nâng cấp gói Pro.' },
              { s: '03', t: 'Copy License Key', d: 'Lấy mã Key bí mật từ màn hình Dashboard.' },
              { s: '04', t: 'Nhập Vào Extension', d: 'Dán Key vào tiện ích Chrome và quét data ngay!' }
            ].map((step, i) => (
              <div key={i} className="relative z-10">
                <div className="w-20 h-20 mx-auto rounded-full bg-slate-900 border border-slate-700 shadow-[0_0_15px_rgba(0,0,0,0.5)] flex items-center justify-center text-2xl font-black text-cyan-400 mb-6">
                  {step.s}
                </div>
                <h3 className="font-bold text-lg text-white mb-2">{step.t}</h3>
                <p className="text-slate-500 text-sm">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 relative z-10 bg-slate-900/40 border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">Bảng giá dịch vụ</h2>
            <p className="mt-4 text-lg text-slate-400">Chọn gói phù hợp để bứt phá doanh thu ngay hôm nay.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 items-start">
            
            {/* Trial */}
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-lg flex flex-col h-full hover:border-slate-500 transition-colors">
              <h3 className="text-lg font-bold text-slate-400 mb-4">3 Ngày Dùng Thử</h3>
              <div className="text-4xl font-black text-white mb-6">FREE</div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center text-slate-300"><span className="text-cyan-400 mr-3">✓</span> Thời hạn: 3 ngày</li>
                <li className="flex items-center text-slate-300"><span className="text-cyan-400 mr-3">✓</span> Tối đa 100 scan / ngày</li>
                <li className="flex items-center text-slate-300"><span className="text-cyan-400 mr-3">✓</span> Mỗi user nhận 1 lần</li>
              </ul>
              <Link href="/register?plan=trial" className="w-full block text-center py-3.5 px-4 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-700 transition-colors border border-slate-600">
                Dùng thử miễn phí
              </Link>
            </div>

            {/* 1 Month */}
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-lg flex flex-col h-full hover:border-slate-500 transition-colors">
              <h3 className="text-lg font-bold text-slate-400 mb-4">1 Tháng</h3>
              <div className="text-4xl font-black text-white mb-6">69K<span className="text-lg text-slate-500 font-normal">/tháng</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center text-slate-300"><span className="text-cyan-400 mr-3">✓</span> Thời hạn: 30 ngày</li>
                <li className="flex items-center text-slate-300"><span className="text-cyan-400 mr-3">✓</span> Tối đa 1.000 scan / ngày</li>
                <li className="flex items-center text-slate-300"><span className="text-cyan-400 mr-3">✓</span> Nâng cấp dễ dàng</li>
              </ul>
              <Link href="/register?plan=monthly" className="w-full block text-center py-3.5 px-4 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-700 transition-colors border border-slate-600">
                Đăng ký ngay
              </Link>
            </div>

            {/* 3 Months */}
            <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-8 border-2 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.2)] relative flex flex-col h-full transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-cyan-500 to-violet-500 text-white px-5 py-1.5 rounded-full text-xs font-bold tracking-widest shadow-lg">
                PHỔ BIẾN NHẤT
              </div>
              <h3 className="text-lg font-bold text-cyan-400 mb-4 mt-2">3 Tháng</h3>
              <div className="text-4xl font-black text-white mb-6">179K<span className="text-lg text-slate-500 font-normal">/3 tháng</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center text-slate-200"><span className="text-cyan-400 mr-3 font-bold">✓</span> Thời hạn: 90 ngày</li>
                <li className="flex items-center text-slate-200"><span className="text-cyan-400 mr-3 font-bold">✓</span> Tối đa 3.000 scan / ngày</li>
                <li className="flex items-center text-slate-200"><span className="text-cyan-400 mr-3 font-bold">✓</span> Tiết kiệm hơn mua lẻ</li>
              </ul>
              <Link href="/register?plan=quarterly" className="w-full block text-center py-3.5 px-4 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-violet-500 text-white hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:-translate-y-0.5 transition-all">
                Đăng ký ngay
              </Link>
            </div>

            {/* 1 Year */}
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-lg relative flex flex-col h-full hover:border-slate-500 transition-colors">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">
                TIẾT KIỆM
              </div>
              <h3 className="text-lg font-bold text-slate-400 mb-4 mt-2">1 Năm</h3>
              <div className="text-4xl font-black text-white mb-6">479K<span className="text-lg text-slate-500 font-normal">/năm</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center text-slate-300"><span className="text-cyan-400 mr-3">✓</span> Thời hạn: 365 ngày</li>
                <li className="flex items-center text-white font-bold"><span className="text-emerald-400 mr-3">✓</span> Không giới hạn scan</li>
                <li className="flex items-center text-slate-300"><span className="text-cyan-400 mr-3">✓</span> Support Zalo ưu tiên 24/7</li>
              </ul>
              <Link href="/register?plan=yearly" className="w-full block text-center py-3.5 px-4 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-700 transition-colors border border-slate-600">
                Đăng ký ngay
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 relative z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">Câu hỏi thường gặp</h2>
          </div>
          <div className="space-y-6">
            {[
              { q: 'Trial có hoàn toàn miễn phí không?', a: 'Chắc chắn rồi. Gói Trial hoàn toàn miễn phí trong 3 ngày với hạn mức 100 lượt scan/ngày để bạn trải nghiệm sức mạnh của Extension.' },
              { q: 'Sau khi thanh toán tôi phải làm gì?', a: 'Bạn hãy chụp lại bill chuyển khoản và ấn nút "Gửi Zalo" ở cuối trang thanh toán để Admin duyệt ngay lập tức nhé.' },
              { q: 'Khi hết lượt scan trong ngày thì sao?', a: 'Hệ thống sẽ tạm dừng quét và tự động cấp lại đầy đủ số lượt scan mới vào lúc 00:00 (giờ Việt Nam) ngày hôm sau.' },
              { q: 'Tôi có thể mua nhiều gói để cộng dồn không?', a: 'Hiện tại mỗi tài khoản chỉ áp dụng 1 gói License duy nhất tại 1 thời điểm. Bạn có thể gia hạn khi gói cũ gần hết.' }
            ].map((faq, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-colors">
                <h4 className="font-bold text-lg text-white mb-2 flex items-start gap-2">
                  <span className="text-cyan-400 text-xl leading-none">Q.</span>
                  {faq.q}
                </h4>
                <p className="text-slate-400 leading-relaxed pl-7">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Zalo Floating Button */}
      <a href="https://zalo.me/0378791667" target="_blank" rel="noopener noreferrer" className="fixed bottom-8 right-8 z-50 flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:-translate-y-1 transition-all group">
        <svg className="w-6 h-6 animate-pulse" viewBox="0 0 24 24" fill="currentColor"><path d="M21.144 10.457c0-4.63-4.225-8.457-9.457-8.457-5.232 0-9.457 3.827-9.457 8.457 0 4.629 4.225 8.457 9.457 8.457 1.157 0 2.257-.184 3.284-.523l3.655 2.115c.348.201.769-.074.721-.476l-.422-3.159c1.65-1.579 2.676-3.834 2.676-6.414z"/></svg>
        <span className="font-bold hidden group-hover:block transition-all">Chat Hỗ Trợ Zalo</span>
      </a>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 py-12 border-t border-slate-900 relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white font-black text-xs">F</div>
            <span className="font-bold text-slate-300">Fairy House Auto Data</span>
          </div>
          <p className="text-sm">© 2026 Bản quyền thuộc về Fairy House Auto Data. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
