import type { Metadata } from "next";
import Link from "next/link";
import { MAX_DOWNLOADS } from "@/lib/downloads";
import { shortDate } from "@/lib/format";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Your download | Stores for Creators", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> };

// Download links arrive by email. The file itself is behind a button (a POST), so email scanners that
// open links can't use up the buyer's downloads.
export default async function DownloadPage({ params, searchParams }: Props) {
  const [{ token }, { error }] = await Promise.all([params, searchParams]);
  const order = hasServiceRole() && /^[A-Za-z0-9_-]{20,64}$/.test(token)
    ? (await createServiceClient()
        .from("orders")
        .select("product_name, status, download_count, download_expires_at")
        .eq("download_token", token)
        .maybeSingle()).data
    : null;

  const expired = order?.download_expires_at ? new Date(order.download_expires_at) < new Date() : false;
  const remaining = order ? MAX_DOWNLOADS - Number(order.download_count) : 0;
  const usable = order && order.status === "completed" && !expired && remaining > 0;

  return (
    <main className="order-page">
      <section className="order-card">
        <span className="order-badge" aria-hidden="true">{usable ? "↓" : "!"}</span>

        {!order ? (
          <>
            <h1>We can&apos;t find that download</h1>
            <p>Check that you opened the full link from your receipt email.</p>
          </>
        ) : !usable ? (
          <>
            <h1>This download link has ended</h1>
            <p>
              {order.status !== "completed"
                ? "This order was refunded."
                : expired
                  ? "Download links work for 30 days after purchase."
                  : `It's been downloaded the maximum ${MAX_DOWNLOADS} times.`}{" "}
              Reply to your receipt email and we&apos;ll help.
            </p>
          </>
        ) : (
          <>
            <h1>{order.product_name}</h1>
            <p>
              {remaining} download{remaining === 1 ? "" : "s"} left
              {order.download_expires_at ? <>, until {shortDate(order.download_expires_at, true)}</> : null}.
            </p>
            {error && <p className="order-error">The download didn&apos;t start. Please try again.</p>}
            <form action={`/download/${token}/file`} method="post">
              <button className="btn btn-dark" type="submit">Download</button>
            </form>
          </>
        )}

        <Link className="order-home" href="/">Back to Stores for Creators</Link>
      </section>
    </main>
  );
}
