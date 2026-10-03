/**
 * UI formatting utilities — display-only, no business logic.
 * Used to map raw data from API to Vietnamese labels.
 */

// ── Plan names ──
const PLAN_NAMES: Record<string, string> = {
  trial: 'Dùng Thử',
  monthly: '1 Tháng',
  quarterly: '3 Tháng',
  yearly: '1 Năm',
};

export function formatPlanName(planId: string): string {
  return PLAN_NAMES[planId] || planId;
}

// ── Status labels ──
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Đang hoạt động',
  SUSPENDED: 'Tạm khoá',
  EXPIRED: 'Hết hạn',
  REVOKED: 'Đã thu hồi',
  PAID: 'Đã thanh toán',
  PENDING_PAYMENT_REVIEW: 'Chờ duyệt',
  PENDING: 'Đang chờ',
  REJECTED: 'Bị từ chối',
  CANCELLED: 'Đã huỷ',
};

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const STATUS_VARIANTS: Record<string, StatusVariant> = {
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  EXPIRED: 'neutral',
  REVOKED: 'neutral',
  PAID: 'success',
  PENDING_PAYMENT_REVIEW: 'warning',
  PENDING: 'warning',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
};

export function formatStatus(status: string): string {
  return STATUS_LABELS[status] || status;
}

export function getStatusVariant(status: string): StatusVariant {
  return STATUS_VARIANTS[status] || 'neutral';
}

// ── Currency ──
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

export function formatCurrencyShort(amount: number): string {
  if (amount >= 1_000_000) {
    return (amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1) + 'tr';
  }
  if (amount >= 1_000) {
    return (amount / 1_000).toFixed(amount % 1_000 === 0 ? 0 : 0) + 'k';
  }
  return formatCurrency(amount);
}

// ── Date/Time ──
/**
 * Convert a Firestore timestamp or Date string to a formatted Vietnamese date.
 * Handles: { _seconds, _nanoseconds }, ISO string, Date object, or epoch ms.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatDate(value: any, includeTime?: boolean): string {
  if (!value) return '—';
  if (includeTime) return formatDateTime(value);
  
  let date: Date;
  
  if (typeof value === 'object' && '_seconds' in value) {
    date = new Date(value._seconds * 1000);
  } else if (typeof value === 'string') {
    date = new Date(value);
  } else if (typeof value === 'number') {
    date = new Date(value);
  } else if (value instanceof Date) {
    date = value;
  } else {
    return '—';
  }
  
  if (isNaN(date.getTime())) return '—';
  
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatDateTime(value: any): string {
  if (!value) return '—';
  
  let date: Date;
  
  if (typeof value === 'object' && '_seconds' in value) {
    date = new Date(value._seconds * 1000);
  } else if (typeof value === 'string') {
    date = new Date(value);
  } else if (typeof value === 'number') {
    date = new Date(value);
  } else if (value instanceof Date) {
    date = value;
  } else {
    return '—';
  }
  
  if (isNaN(date.getTime())) return '—';
  
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate days remaining from now until expiry.
 * Returns negative if expired.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function daysRemaining(expiresAt: any): number {
  if (!expiresAt) return 0;
  
  let date: Date;
  if (typeof expiresAt === 'object' && '_seconds' in expiresAt) {
    date = new Date(expiresAt._seconds * 1000);
  } else {
    date = new Date(expiresAt);
  }
  
  if (isNaN(date.getTime())) return 0;
  
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatDaysRemaining(days: number): string {
  if (days < 0) return 'Đã hết hạn';
  if (days === 0) return 'Hết hạn hôm nay';
  if (days === 1) return 'Còn 1 ngày';
  return `Còn ${days} ngày`;
}

// ── Quota ──
export function formatQuota(used: number, limit: number | null | undefined): string {
  if (!limit || limit === -1) return `${used.toLocaleString('vi-VN')} / Không giới hạn`;
  return `${used.toLocaleString('vi-VN')} / ${limit.toLocaleString('vi-VN')}`;
}

// ── Payment method ──
export function formatPaymentMethod(method?: string): string {
  if (!method) return '—';
  const map: Record<string, string> = {
    WALLET: 'Ví',
    BANK_TRANSFER: 'Chuyển khoản',
    PAYOS: 'PayOS',
  };
  return map[method] || method;
}

// ── Transaction type ──
export function formatTransactionType(type?: string): string {
  if (!type) return '—';
  const map: Record<string, string> = {
    DEPOSIT: 'Nạp tiền',
    PURCHASE: 'Mua key',
    ORDER: 'Đơn hàng',
  };
  return map[type] || type;
}

// ── License key display (group by 4 chars) ──
export function formatLicenseKey(key: string): string {
  // Already formatted with dashes (FHAD-XXXX-XXXX-XXXX-XXXX)
  if (key.includes('-')) return key;
  // Legacy format — just return as-is
  return key;
}

// ── Mask key for display ──
export function maskKey(key: string): string {
  if (key.length <= 10) return key;
  const parts = key.split('-');
  if (parts.length >= 3) {
    return `${parts[0]}-${parts[1]}-****-****-${parts[parts.length - 1]}`;
  }
  return key.slice(0, 6) + '****' + key.slice(-4);
}
