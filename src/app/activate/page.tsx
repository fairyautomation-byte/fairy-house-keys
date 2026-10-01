import Link from 'next/link';
import Image from 'next/image';

export default function ActivatePage() {
  return (
    <div className="min-h-screen bg-fha-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Aurora Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-fha-cyan rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-3 relative z-10 hover:scale-105 transition-transform">
        <Image src="/logo.png" alt="Logo" width={40} height={40} className="rounded-full shadow-fha-cyan" />
        <span className="font-bold text-xl tracking-tight text-fha-text">
          Fairy House <span className="text-fha-cyan">AutoData</span>
        </span>
      </Link>

      <div className="w-full max-w-[440px] bg-fha-glass backdrop-blur-2xl shadow-fha-outset rounded-3xl border border-fha-glass-border overflow-hidden animate-slide-up relative z-10">
        <div className="p-8 sm:p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg" style={{ boxShadow: '0 0 30px rgba(16,185,129,0.4)' }}>
            ✅
          </div>
          <h1 className="text-2xl font-bold text-fha-text mb-2">Đã Gửi Thành Công!</h1>
          <p className="text-fha-text-muted text-sm mb-6 leading-relaxed">
            Chúng tôi đã nhận đơn đăng ký của bạn.<br />
            Key sẽ được gửi qua <strong className="text-fha-cyan">email của bạn</strong> trong vòng <strong className="text-fha-cyan">24 giờ</strong>.
          </p>

          <div className="bg-fha-surface-2 rounded-fha-radius p-4 mb-6 text-left space-y-3 border border-fha-border">
            <p className="text-sm font-semibold text-fha-text mb-2">📖 Sau khi nhận key, làm theo các bước:</p>
            <div className="flex items-start gap-3 text-sm">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-fha-cyan-muted text-fha-cyan flex items-center justify-center text-xs font-bold border border-fha-cyan-border">1</span>
              <span className="text-fha-text-muted">Mở Extension <strong className="text-fha-text">Fairy House AutoData</strong> trên Chrome</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-fha-cyan-muted text-fha-cyan flex items-center justify-center text-xs font-bold border border-fha-cyan-border">2</span>
              <span className="text-fha-text-muted">Vào tab <strong className="text-fha-text">"License Key"</strong></span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-fha-cyan-muted text-fha-cyan flex items-center justify-center text-xs font-bold border border-fha-cyan-border">3</span>
              <span className="text-fha-text-muted">Dán key và bấm <strong className="text-fha-text">"Kích hoạt"</strong></span>
            </div>
          </div>

          <p className="text-fha-text-muted text-xs mb-4">Cần hỗ trợ ngay?</p>
          <a
            href="https://zalo.me/0378791667"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 px-6 py-3 rounded-full bg-fha-cyan text-slate-900 font-bold hover:bg-fha-cyan-hover transition-colors text-sm shadow-fha-cyan"
          >
            📱 Liên hệ Zalo hỗ trợ
          </a>
          <div className="mt-6 border-t border-fha-border pt-4">
            <Link href="/register" className="text-fha-text-faint text-sm hover:text-fha-cyan transition-colors underline underline-offset-2">
              Đăng ký thêm tài khoản khác
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
