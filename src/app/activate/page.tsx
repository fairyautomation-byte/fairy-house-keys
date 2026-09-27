import Link from 'next/link';

export default function ActivatePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1e] via-[#0d1429] to-[#0a0f1e] flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-md text-center animate-fade-in">
        <div className="glass rounded-2xl p-8 shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg" style={{ boxShadow: '0 0 30px rgba(16,185,129,0.4)' }}>
            ✅
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Đã Gửi Thành Công!</h1>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Chúng tôi đã nhận đơn đăng ký của bạn.<br />
            Key sẽ được gửi qua <strong className="text-emerald-400">email của bạn</strong> trong vòng <strong className="text-emerald-400">24 giờ</strong>.
          </p>

          <div className="bg-slate-800/60 rounded-xl p-4 mb-6 text-left space-y-2">
            <p className="text-sm font-semibold text-slate-200 mb-3">📖 Sau khi nhận key, làm theo các bước:</p>
            <div className="flex items-start gap-3 text-sm">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold">1</span>
              <span className="text-slate-300">Mở Extension <strong className="text-violet-300">Fairy House AutoData</strong> trên Chrome</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold">2</span>
              <span className="text-slate-300">Vào tab <strong className="text-violet-300">"License Key"</strong></span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold">3</span>
              <span className="text-slate-300">Dán key và bấm <strong className="text-violet-300">"Kích hoạt"</strong></span>
            </div>
          </div>

          <p className="text-slate-500 text-xs mb-4">Cần hỗ trợ ngay?</p>
          <a
            href="https://zalo.me/0378791667"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold hover:brightness-110 transition-all text-sm shadow-lg"
          >
            📱 Liên hệ Zalo hỗ trợ
          </a>
          <div className="mt-4">
            <Link href="/register" className="text-slate-400 text-xs hover:text-slate-200 transition-colors underline underline-offset-2">
              Đăng ký thêm tài khoản khác
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
