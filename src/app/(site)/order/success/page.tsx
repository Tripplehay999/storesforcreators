import type { Metadata } from "next";
import Link from "next/link";
import { money } from "@/lib/format";
import { getCheckoutSession, stripeConfigured, type CheckoutSession } from "@/lib/stripe";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Thanks for your order | Stores for Creators", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ session_id?: string }> };

export default async function OrderSuccessPage({ searchParams }: Props) {
  const { session_id: sessionId } = await searchParams;
  let session: CheckoutSession | null = null;

  if (sessionId && stripeConfigured() && /^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
    try {
      session = await getCheckoutSession(sessionId);
    } catch {
      session = null;
    }
  }

  // The order appears once Stripe's webhook has been handled, usually within a second or two.
  const order = session && hasServiceRole()
    ? (await createServiceClient()
        .from("orders")
        .select("product_name, download_token")
        .eq("stripe_session_id", session.id)
        .maybeSingle()).data
    : null;

  const paid = session?.payment_status === "paid";
  const email = session?.customer_details?.email;

  return (
    <main className="order-page">
      {paid && !order && <meta httpEquiv="refresh" content="3" />}

      <section className="order-card">
        <span className="order-badge" aria-hidden="true">{paid ? "✓" : "…"}</span>
        <h1>{paid ? "Thanks for your order!" : "We're confirming your payment"}</h1>

        {session && (
          <p className="order-lead">
            {order?.product_name ?? "Your order"} · {money((session.amount_total ?? 0) / 100, 2)}
          </p>
        )}

        {order?.download_token ? (
          <>
            <p>Your download is ready. We&apos;ve also emailed the link{email ? <> to <strong>{email}</strong></> : null}.</p>
            <Link className="btn btn-dark" href={`/download/${order.download_token}`}>Go to your download</Link>
          </>
        ) : order ? (
          <p>Your receipt is on its way{email ? <> to <strong>{email}</strong></> : null}. The creator will be in touch about what happens next.</p>
        ) : paid ? (
          <p>Your payment went through. This page will update in a moment with your order details.</p>
        ) : (
          <p>If you completed payment, your receipt will arrive by email shortly.</p>
        )}

        <Link className="order-home" href="/">Back to Stores for Creators</Link>
      </section>
    </main>
  );
}
