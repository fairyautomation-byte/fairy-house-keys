'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import StatusBadge from '@/components/features/StatusBadge';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { formatCurrency, formatDate } from '@/lib/format';

export default function DashboardOverview() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');

  useEffect(() => {
    fetch('/api/user/dashboard')
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then(setData)
      .catch(() => {
        fetch('/api/auth/login', { method: 'DELETE' }).finally(() => {
          router.push('/login');
        });
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-fha-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-8 h-[260px] w-full rounded-fha-lg" />
          <Skeleton className="lg:col-span-4 h-[260px] w-full rounded-fha-lg" />
        </div>
        <Skeleton className="h-[300px] w-full rounded-fha-lg" />
      </div>
    );
  }

  if (!data) return null;

  const { user, licenses = [], orders = [] } = data;
  const walletBalance = user.wallet_balance || 0;
  
  // Find primary active license
  const activeLicense = licenses.find((l: any) => l.status === 'ACTIVE') || licenses[0];
  const activeLicensesCount = licenses.filter((l: any) => l.status === 'ACTIVE').length;

  // Calculate quota percentage
  const dailyUsed = activeLicense?.daily_used || 0;
  const dailyLimit = activeLicense?.daily_limit === -1 || activeLicense?.daily_limit === null ? null : (activeLicense?.daily_limit || 1000);
  const quotaPercent = dailyLimit ? Math.min(100, Math.round((dailyUsed / dailyLimit) * 100)) : 0;
  const remainingQuota = dailyLimit ? Math.max(0, dailyLimit - dailyUsed) : 'Không giới hạn';

  // Filter orders
  const filteredOrders = orders.filter((order: any) => {
    if (orderFilter === 'PAID') return order.status === 'PAID' || order.status === 'COMPLETED';
    if (orderFilter === 'PENDING') return order.status === 'PENDING';
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Top Welcome Header */}
      <PageHeader 
        title={`Xin chào, ${user.full_name || 'Quý khách'}`} 
        description="Trung tâm điều khiển và giám sát lưu lượng quét dữ liệu tự động"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/dashboard/store" passHref>
              <Button variant="primary" size="sm">
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Mua Thêm Key
              </Button>
            </Link>
          </div>
        }
      />

      {/* ======================================================== */}
      {/* TIER 1: COMMAND ANCHOR BANNER (MISSION-CRITICAL STATUS)  */}
      {/* ======================================================== */}
      {activeLicense ? (
        <div className="bg-white rounded-fha-lg border-2 border-[var(--fha-border-strong)] p-6 sm:p-7 shadow-fha-sm relative overflow-hidden">
          {/* Subtle accent hairline bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--fha-brand)]" />

          <div className="grid lg:grid-cols-12 gap-6 items-center">
            
            {/* Left Info: License Details (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded bg-[var(--fha-brand-soft)] text-[var(--fha-brand)] text-xs font-bold uppercase tracking-wider border border-[var(--fha-brand)]">
                  Gói {activeLicense.plan_id ? activeLicense.plan_id.toUpperCase() : 'BẢN QUYỀN'}
                </span>
                <StatusBadge status={activeLicense.status} />
                <span className="text-xs text-[var(--fha-text-muted)] font-mono">
                  1 Key / 1 Thiết Bị
                </span>
              </div>

              <div>
                <div className="text-xs text-[var(--fha-text-muted)] font-medium mb-1">Mã License đang hoạt động:</div>
                <div className="flex items-center gap-2">
                  <div className="px-3.5 py-1.5 rounded-fha bg-[var(--fha-surface-2)] border border-[var(--fha-border-strong)] text-base sm:text-lg font-black font-mono text-[var(--fha-text)] tracking-wider select-all">
                    {activeLicense.license_key}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(activeLicense.license_key);
                      alert('Đã sao chép License Key vào bộ nhớ tạm!');
                    }}
                    className="p-2 rounded-fha border border-[var(--fha-border-strong)] bg-white hover:bg-[var(--fha-surface-2)] text-[var(--fha-text-muted)] hover:text-[var(--fha-brand)] transition-colors active:scale-95"
                    title="Sao chép License Key"
                    aria-label="Sao chép License Key"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--fha-text-muted)] pt-1">
                <div>
                  Hết hạn:{' '}
                  <strong className="text-[var(--fha-text)] font-semibold">
                    {activeLicense.expires_at 
                      ? formatDate(activeLicense.expires_at._seconds ? activeLicense.expires_at._seconds * 1000 : activeLicense.expires_at) 
                      : 'Không giới hạn'}
                  </strong>
                </div>
                <span className="text-[var(--fha-border-strong)]">•</span>
                <Link href="/dashboard/licenses" className="text-[var(--fha-brand)] font-semibold hover:underline">
                  Quản lý tất cả License ({activeLicensesCount}) &rarr;
                </Link>
              </div>
            </div>

            {/* Right Gauge: Daily Quota Usage Battery (5 cols) */}
            <div className="lg:col-span-5 bg-[var(--fha-surface-2)] p-4 sm:p-5 rounded-fha border border-[var(--fha-border)] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[var(--fha-text)]">Hạn mức quét hôm nay:</span>
                <span className="font-mono text-[var(--fha-brand)] font-bold">
                  {dailyUsed.toLocaleString('vi-VN')} / {dailyLimit ? dailyLimit.toLocaleString('vi-VN') : '∞'} UID
                </span>
              </div>

              {/* Progress battery bar */}
              <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-[var(--fha-border)] p-0.5">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    quotaPercent > 90 ? 'bg-[var(--fha-error)]' : quotaPercent > 70 ? 'bg-[var(--fha-warning)]' : 'bg-[var(--fha-brand)]'
                  }`}
                  style={{ width: dailyLimit ? `${quotaPercent}%` : '100%' }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[var(--fha-text-muted)]">
                <span>Còn lại: <strong className="text-[var(--fha-text)]">{remainingQuota.toLocaleString('vi-VN')} UID</strong></span>
                <span className="text-[10px] text-[var(--fha-text-faint)]">Tự động hồi phục lúc 00:00 VN</span>
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* Empty / No License Onboarding Banner */
        <div className="bg-white rounded-fha-lg border-2 border-dashed border-[var(--fha-brand)] p-6 sm:p-8 text-center space-y-3 shadow-fha-sm">
          <div className="w-12 h-12 rounded-full bg-[var(--fha-brand-soft)] text-[var(--fha-brand)] flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-[var(--fha-text)]">Bạn Chưa Có License Key Nào Đang Hoạt Động</h3>
          <p className="text-sm text-[var(--fha-text-muted)] max-w-md mx-auto">
            Kích hoạt ngay gói dùng thử 3 Ngày (0đ) hoặc mua gói bản quyền tự động qua PayOS để bắt đầu quét khách hàng ngay bây giờ.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href="/dashboard/store" passHref>
              <Button variant="primary" size="md">Xem Các Gói Bản Quyền</Button>
            </Link>
            <Link href="/activate" passHref>
              <Button variant="outline" size="md" className="bg-white">Xem Hướng Dẫn Cài Đặt</Button>
            </Link>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TIER 2: ASYMMETRIC 8-COL / 4-COL WORKSPACE                */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column (8 cols): Workstation Tools */}
        <div className="lg:col-span-8 bg-white rounded-fha-lg border border-[var(--fha-border)] p-6 space-y-5 flex flex-col justify-between shadow-fha-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[var(--fha-text)]">
                Bàn Làm Việc Tiện Ích Chrome
              </h3>
              <span className="text-xs text-[var(--fha-text-muted)] font-mono">Phiên bản 2.0.4 Native</span>
            </div>

            <div className="grid sm:grid-cols-3 gap-3.5">
              
              {/* Item 1: Download Extension */}
              <a
                href="/fairy-house-extension-v2.zip"
                download
                className="p-4 bg-[var(--fha-surface-2)] hover:bg-white rounded-fha border border-[var(--fha-border)] hover:border-[var(--fha-brand)] transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded bg-white border border-[var(--fha-border)] flex items-center justify-center text-[var(--fha-brand)] mb-3 group-hover:scale-105 transition-transform">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <div className="font-bold text-sm text-[var(--fha-text)] group-hover:text-[var(--fha-brand)] transition-colors">
                    Tải File Cài Đặt (.ZIP)
                  </div>
                  <div className="text-xs text-[var(--fha-text-muted)] mt-1">
                    Cài đặt 1-click vào trình duyệt Chrome
                  </div>
                </div>
                <div className="mt-4 text-[11px] font-semibold text-[var(--fha-brand)]">
                  Tải ngay &rarr;
                </div>
              </a>

              {/* Item 2: Guide & Activation */}
              <Link
                href="/activate"
                className="p-4 bg-[var(--fha-surface-2)] hover:bg-white rounded-fha border border-[var(--fha-border)] hover:border-[var(--fha-brand)] transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded bg-white border border-[var(--fha-border)] flex items-center justify-center text-[var(--fha-brand)] mb-3 group-hover:scale-105 transition-transform">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="font-bold text-sm text-[var(--fha-text)] group-hover:text-[var(--fha-brand)] transition-colors">
                    Kích Hoạt Key Vào App
                  </div>
                  <div className="text-xs text-[var(--fha-text-muted)] mt-1">
                    3 bước liên kết Key vào tiện ích
                  </div>
                </div>
                <div className="mt-4 text-[11px] font-semibold text-[var(--fha-brand)]">
                  Xem chi tiết &rarr;
                </div>
              </Link>

              {/* Item 3: Direct Hotline Support */}
              <a
                href="https://zalo.me/0378791667"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-[var(--fha-surface-2)] hover:bg-white rounded-fha border border-[var(--fha-border)] hover:border-[var(--fha-brand)] transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded bg-white border border-[var(--fha-border)] flex items-center justify-center text-[#0068ff] mb-3 group-hover:scale-105 transition-transform">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div className="font-bold text-sm text-[var(--fha-text)] group-hover:text-[var(--fha-brand)] transition-colors">
                    Hỗ Trợ Zalo Kỹ Thuật
                  </div>
                  <div className="text-xs text-[var(--fha-text-muted)] mt-1">
                    Hướng dẫn từ xa qua Ultraview
                  </div>
                </div>
                <div className="mt-4 text-[11px] font-semibold text-[#0068ff]">
                  Chat Zalo &rarr;
                </div>
              </a>

            </div>
          </div>

          <div className="pt-4 border-t border-[var(--fha-border)] flex items-center justify-between text-xs text-[var(--fha-text-muted)]">
            <span>Cơ chế bảo mật: Cookie nội bộ Chrome • Không thu thập mật khẩu Facebook</span>
            <span className="font-semibold text-[var(--fha-success)] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--fha-success)] animate-pulse" />
              Chống checkpoint 2.0 ON
            </span>
          </div>
        </div>

        {/* Right Column (4 cols): Wallet Balance & Direct Topup */}
        <div className="lg:col-span-4 bg-white rounded-fha-lg border border-[var(--fha-border)] p-6 flex flex-col justify-between shadow-fha-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--fha-text-muted)]">
                Ví Tài Khoản
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--fha-success-bg)] text-[var(--fha-success)]">
                PayOS Tự Động
              </span>
            </div>

            <div>
              <div className="text-3xl font-black font-mono text-[var(--fha-text)] tracking-tight">
                {formatCurrency(walletBalance)}
              </div>
              <p className="text-xs text-[var(--fha-text-muted)] mt-1">
                Số dư dùng để mua hoặc gia hạn license key ngay lập tức.
              </p>
            </div>
          </div>

          <div className="space-y-2.5 pt-6 border-t border-[var(--fha-border)]">
            <Link href="/dashboard/wallet" passHref>
              <Button variant="primary" fullWidth size="md" className="font-bold text-xs">
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Nạp Tiền Qua VietQR PayOS
              </Button>
            </Link>

            <Link href="/dashboard/store" passHref>
              <Button variant="secondary" fullWidth size="md" className="font-semibold text-xs">
                Mua Key Bằng Số Dư Ví
              </Button>
            </Link>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* TIER 3: TRANSACTION & ORDER HISTORY WITH FILTER TABS     */}
      {/* ======================================================== */}
      <div className="bg-white rounded-fha-lg border border-[var(--fha-border)] shadow-fha-sm overflow-hidden">
        
        {/* Table Toolbar */}
        <div className="p-5 border-b border-[var(--fha-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
          <div>
            <h3 className="text-base font-bold text-[var(--fha-text)]">Lịch Sử Giao Dịch & Đơn Hàng</h3>
            <p className="text-xs text-[var(--fha-text-muted)] mt-0.5">Duyệt tự động theo thời gian thực qua PayOS</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-[var(--fha-surface-2)] rounded border border-[var(--fha-border)] text-xs">
            <button
              onClick={() => setOrderFilter('ALL')}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                orderFilter === 'ALL' ? 'bg-white text-[var(--fha-text)] shadow-sm' : 'text-[var(--fha-text-muted)] hover:text-[var(--fha-text)]'
              }`}
            >
              Tất cả ({orders.length})
            </button>
            <button
              onClick={() => setOrderFilter('PAID')}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                orderFilter === 'PAID' ? 'bg-white text-[var(--fha-success)] shadow-sm' : 'text-[var(--fha-text-muted)] hover:text-[var(--fha-text)]'
              }`}
            >
              Thành công
            </button>
            <button
              onClick={() => setOrderFilter('PENDING')}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                orderFilter === 'PENDING' ? 'bg-white text-[var(--fha-warning)] shadow-sm' : 'text-[var(--fha-text-muted)] hover:text-[var(--fha-text)]'
              }`}
            >
              Chờ thanh toán
            </button>
          </div>
        </div>

        {/* Orders Table */}
        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--fha-border)] bg-[var(--fha-surface-2)] text-[var(--fha-text-muted)] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-5 fha-sticky-col bg-[var(--fha-surface-2)]">Mã đơn</th>
                  <th className="py-3 px-5">Gói dịch vụ</th>
                  <th className="py-3 px-5">Số tiền</th>
                  <th className="py-3 px-5">Trạng thái</th>
                  <th className="py-3 px-5">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--fha-border)]">
                {filteredOrders.map((order: any, idx: number) => (
                  <tr key={order.id || idx} className="hover:bg-[var(--fha-surface-2)]/50 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-[var(--fha-text)] fha-sticky-col">
                      #{order.order_code || (order.id ? order.id.slice(0, 8) : 'ORD')}
                    </td>
                    <td className="py-3.5 px-5 font-medium text-[var(--fha-text)]">
                      {order.plan_id ? order.plan_id.toUpperCase() : 'Gói dịch vụ'}
                    </td>
                    <td className="py-3.5 px-5 font-mono font-bold text-[var(--fha-brand)]">
                      {formatCurrency(order.amount || 0)}
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3.5 px-5 text-[var(--fha-text-muted)] font-mono">
                      {order.created_at ? formatDate(order.created_at._seconds ? order.created_at._seconds * 1000 : order.created_at) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-[var(--fha-text-muted)]">
            Không tìm thấy giao dịch nào phù hợp với bộ lọc hiện tại.
          </div>
        )}

      </div>
    </div>
  );
}
