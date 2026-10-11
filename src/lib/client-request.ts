"use client";

export function requestId(scope: string) {
  const key = `fh-request:${scope}`;
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

export function clearRequest(scope: string) {
  sessionStorage.removeItem(`fh-request:${scope}`);
}

export function paymentIntentId(
  type: "deposit" | "purchase",
  identifier: string | number,
  userId?: string,
) {
  const userPrefix = userId ? `${userId}:` : "";
  return requestId(`${userPrefix}payment:${type}:${identifier}`);
}

export function clearPaymentIntent(
  type: "deposit" | "purchase",
  identifier: string | number,
  userId?: string,
) {
  const userPrefix = userId ? `${userId}:` : "";
  clearRequest(`${userPrefix}payment:${type}:${identifier}`);
  if (userPrefix) {
    clearRequest(`payment:${type}:${identifier}`);
  }
}
