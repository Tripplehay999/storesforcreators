import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { DOWNLOAD_DAYS } from "@/lib/downloads";
import { newSaleEmail, receiptEmail } from "@/lib/email-templates";
import { emailLinks } from "@/lib/email-links";
import { STANDARD_CREATOR_SHARE } from "@/lib/format";
import { completedOrderCount, sendLater, storeOwnerContact } from "@/lib/notify";
import { isMissingSchema } from "@/lib/schema";
import { siteUrl } from "@/lib/site";
import { stripeConfigured, verifyWebhook, type CheckoutSession } from "@/lib/stripe";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/admin";
import { storeUrl } from "@/lib/store-links";

// Stripe → us. Point a webhook at /api/stripe/webhook for:
// checkout.session.completed, checkout.session.async_payment_succeeded, charge.refunded.

export async function POST(request: NextRequest) {
  if (!stripeConfigured() || !hasServiceRole()) {
    return NextResponse.json({ error: "Payments aren't configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  let event;

  try {
    event = verifyWebhook(rawBody, request.headers.get("stripe-signature"), process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error) {
    console.warn("[stripe] rejected webhook:", (error as Error).message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      await fulfil(event.data.object as unknown as CheckoutSession);
    } else if (event.type === "charge.refunded") {
      const charge = event.data.object as { payment_intent?: string; refunded?: boolean };
      // Only a full refund takes the order out of the creator's balance.
      if (charge.refunded && charge.payment_intent) {
        await createServiceClient().from("orders").update({ status: "refunded" }).eq("stripe_payment_intent", charge.payment_intent);
      }
    }
  } catch (error) {
    console.error(`[stripe] couldn't handle ${event.type}:`, error);
    // A 500 makes Stripe retry later; fulfil() is safe to run twice.
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function fulfil(session: CheckoutSession) {
  if (session.payment_status !== "paid") return; // async methods arrive later as async_payment_succeeded

  const db = createServiceClient();
  const productId = session.metadata?.product_id ?? "";
  const storeSlug = session.metadata?.store_slug ?? "";
  const discountCode = session.metadata?.discount_code || null;

  const { data: existing } = await db.from("orders").select("id").eq("stripe_session_id", session.id).maybeSingle();
  if (existing) return;

  const [{ data: product }, { data: store }, fileResult] = await Promise.all([
    db.from("products").select("id, name").eq("id", productId).maybeSingle(),
    db.from("stores").select("slug, name, revenue_share").eq("slug", storeSlug).maybeSingle(),
    db.from("product_files").select("path").eq("product_id", productId).maybeSingle()
  ]);

  if (!store) throw new Error(`Paid session ${session.id} for unknown store "${storeSlug}"`);
  if (fileResult.error && !isMissingSchema(fileResult.error)) throw fileResult.error;

  const amount = (session.amount_total ?? 0) / 100;
  const share = Number(store.revenue_share ?? STANDARD_CREATOR_SHARE);
  const creatorAmount = Math.round(amount * share) / 100;
  const token = fileResult.data ? randomBytes(24).toString("base64url") : null;
  const productName = product?.name ?? "Order";

  const { error } = await db.from("orders").insert({
    store_slug: store.slug,
    product_id: product?.id ?? null,
    product_name: productName,
    customer_email: session.customer_details?.email ?? null,
    amount,
    creator_amount: creatorAmount,
    status: "completed",
    stripe_session_id: session.id,
    stripe_payment_intent: session.payment_intent,
    discount_code: discountCode,
    discount_amount: Number(session.metadata?.discount_cents || 0) / 100,
    download_token: token,
    download_expires_at: token ? new Date(Date.now() + DOWNLOAD_DAYS * 86400000).toISOString() : null
  });

  if (error) {
    if (error.code === "23505") return; // the same event arrived twice at once; the other one won
    throw error;
  }

  if (discountCode) await db.rpc("redeem_discount", { p_store: store.slug, p_code: discountCode });

  const site = await siteUrl();
  const buyer = session.customer_details?.email;

  if (buyer) {
    sendLater({
      to: buyer,
      idempotencyKey: `receipt-${session.id}`,
      ...receiptEmail({
        productName,
        storeName: store.name,
        amount,
        downloadUrl: token ? `${site}/download/${token}` : undefined,
        storeUrl: storeUrl(site, store.slug)
      })
    });
  }

  sendLater(async () => {
    const owner = await storeOwnerContact(db, store.slug);
    if (!owner?.wantsEmail) return null;
    const first = (await completedOrderCount(db, store.slug)) === 1;
    return {
      to: owner.email,
      idempotencyKey: `sale-${session.id}`,
      ...newSaleEmail({
        name: owner.name,
        storeName: store.name,
        productName,
        amount,
        share: creatorAmount,
        dashboardUrl: `${site}/dashboard/earnings`,
        first,
        manage: emailLinks(site, owner.id, "sales")
      })
    };
  });
}
