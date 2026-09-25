'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV = [
  { href: '/admin/requests', label: '📋 Đơn xin key', id: 'requests' },
  { href: '/admin/keys', label: '🗝️ Quản lý key', id: 'keys' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.push('/admin/login');
    router.refresh();
  };

  if (pathname === '/admin/login') return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col">
      {/* Top nav */}
      <header className="glass border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏠</span>
            <div>
              <span className="font-black text-white text-sm">Fairy House</span>
              <span className="text-slate-500 text-xs ml-2">Admin</span>
            </div>
          </div>
          <nav className="flex gap-1">
            {NAV.map(n => (
              <Link
                key={n.id}
                href={n.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  pathname.startsWith(n.href)
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-slate-400 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-950/30 border border-transparent hover:border-red-500/30"
        >
          🚪 Đăng xuất
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
