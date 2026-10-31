import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

// Stripe Checkout through Stripe's REST API. Off until STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are set;
// until then products show "Checkout opens soon" instead of a Buy button.

const API = "https://api.stripe.com/v1";

/** Stripe's minimum charge in USD. */
export const MIN_CHARGE_CENTS = 50;

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

type FormValue = string | number | boolean | undefined | null | FormValue[] | { [key: string]: FormValue };

/** Stripe's form encoding: nested keys become line_items[0][price_data][currency]=usd. */
export function encodeForm(value: Record<string, FormValue>) {
  const params = new URLSearchParams();

  const add = (key: string, item: FormValue) => {
    if (item === undefined || item === null || item === "") return;
    if (Array.isArray(item)) item.forEach((entry, index) => add(`${key}[${index}]`, entry));
    else if (typeof item === "object") Object.entries(item).forEach(([child, entry]) => add(`${key}[${child}]`, entry));
    else params.append(key, String(item));
  };

  Object.entries(value).forEach(([key, item]) => add(key, item));
  return params;
}

async function stripe<T>(path: string, init: { method?: string; body?: URLSearchParams; idempotencyKey?: string } = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      ...(init.body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      ...(init.idempotencyKey ? { "Idempotency-Key": init.idempotencyKey } : {})
    },
    body: init.body,
    cache: "no-store"
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Stripe ${response.status}: ${data?.error?.message ?? "request failed"}`);
  }
  return data as T;
}

export type CheckoutSession = {
  id: string;
  url: string | null;
  status: string;
  payment_status: "paid" | "unpaid" | "no_payment_required";
  amount_total: number | null;
  currency: string | null;
  payment_intent: string | null;
  customer_details: { email: string | null; name: string | null } | null;
  metadata: Record<string, string>;
};

export async function createCheckoutSession(input: {
  productId: string;
  storeSlug: string;
  name: string;
  description?: string;
  image?: string;
  unitAmountCents: number;
  discountCode?: string;
  discountCents?: number;
  successUrl: string;
  cancelUrl: string;
}) {
  const metadata = {
    product_id: input.productId,
    store_slug: input.storeSlug,
    discount_code: input.discountCode ?? "",
    discount_cents: String(input.discountCents ?? 0)
  };

  return stripe<CheckoutSession>("/checkout/sessions", {
    method: "POST",
    body: encodeForm({
      mode: "payment",
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: input.unitAmountCents,
          product_data: {
            name: input.name.slice(0, 250),
            description: input.description?.slice(0, 500),
            images: input.image?.startsWith("https://") ? [input.image] : undefined
          }
        }
      }],
      metadata,
      payment_intent_data: { metadata },
      // Receipts and the delivery email go to whatever address the buyer types at checkout.
      customer_creation: "if_required",
      billing_address_collection: "auto"
    })
  });
}

export function getCheckoutSession(id: string) {
  return stripe<CheckoutSession>(`/checkout/sessions/${encodeURIComponent(id)}`);
}

export type StripeEvent = {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
};

/**
 * Verifies a webhook's Stripe-Signature header (HMAC-SHA256 of "timestamp.body") and returns the event.
 * Rejects events older than `toleranceSeconds` so captured requests can't be replayed later.
 */
export function verifyWebhook(rawBody: string, header: string | null, secret: string, toleranceSeconds = 300, now = Date.now()): StripeEvent {
  if (!header) throw new Error("Missing Stripe-Signature header");

  const parts = header.split(",").map(part => part.split("=") as [string, string]);
  const timestamp = Number(parts.find(([key]) => key === "t")?.[1]);
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value);

  if (!Number.isFinite(timestamp) || signatures.length === 0) throw new Error("Malformed Stripe-Signature header");
  if (Math.abs(now / 1000 - timestamp) > toleranceSeconds) throw new Error("Webhook timestamp outside tolerance");

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`, "utf8").digest();
  const valid = signatures.some(signature => {
    const given = Buffer.from(signature, "hex");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });

  if (!valid) throw new Error("Invalid webhook signature");
  return JSON.parse(rawBody) as StripeEvent;
}

/** Price after a percent-off code, in cents. */
export function discountedCents(priceCents: number, percentOff: number) {
  return Math.round(priceCents * (100 - percentOff) / 100);
}
