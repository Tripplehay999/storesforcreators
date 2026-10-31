"use server";

import { AiError, aiConfigured, recommend, writeCaptions, type Captions, type Recommendations } from "@/lib/ai";
import { getDiscountCodes, getProductFiles, getVisits } from "@/lib/growth-data";
import { getOrders, getProducts, getSession, getViewedStore } from "@/lib/data";
import { isMissingSchema } from "@/lib/schema";
import { sourceLabel } from "@/lib/sources";
import { createClient } from "@/lib/supabase/server";
import type { Store } from "@/lib/types";

export type AiResult<T> = { ok: true; payload: T; createdAt: string } | { ok: false; error: string };

// Per store, per rolling 24 hours: keeps costs predictable.
const DAILY_LIMITS = { recommendations: 8, captions: 20 };

const DAY = 86400000;

async function authorise(storeSlug: string | undefined) {
  const session = await getSession();
  if (!session || session.profile.suspended) return null;
  const store = await getViewedStore(session, storeSlug);
  return store ? { session, store } : null;
}

/** Saved results double as the usage log for the daily limit. */
async function underLimit(storeSlug: string, kind: keyof typeof DAILY_LIMITS) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("ai_insights")
    .select("id", { count: "exact", head: true })
    .eq("store_slug", storeSlug)
    .eq("kind", kind)
    .gte("created_at", new Date(Date.now() - DAY).toISOString());

  if (isMissingSchema(error)) return "AI ideas need the latest database update (migration 004).";
  if (error) return "Couldn't check your AI usage. Please try again.";
  if ((count ?? 0) >= DAILY_LIMITS[kind]) return "You've used today's AI requests for this store. More tomorrow!";
  return null;
}

async function save(storeSlug: string, kind: keyof typeof DAILY_LIMITS, focus: string, payload: unknown, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_insights")
    .insert({ store_slug: storeSlug, kind, focus, payload, created_by: userId })
    .select("created_at")
    .single();
  return data?.created_at ?? new Date().toISOString();
}

function sum<T>(items: T[], pick: (item: T) => number) {
  return items.reduce((total, item) => total + pick(item), 0);
}

/** The numbers the advisor sees. Aggregates only: no customer details leave the database. */
async function storeContext(store: Store) {
  const storeSlug = store.slug;
  const now = Date.now();
  const last30 = new Date(now - 30 * DAY);
  const last60 = new Date(now - 60 * DAY);

  const [products, orders, visitData, codeData] = await Promise.all([
    getProducts(storeSlug),
    getOrders(storeSlug, last60),
    getVisits(storeSlug, last30),
    getDiscountCodes(storeSlug)
  ]);
  const files = await getProductFiles(products.map(product => product.id));

  const completed = orders.filter(order => order.status === "completed");
  const recent = completed.filter(order => new Date(order.createdAt) >= last30);
  const earlier = completed.filter(order => new Date(order.createdAt) < last30);
  const visits = visitData.visits;

  const sources = new Map<string, number>();
  visits.forEach(visit => sources.set(visit.source, (sources.get(visit.source) ?? 0) + visit.views));
  const totalVisits = sum(visits, visit => visit.views);

  return {
    store: {
      name: store.name,
      category: store.category,
      oneLineDescription: store.description,
      headline: `${store.headline} ${store.headlineEm}`.trim(),
      bio: store.bio,
      hasPortraitPhoto: Boolean(store.image),
      isPublic: store.published
    },
    last30Days: {
      orders: recent.length,
      sales: sum(recent, order => order.amount),
      creatorEarnings: sum(recent, order => order.creatorAmount),
      refunds: orders.filter(order => order.status === "refunded" && new Date(order.createdAt) >= last30).length,
      storeVisits: visitData.ready ? totalVisits : "not tracked yet",
      conversionRate: visitData.ready && totalVisits > 0 ? `${((recent.length / totalVisits) * 100).toFixed(1)}%` : "unknown",
      trafficSources: [...sources.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([source, views]) => ({ source: sourceLabel(source), visits: views }))
    },
    previous30Days: { orders: earlier.length, sales: sum(earlier, order => order.amount) },
    activeDiscountCodes: codeData.codes.filter(code => code.active).map(code => ({ code: code.code, percentOff: code.percentOff, uses: code.uses })),
    products: products.map(product => {
      const productOrders = recent.filter(order => order.productId === product.id);
      const productVisits = sum(visits.filter(visit => visit.productId === product.id), visit => visit.views);
      return {
        name: product.name,
        category: product.category,
        price: product.price,
        priceShownOnPage: product.priceLabel || undefined,
        tagline: product.tagline,
        descriptionLength: product.description.length,
        hasCoverImage: Boolean(product.image),
        galleryImages: product.gallery.length,
        features: product.features.length,
        faqs: product.faqs.length,
        hasDownloadFile: files.ready ? Boolean(files.files[product.id]) : "unknown",
        ordersLast30Days: productOrders.length,
        salesLast30Days: sum(productOrders, order => order.amount),
        productPageVisitsLast30Days: visitData.ready ? productVisits : "not tracked yet"
      };
    })
  };
}

export async function generateIdeas(storeSlug: string | undefined, focus: string): Promise<AiResult<Recommendations>> {
  if (!aiConfigured()) return { ok: false, error: "AI ideas aren't switched on for this site yet." };

  const access = await authorise(storeSlug);
  if (!access) return { ok: false, error: "You can only get ideas for your own store." };

  const cleanFocus = focus.trim().slice(0, 300);
  const limit = await underLimit(access.store.slug, "recommendations");
  if (limit) return { ok: false, error: limit };

  try {
    const ideas = await recommend(await storeContext(access.store), cleanFocus);
    // Keep the dashboard tidy even if the model returns more than asked.
    ideas.recommendations = ideas.recommendations.slice(0, 5);
    const createdAt = await save(access.store.slug, "recommendations", cleanFocus, ideas, access.session.profile.id);
    return { ok: true, payload: ideas, createdAt };
  } catch (error) {
    if (error instanceof AiError) return { ok: false, error: error.message };
    console.error("[ai] ideas failed:", error);
    return { ok: false, error: "Something went wrong generating ideas. Please try again." };
  }
}

const PLATFORMS = ["tiktok", "instagram", "x", "youtube", "email"] as const;

export async function generateCaptions(productId: string, platforms: string[], discountCode: string): Promise<AiResult<Captions>> {
  if (!aiConfigured()) return { ok: false, error: "AI captions aren't switched on for this site yet." };

  const session = await getSession();
  if (!session || session.profile.suspended) return { ok: false, error: "Please log in again." };

  const supabase = await createClient();
  const { data: row } = await supabase.from("products").select("store_slug").eq("id", productId).maybeSingle();
  // Resolves to the product's store for its owner or an admin; anyone else gets their own store, which won't match.
  const access = row ? await authorise(row.store_slug) : null;
  if (!access || access.store.slug !== row?.store_slug) return { ok: false, error: "You can only write captions for your own products." };

  const chosen = platforms.filter((platform): platform is (typeof PLATFORMS)[number] => (PLATFORMS as readonly string[]).includes(platform));
  if (chosen.length === 0) return { ok: false, error: "Pick at least one platform." };

  const limit = await underLimit(access.store.slug, "captions");
  if (limit) return { ok: false, error: limit };

  const product = (await getProducts(access.store.slug)).find(item => item.id === productId);
  if (!product) return { ok: false, error: "That product no longer exists." };

  try {
    const captions = await writeCaptions({
      storeName: access.store.name,
      creatorNiche: access.store.category,
      product: product.name,
      category: product.category,
      tagline: product.tagline,
      description: product.description,
      price: product.priceLabel || `$${product.price}`,
      whatsIncluded: product.features,
      discountCode: discountCode.trim().toUpperCase().slice(0, 24) || undefined
    }, chosen);
    const createdAt = await save(access.store.slug, "captions", product.name, captions, access.session.profile.id);
    return { ok: true, payload: captions, createdAt };
  } catch (error) {
    if (error instanceof AiError) return { ok: false, error: error.message };
    console.error("[ai] captions failed:", error);
    return { ok: false, error: "Something went wrong writing captions. Please try again." };
  }
}
