import * as crypto from "crypto";

export type KeyType = "trial" | "monthly" | "quarterly" | "yearly";

// Số ngày cho mỗi gói (null = không giới hạn thời gian)
export const KEY_DURATIONS: Record<KeyType, number | null> = {
  trial: 3, // 3 ngày dùng thử
  monthly: 30, // 1 tháng
  quarterly: 90, // 3 tháng
  yearly: 365, // 1 năm
};

// Giới hạn scan mỗi ngày (-1 = không giới hạn)
export const KEY_SCAN_LIMITS: Record<KeyType, number> = {
  trial: 100, // tối đa 100 lần/ngày
  monthly: 1000, // tối đa 1000 lần/ngày
  quarterly: 3000, // tối đa 3000 lần/ngày
  yearly: -1, // không giới hạn
};

// Giá gói (VND)
export const KEY_PRICES: Record<KeyType, number> = {
  trial: 0,
  monthly: 69000,
  quarterly: 179000,
  yearly: 479000, // Đã cập nhật theo yêu cầu
};

export const KEY_INFO: Record<
  KeyType,
  {
    name: string;
    label: string;
    badge?: string;
    color: string;
    gradient: string;
    icon: string;
  }
> = {
  trial: {
    name: "Dùng Thử",
    label: "3 ngày",
    color: "#64748b",
    gradient: "from-slate-600 to-slate-700",
    icon: "🆓",
  },
  monthly: {
    name: "1 Tháng",
    label: "1 tháng",
    color: "#2563eb",
    gradient: "from-blue-600 to-blue-700",
    icon: "⭐",
  },
  quarterly: {
    name: "3 Tháng",
    label: "3 tháng",
    badge: "PHỔ BIẾN",
    color: "#7c3aed",
    gradient: "from-violet-600 to-violet-700",
    icon: "🚀",
  },
  yearly: {
    name: "1 Năm",
    label: "1 năm",
    badge: "TIẾT KIỆM",
    color: "#059669",
    gradient: "from-emerald-600 to-green-700",
    icon: "💎",
  },
};

function generateRandomPart(length: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

/**
 * Sinh key mới theo format: FHAD-XXXX-XXXX-XXXX-XXXX
 */
export function generateKey(): string {
  const randomStr = generateRandomPart(16); // 16 chars
  const formatted = randomStr.match(/.{1,4}/g)?.join("-") || randomStr;
  return `FHAD-${formatted}`;
}

export function validateKeyFormat(key: string): {
  valid: boolean;
  type?: KeyType;
} {
  // New FHAD format (We rely on DB for type, just check format here)
  if (/^FHAD-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key)) {
    return { valid: true }; // type will be fetched from DB
  }

  // Legacy formats
  const patterns: Array<{ regex: RegExp; type: KeyType }> = [
    { regex: /^ZT-TRIAL-([A-Z0-9]{16})-([A-Z0-9]{4})$/, type: "trial" },
    { regex: /^ZT-1M-([A-Z0-9]{16})-([A-Z0-9]{4})$/, type: "monthly" },
    { regex: /^ZT-3M-([A-Z0-9]{16})-([A-Z0-9]{4})$/, type: "quarterly" },
    { regex: /^ZT-1Y-([A-Z0-9]{16})-([A-Z0-9]{4})$/, type: "yearly" },
    { regex: /^FH-TRIAL-([A-Z0-9]{16})-([A-Z0-9]{4})$/, type: "trial" },
    { regex: /^FH-STD-([A-Z0-9]{16})-([A-Z0-9]{4})$/, type: "monthly" },
    { regex: /^FH-PRO-([A-Z0-9]{16})-([A-Z0-9]{4})$/, type: "quarterly" },
    { regex: /^FH-LIFE-([A-Z0-9]{16})-([A-Z0-9]{4})$/, type: "yearly" },
  ];

  for (const { regex, type } of patterns) {
    const match = key.match(regex);
    if (match) {
      return { valid: true, type };
    }
  }
  return { valid: false };
}

export function getExpiryDate(type: KeyType): Date | null {
  const days = KEY_DURATIONS[type];
  if (days === null) return null;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

export function formatPrice(price: number): string {
  if (price === 0) return "Miễn phí";
  return price.toLocaleString("vi-VN") + "đ";
}
