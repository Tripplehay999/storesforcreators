import { NextResponse, type NextRequest } from "next/server";
import { productLink } from "@/lib/catalog";
import { getProduct, getStore } from "@/lib/data";
import { siteUrl } from "@/lib/site";
import { createCheckoutSession, discountedCents, MIN_CHARGE_CENTS, stripeConfigured } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

// Buy button target: validates the product and any discount code, then hands off to Stripe Checkout.
// Prices always come from the database, never from the form.
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const productId = String(form.get("product_id") || "").slice(0, 80);
  const code = String(form.get("code") || "").trim().toUpperCase().slice(0, 24);
  const site = await siteUrl();

  const back = (reason: string, extra = "") =>
    NextResponse.redirect(`${site}/product/${encodeURIComponent(productId)}?checkout=${reason}${extra}`, 303);

  if (!stripeConfigured()) return back("unavailable");

  const product = productId ? await getProduct(productId) : null;
  if (!product) return back("unavailable");

  const store = await getStore(product.store);
  if (!store || store.isDemo || !store.published) return back("unavailable");

  const priceCents = Math.round(product.price * 100);
  let percentOff = 0;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("check_discount", { p_store: store.slug, p_code: code });
    if (error || !data) return back("bad-code", `&code=${encodeURIComponent(code)}`);
    percentOff = Number(data);
  }

  const totalCents = percentOff ? discountedCents(priceCents, percentOff) : priceCents;
  if (totalCents < MIN_CHARGE_CENTS) return back("unavailable");

  try {
    const session = await createCheckoutSession({
      productId: product.id,
      storeSlug: store.slug,
      name: product.name,
      description: product.tagline || undefined,
      image: product.image,
      unitAmountCents: totalCents,
      discountCode: percentOff ? code : undefined,
      discountCents: priceCents - totalCents,
      successUrl: `${site}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${site}${productLink(product, store.slug)}`
    });

    if (!session.url) return back("error");
    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    console.error("[checkout] couldn't create session:", error);
    return back("error");
  }
}
