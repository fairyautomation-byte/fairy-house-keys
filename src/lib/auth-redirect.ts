// Only allow local account/checkout destinations; never redirect to external input.
export function accountReturnPath(value: string | null | undefined): string | null {
  if (!value || /[\\\r\n]/.test(value)) return null;
  try {
    const url = new URL(value, 'https://account.invalid');
    if (!value.startsWith('/') || url.origin !== 'https://account.invalid') return null;
    if (url.pathname !== '/checkout' && url.pathname !== '/dashboard' && !url.pathname.startsWith('/dashboard/')) return null;
    return url.pathname + url.search;
  } catch { return null; }
}
