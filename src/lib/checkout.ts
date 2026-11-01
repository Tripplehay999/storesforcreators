import "server-only";

import { cache } from "react";
import { getSession } from "./data";
import { isMissingSchema } from "./schema";
import { MIN_CHARGE_CENTS, stripeConfigured } from "./stripe";
import { createServiceClient, hasServiceRole } from "./supabase/admin";
import { createClient, isSupabaseConfigured } from "./supabase/server";
import type { Product, Store } from "./types";

/**
 * Checkout opens one store at a time (supabase/migrations/005_checkout_switch.sql):
 *   off     – no Buy button
 *   testing – only admins and the store's creator can buy, for a test purchase
 *   on      – anyone can buy
 */
export type CheckoutMode = "off" | "testing" | "on";

export const CHECKOUT_MODES: { value: CheckoutMode; label: string; hint: string }[] = [
  { value: "off", label: "Off", hint: "Visitors see “Checkout opens soon”." },
  { value: "testing", label: "Testing", hint: "Only admins and this store's creator can buy." },
  { value: "on", label: "On", hint: "Anyone can buy." }
];

function toMode(value: unknown): CheckoutMode {
  return value === "on" || value === "testing" ? value : "off";
}

/** True when Stripe is using test keys, so no real money moves. */
export function stripeTestMode() {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  return key.startsWith("sk_test_") || key.startsWith("rk_test_");
}

/** A store's switch. "off" until an admin changes it, or while the switch table doesn't exist yet. */
export const getCheckoutMode = cache(async (slug: string): Promise<CheckoutMode> => {
  if (!isSupabaseConfigured()) return "off";

  const supabase = await createClient();
  const { data, error } = await supabase.from("store_checkout").select("mode").eq("store_slug", slug).maybeSingle();

  if (error) {
    if (!isMissingSchema(error)) console.warn("[checkout] couldn't read checkout switch:", error.message);
    return "off";
  }
  return toMode(data?.mode);
});

/** Every store's switch, for the admin panel. `ready` is false until the switch table exists. */
export async function getCheckoutModes(): Promise<{ ready: boolean; modes: Map<string, CheckoutMode> }> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("store_checkout").select("store_slug, mode");

  if (error) {
    if (!isMissingSchema(error)) throw error;
    return { ready: false, modes: new Map() };
  }
  return { ready: true, modes: new Map(data.map(row => [row.store_slug as string, toMode(row.mode)])) };
}

export type CheckoutAccess = {
  /** This visitor may buy from this store right now. */
  open: boolean;
  /** Buying is only open to the creator and admins (show them a "testing" note). */
  testing: boolean;
};

/** Whether the current visitor can buy from a store. The checkout route checks this again on the server. */
export const checkoutAccess = cache(async (store: Store): Promise<CheckoutAccess> => {
  const closed = { open: false, testing: false };

  if (!stripeConfigured() || store.isDemo || !store.published) return closed;

  const mode = await getCheckoutMode(store.slug);
  if (mode === "on") return { open: true, testing: false };
  if (mode === "off") return closed;

  const session = await getSession();
  const insider = Boolean(
    session && !session.profile.suspended && (session.profile.role === "admin" || session.store?.slug === store.slug)
  );
  return insider ? { open: true, testing: true } : closed;
});

/** Stripe won't take charges under 50 cents, so very cheap or free products can't use checkout. */
export function chargeable(product: Product) {
  return Math.round(product.price * 100) >= MIN_CHARGE_CENTS;
}

/**
 * Which of these products have a download attached (shown as "Instant download").
 * Files are private, so this uses the server-only service client and returns ids only.
 */
export async function productsWithFiles(productIds: string[]): Promise<Set<string>> {
  if (productIds.length === 0 || !hasServiceRole()) return new Set();

  const { data, error } = await createServiceClient()
    .from("product_files")
    .select("product_id")
    .in("product_id", productIds);

  if (error) {
    if (!isMissingSchema(error)) console.warn("[checkout] couldn't read product files:", error.message);
    return new Set();
  }
  return new Set(data.map(row => row.product_id as string));
}
