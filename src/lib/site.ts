import "server-only";

import { headers } from "next/headers";

/**
 * The site's public address for links in emails and payment redirects.
 * Set NEXT_PUBLIC_SITE_URL in production; the fallback uses the request's host,
 * never the browser-supplied Origin header.
 */
export async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
