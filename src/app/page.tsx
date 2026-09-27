import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">F</div>
            <span className="font-bold text-xl tracking-tight">Fairy House AutoData</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-blue-600 flex items-center">
              Đăng nhập
            </Link>
            <Link href="/register" className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full transition-all shadow-sm shadow-blue-200">
              Đăng ký
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-blue-50 to-transparent"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/50 text-blue-700 text-sm font-medium mb-6 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            CHROME EXTENSION
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-tight">
            Kiểm soát License và <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              tự động hóa scan dễ dàng
            </span>
          </h1>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Hệ thống License Key chính thức cho Fairy House AutoData. Quản lý License, kiểm soát số lần scan và sử dụng extension theo đúng gói dịch vụ của bạn.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#pricing" className="px-8 py-4 rounded-full bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full sm:w-auto">
              Xem bảng giá
            </a>
            <Link href="/register?plan=trial" className="px-8 py-4 rounded-full bg-white text-slate-900 font-semibold hover:bg-slate-50 border border-slate-200 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 w-full sm:w-auto">
              Dùng thử miễn phí
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Tính năng nổi bật</h2>
            <p className="mt-4 text-lg text-slate-600">Trải nghiệm sự khác biệt với hệ thống quản lý hiện đại.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { t: 'License Key chính chủ', d: 'Mỗi key được tạo duy nhất với thuật toán mã hóa an toàn.' },
              { t: 'Quản lý quota tự động', d: 'Hệ thống tự động tính toán và giới hạn số lượt scan.' },
              { t: 'Theo dõi số lần scan', d: 'Xem chi tiết số lượt đã dùng và còn lại trong ngày.' },
              { t: 'Kiểm tra License realtime', d: 'Xác thực nhanh chóng ngay khi mở Extension.' },
              { t: 'Dashboard cá nhân', d: 'Quản lý thông tin, gia hạn và nâng cấp dễ dàng.' },
              { t: 'Hỗ trợ nhiều gói sử dụng', d: 'Tùy chọn linh hoạt từ dùng thử đến doanh nghiệp.' }
            ].map((f, i) => (
              <div key={i} className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-100 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mb-6 font-bold text-xl">{i+1}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{f.t}</h3>
                <p className="text-slate-600 leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">Quy trình sử dụng</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { s: '01', t: 'Đăng ký tài khoản' },
              { s: '02', t: 'Chọn gói dịch vụ' },
              { s: '03', t: 'Nhận License Key' },
              { s: '04', t: 'Nhập Key vào Extension' }
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-2xl font-bold text-blue-400 mb-6 relative z-10">
                  {step.s}
                </div>
                {i < 3 && <div className="hidden md:block absolute top-8 left-[60%] w-full h-[2px] bg-slate-800"></div>}
                <h3 className="font-semibold text-lg">{step.t}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Bảng giá dịch vụ</h2>
            <p className="mt-4 text-lg text-slate-600">Chọn gói phù hợp với nhu cầu của bạn</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 items-start">
            
            {/* Trial */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col h-full">
              <h3 className="text-lg font-semibold text-slate-500 mb-4">3 Ngày Dùng Thử</h3>
              <div className="text-4xl font-bold text-slate-900 mb-6">FREE</div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center text-slate-600"><span className="text-green-500 mr-2">✓</span> Thời hạn: 3 ngày</li>
                <li className="flex items-center text-slate-600"><span className="text-green-500 mr-2">✓</span> Tối đa 50 scan / ngày</li>
                <li className="flex items-center text-slate-600"><span className="text-green-500 mr-2">✓</span> Mỗi user nhận 1 lần</li>
              </ul>
              <Link href="/register?plan=trial" className="w-full block text-center py-3 px-4 rounded-xl font-semibold bg-slate-100 text-slate-900 hover:bg-slate-200 transition-colors">
                Dùng thử miễn phí
              </Link>
            </div>

            {/* 1 Month */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col h-full">
              <h3 className="text-lg font-semibold text-slate-500 mb-4">1 Tháng</h3>
              <div className="text-4xl font-bold text-slate-900 mb-6">69.000đ</div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center text-slate-600"><span className="text-green-500 mr-2">✓</span> Thời hạn: 30 ngày</li>
                <li className="flex items-center text-slate-600"><span className="text-green-500 mr-2">✓</span> Tối đa 1.000 scan / ngày</li>
                <li className="flex items-center text-slate-600"><span className="text-green-500 mr-2">✓</span> Support cơ bản</li>
              </ul>
              <Link href="/register?plan=monthly" className="w-full block text-center py-3 px-4 rounded-xl font-semibold bg-slate-100 text-slate-900 hover:bg-slate-200 transition-colors">
                Đăng ký ngay
              </Link>
            </div>

            {/* 3 Months */}
            <div className="bg-white rounded-3xl p-8 border-2 border-blue-500 shadow-xl relative flex flex-col h-full transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide">
                PHỔ BIẾN
              </div>
              <h3 className="text-lg font-semibold text-blue-600 mb-4 mt-2">3 Tháng</h3>
              <div className="text-4xl font-bold text-slate-900 mb-6">179.000đ</div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center text-slate-600"><span className="text-blue-500 mr-2">✓</span> Thời hạn: 90 ngày</li>
                <li className="flex items-center text-slate-600"><span className="text-blue-500 mr-2">✓</span> Tối đa 3.000 scan / ngày</li>
                <li className="flex items-center text-slate-600"><span className="text-blue-500 mr-2">✓</span> Tiết kiệm hơn</li>
              </ul>
              <Link href="/register?plan=quarterly" className="w-full block text-center py-3 px-4 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:-translate-y-0.5 transition-all">
                Đăng ký ngay
              </Link>
            </div>

            {/* 1 Year */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative flex flex-col h-full">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                TIẾT KIỆM
              </div>
              <h3 className="text-lg font-semibold text-slate-500 mb-4 mt-2">1 Năm</h3>
              <div className="text-4xl font-bold text-slate-900 mb-6">479.000đ</div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center text-slate-600"><span className="text-green-500 mr-2">✓</span> Thời hạn: 365 ngày</li>
                <li className="flex items-center text-slate-900 font-medium"><span className="text-green-500 mr-2">✓</span> Không giới hạn scan</li>
                <li className="flex items-center text-slate-600"><span className="text-green-500 mr-2">✓</span> Support ưu tiên</li>
              </ul>
              <Link href="/register?plan=yearly" className="w-full block text-center py-3 px-4 rounded-xl font-semibold bg-slate-100 text-slate-900 hover:bg-slate-200 transition-colors">
                Đăng ký ngay
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Câu hỏi thường gặp</h2>
          </div>
          <div className="space-y-6">
            {[
              { q: 'Trial có miễn phí không?', a: 'Có, Trial hoàn toàn miễn phí trong 3 ngày và tối đa 50 lượt scan mỗi ngày.' },
              { q: 'Trial có được dùng lại nhiều lần không?', a: 'Không. Mỗi tài khoản (email) chỉ được nhận Trial một lần duy nhất.' },
              { q: 'Khi hết quota trong ngày thì sao?', a: 'Bạn sẽ không thể scan tiếp cho đến khi quota được tự động reset vào lúc 00:00 (giờ Việt Nam) ngày hôm sau.' },
              { q: 'License hết hạn thì sao?', a: 'Extension sẽ tạm khóa tính năng scan cho đến khi bạn gia hạn hoặc mua License mới hợp lệ.' }
            ].map((faq, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <h4 className="font-bold text-lg text-slate-900 mb-2">{faq.q}</h4>
                <p className="text-slate-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>© 2026 Fairy House AutoData. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
