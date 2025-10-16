export function hasSessionCookie(): boolean {
  return document.cookie.split("; ").some((p) => p.startsWith("session="));
}
export function ensureAuth(): void {
  if (!hasSessionCookie()) {
    const current = window.location.pathname + window.location.search + window.location.hash;
    const to = "/login" + (current && current !== "/login" ? ("?next=" + encodeURIComponent(current)) : "");
    window.location.replace(to);
  }
}
