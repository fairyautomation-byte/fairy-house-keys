'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

const NAV = [
  { href: '/admin', label: '📊 Dashboard' },
  { href: '/admin/orders', label: '💳 Đơn hàng' },
  { href: '/admin/users', label: '👥 Người dùng' },
  { href: '/admin/licenses', label: '🗝️ Licenses' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.push('/admin/login');
  };

  if (pathname === '/admin/login') return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-cyan-500/30 overflow-hidden relative">
      {/* Background Aurora */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[120px]"></div>
      </div>

      <header className="bg-slate-900/60 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <Link href="/admin" className="flex items-center gap-3 hover:scale-105 transition-transform">
            <div className="w-12 h-12 relative flex items-center justify-center overflow-hidden rounded-full shadow-[0_0_15px_rgba(6,182,212,0.3)] border border-slate-700">
              <Image src="/logo.png" alt="Fairy House Auto Data" fill className="object-cover" />
            </div>
            <div>
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 block leading-tight text-lg">Fairy House Auto Data</span>
              <span className="text-cyan-500/80 font-bold text-[10px] tracking-widest uppercase block mt-0.5">Admin Portal</span>
            </div>
          </Link>
          <nav className="hidden md:flex gap-2">
            {NAV.map(n => {
              const isActive = n.href === '/admin' ? pathname === '/admin' : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                      : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {n.label}
                </Link>
              )
            })}
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm font-bold text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 px-5 py-2 rounded-xl transition-all flex items-center gap-2"
        >
          Đăng xuất
        </button>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full relative z-10">
        {children}
      </main>
    </div>
  );
}
