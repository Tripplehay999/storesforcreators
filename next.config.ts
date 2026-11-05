import type { NextConfig } from "next";

// Baseline browser protections for every page and API route.
const SECURITY_HEADERS = [
  // No other site may frame these pages (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://checkout.stripe.com" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }
];

const nextConfig: NextConfig = {
  // A package-lock.json in the home folder otherwise confuses root detection.
  turbopack: { root: __dirname },
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      // Font files never change in place (a new version gets a new name), so browsers can keep them.
      { source: "/fonts/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] }
    ];
  },
  async redirects() {
    return [
      { source: "/studio", destination: "/dashboard/products", permanent: false },
      // Stores moved from /store/jasmine to /jasmine. Links and QR codes already shared keep working,
      // and their ?src= tracking comes along (Next.js passes the query through).
      { source: "/store/:slug", destination: "/:slug", permanent: true }
    ];
  }
};

export default nextConfig;
