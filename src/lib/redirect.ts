/**
 * A same-site path that's safe to redirect to (e.g. ?next= after login), or the fallback.
 * Rejects absolute URLs, protocol-relative "//evil.com", and "/\evil.com" (which browsers treat as "//").
 */
export function safeRedirectPath(value: unknown, fallback = "/dashboard") {
  const raw = String(value ?? "");

  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") || /[\u0000-\u001f\u007f]/.test(raw)) {
    return fallback;
  }

  try {
    const base = "https://site.invalid";
    const url = new URL(raw, base);
    return url.origin === base ? url.pathname + url.search + url.hash : fallback;
  } catch {
    return fallback;
  }
}
