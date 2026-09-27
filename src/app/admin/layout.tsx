'use client';
import Link from 'next/link';
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white font-bold">A</div>
            <div>
              <span className="font-bold text-slate-900 block leading-tight">Fairy House</span>
              <span className="text-slate-500 text-xs block">Admin Portal</span>
            </div>
          </div>
          <nav className="hidden md:flex gap-1">
            {NAV.map(n => {
              const isActive = n.href === '/admin' ? pathname === '/admin' : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
          className="text-sm font-medium text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
        >
          Đăng xuất
        </button>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
