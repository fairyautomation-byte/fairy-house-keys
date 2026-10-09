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
