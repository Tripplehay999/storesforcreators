"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { normalizeProduct, productToRow, safeColor, safeImage, slugify } from "@/lib/catalog";
import { getSession, getViewedStore, requireSession, type Session } from "@/lib/data";
import { adminEmails } from "@/lib/email";
import { payoutRequestedEmail, storeLiveEmail } from "@/lib/email-templates";
import { endOfDayInZone, money } from "@/lib/format";
import { sendLater } from "@/lib/notify";
import { sendOnce } from "@/lib/onboarding";
import { isMissingSchema } from "@/lib/schema";
import { siteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";
import { isReservedSlug, storePath, storeUrl } from "@/lib/store-links";

export type FormState = { ok?: boolean; error?: string; message?: string };
export type Result = { ok: true } | { ok: false; error: string };

function text(formData: FormData, name: string, max: number) {
  return String(formData.get(name) || "").trim().slice(0, max);
}

function revalidateStore(slug: string) {
  revalidatePath("/");
  revalidatePath(storePath(slug));
  revalidatePath("/dashboard", "layout");
}

// ── Profile & store ──────────────────────────────────────────

export async function saveProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  const supabase = await createClient();
  const update: Record<string, string | boolean> = {
    full_name: text(formData, "full_name", 200),
    social_handle: text(formData, "social_handle", 200),
    email_notifications: formData.get("email_notifications") === "on",
    tips_emails: formData.get("tips_emails") === "on"
  };

  let { error } = await supabase.from("profiles").update(update).eq("id", session.profile.id);

  // Databases before migration 007 have no tips switch yet: save everything else.
  if (error && isMissingSchema(error)) {
    delete update.tips_emails;
    ({ error } = await supabase.from("profiles").update(update).eq("id", session.profile.id));
  }

  if (error) return { error: "We couldn't save your profile. Please try again." };

  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Saved." };
}

function featuredId(value: FormDataEntryValue | null) {
  const id = String(value || "").trim();
  return /^[a-z0-9-]{1,80}$/.test(id) ? id : null;
}

export async function saveStore(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  const supabase = await createClient();

  const fields = {
    name: text(formData, "name", 120),
    short: text(formData, "short", 60),
    category: text(formData, "category", 80).toUpperCase(),
    description: text(formData, "description", 300),
    headline: text(formData, "headline", 80),
    headline_em: text(formData, "headline_em", 80),
    bio: text(formData, "bio", 600),
    image: safeImage(formData.get("image")),
    label: text(formData, "label", 40).toUpperCase(),
    background: safeColor(formData.get("background"), "#f6eaf1"),
    published: formData.get("published") === "on",
    // Only sent once the store has products. The store page ignores ids that aren't its own products.
    ...(formData.has("featured_product_id") && { featured_product_id: featuredId(formData.get("featured_product_id")) })
  };

  if (!fields.name) return { error: "Give your store a name." };

  if (session.store) {
    const { error } = await supabase.from("stores").update(fields).eq("slug", session.store.slug);

    if (error) return { error: "We couldn't save your store. Please try again." };

    revalidateStore(session.store.slug);

    if (fields.published && !session.store.published) {
      await announceStoreLive(session, session.store.slug, fields.name);
      return { ok: true, message: "Saved. Your store is public now." };
    }
    return { ok: true, message: "Store saved." };
  }

  const slug = slugify(formData.get("slug"), 40);

  if (slug.length < 2) return { error: "Choose a store URL with at least 2 letters or numbers." };
  if (isReservedSlug(slug)) return { error: `"${slug}" is one of our own pages, so it can't be a store address. Try your name or handle.` };

  const { error } = await supabase
    .from("stores")
    .insert({ ...fields, slug, owner_id: session.profile.id });

  if (error) {
    return {
      error: error.code === "23505"
        ? "That store URL is already taken — try another."
        : "We couldn't create your store. Please try again."
    };
  }

  revalidateStore(slug);

  if (fields.published) await announceStoreLive(session, slug, fields.name);

  return {
    ok: true,
    message: fields.published ? "Your store is live! Next, add your first product." : "Store created. Make it public when you're ready."
  };
}

/** "Your store is live" email, the first time a creator's store is public (once per person). */
async function announceStoreLive(session: Session, slug: string, storeName: string) {
  const site = await siteUrl();
  const supabase = await createClient();
  const { profile } = session;

  after(() => sendOnce(profile.id, "store-live", async () => {
    const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("store_slug", slug);
    return {
      to: profile.email,
      ...storeLiveEmail({ name: profile.fullName, storeName, storeUrl: storeUrl(site, slug), siteUrl: site, hasProducts: (count ?? 0) > 0 })
    };
  }).catch(error => console.error("[store-live] couldn't send:", error)));
}

// ── Products (studio) ────────────────────────────────────────

async function canManage(storeSlug: string) {
  const session = await getSession();

  if (!session) return false;
  return session.profile.role === "admin" || session.store?.slug === storeSlug;
}

export async function saveProduct(input: Product): Promise<Result> {
  const product = normalizeProduct(input);

  if (!(await canManage(product.store))) {
    return { ok: false, error: "You can only edit products in your own store." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("products").upsert(productToRow(product));

  if (error) return { ok: false, error: "We couldn't save this product. Please try again." };

  revalidateStore(product.store);
  revalidatePath(`/product/${product.id}`);
  return { ok: true };
}

export async function deleteProduct(id: string, storeSlug: string): Promise<Result> {
  if (!(await canManage(storeSlug))) {
    return { ok: false, error: "You can only delete products in your own store." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id).eq("store_slug", storeSlug);

  if (error) return { ok: false, error: "We couldn't delete this product." };

  revalidateStore(storeSlug);
  return { ok: true };
}

export async function importProducts(input: Product[]): Promise<Result> {
  const session = await requireSession();
  const isAdmin = session.profile.role === "admin";

  if (!Array.isArray(input) || input.length === 0 || input.length > 200) {
    return { ok: false, error: "Choose a catalog with 1–200 products." };
  }

  if (!isAdmin && !session.store) {
    return { ok: false, error: "Create your store before importing products." };
  }

  const products = input.map(item => {
    const product = normalizeProduct(item);
    // Creators can only import into their own store.
    return isAdmin && product.store ? product : { ...product, store: session.store!.slug };
  });

  if (new Set(products.map(product => product.id)).size !== products.length) {
    return { ok: false, error: "The catalog contains duplicate product IDs." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("products").upsert(products.map(productToRow));

  if (error) return { ok: false, error: "Import failed. Some products may belong to another store." };

  new Set(products.map(product => product.store)).forEach(revalidateStore);
  return { ok: true };
}

// ── Digital delivery ─────────────────────────────────────────

// Shown when a feature's database tables don't exist yet. Setup details live in the README, not the UI.
const MIGRATION_HINT = "This isn't available yet. Please try again later.";

/** Points a product at a file already uploaded to the private product-files bucket (in the uploader's folder). */
export async function attachProductFile(productId: string, storeSlug: string, path: string, fileName: string, sizeBytes: number): Promise<Result> {
  const session = await getSession();
  if (!session || !(await canManage(storeSlug))) return { ok: false, error: "You can only add files to your own products." };
  if (!path.startsWith(`${session.profile.id}/`)) return { ok: false, error: "That upload doesn't belong to you." };

  const supabase = await createClient();
  const { data: previous, error: readError } = await supabase.from("product_files").select("path").eq("product_id", productId).maybeSingle();
  if (isMissingSchema(readError)) return { ok: false, error: MIGRATION_HINT };

  const { error } = await supabase.from("product_files").upsert({
    product_id: productId,
    path,
    file_name: fileName.slice(0, 200),
    size_bytes: Math.max(0, Math.round(sizeBytes)),
    updated_at: new Date().toISOString()
  });

  if (error) return { ok: false, error: isMissingSchema(error) ? MIGRATION_HINT : "We couldn't attach that file. Please try again." };

  // Replacing a file: tidy up the old one (best effort).
  if (previous?.path && previous.path !== path) await supabase.storage.from("product-files").remove([previous.path]);
  return { ok: true };
}

export async function removeProductFile(productId: string, storeSlug: string): Promise<Result> {
  if (!(await canManage(storeSlug))) return { ok: false, error: "You can only change your own products." };

  const supabase = await createClient();
  const { data: file } = await supabase.from("product_files").select("path").eq("product_id", productId).maybeSingle();
  const { error } = await supabase.from("product_files").delete().eq("product_id", productId);

  if (error) return { ok: false, error: isMissingSchema(error) ? MIGRATION_HINT : "We couldn't remove that file." };
  if (file?.path) await supabase.storage.from("product-files").remove([file.path]);
  return { ok: true };
}

// ── Discount codes ───────────────────────────────────────────

async function storeFor(formData: FormData) {
  const session = await requireSession();
  return getViewedStore(session, text(formData, "store", 40) || undefined);
}

export async function createDiscountCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const store = await storeFor(formData);
  if (!store) return { error: "Create your store first." };

  const code = text(formData, "code", 24).toUpperCase().replace(/\s+/g, "");
  const percentOff = Math.round(Number(formData.get("percent_off")));
  const maxUsesRaw = text(formData, "max_uses", 6);
  const maxUses = maxUsesRaw ? Math.round(Number(maxUsesRaw)) : null;
  const ends = text(formData, "expires", 10);
  const expiresAt = ends ? endOfDayInZone(ends) : null;

  if (!/^[A-Z0-9_-]{3,24}$/.test(code)) return { error: "Codes are 3 to 24 letters, numbers, dashes or underscores." };
  if (!(percentOff >= 1 && percentOff <= 90)) return { error: "Choose a discount between 1% and 90%." };
  if (maxUses !== null && !(maxUses >= 1)) return { error: "The use limit must be at least 1, or leave it blank." };
  if (ends && !expiresAt) return { error: "Choose a valid end date." };
  if (expiresAt && expiresAt < new Date()) return { error: "The end date is in the past." };

  const supabase = await createClient();
  const { error } = await supabase.from("discount_codes").insert({
    store_slug: store.slug,
    code,
    percent_off: percentOff,
    max_uses: maxUses,
    expires_at: expiresAt?.toISOString() ?? null
  });

  if (error) {
    if (isMissingSchema(error)) return { error: MIGRATION_HINT };
    return { error: error.code === "23505" ? `You already have a code called ${code}.` : "We couldn't create that code. Please try again." };
  }

  revalidatePath("/dashboard/promote");
  return { ok: true, message: `${code} is live: ${percentOff}% off.` };
}

export async function setDiscountActive(id: string, storeSlug: string, active: boolean): Promise<Result> {
  if (!(await canManage(storeSlug))) return { ok: false, error: "You can only change your own codes." };

  const supabase = await createClient();
  const { error } = await supabase.from("discount_codes").update({ active }).eq("id", id).eq("store_slug", storeSlug);
  if (error) return { ok: false, error: "We couldn't update that code." };

  revalidatePath("/dashboard/promote");
  return { ok: true };
}

export async function deleteDiscountCode(id: string, storeSlug: string): Promise<Result> {
  if (!(await canManage(storeSlug))) return { ok: false, error: "You can only delete your own codes." };

  const supabase = await createClient();
  const { error } = await supabase.from("discount_codes").delete().eq("id", id).eq("store_slug", storeSlug);
  if (error) return { ok: false, error: "We couldn't delete that code." };

  revalidatePath("/dashboard/promote");
  return { ok: true };
}

// ── Payouts ──────────────────────────────────────────────────

const PAYOUT_METHODS = ["", "paypal", "etransfer", "bank", "other"];

export async function savePayoutSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  const method = text(formData, "payout_method", 20);
  const details = text(formData, "payout_details", 500);

  if (!PAYOUT_METHODS.includes(method)) return { error: "Choose how you'd like to be paid." };
  if (method && !details) return { error: "Add the details we need to pay you, like your PayPal email." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ payout_method: method, payout_details: details })
    .eq("id", session.profile.id);

  if (error) return { error: isMissingSchema(error) ? MIGRATION_HINT : "We couldn't save your payout details." };

  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Saved." };
}

const METHOD_LABELS: Record<string, string> = { paypal: "PayPal", etransfer: "Interac e-Transfer", bank: "bank transfer", other: "other" };

export async function requestPayout(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  if (!session.store) return { error: "Create your store first." };
  if (!session.profile.payoutMethod) return { error: "First tell us how you'd like to be paid, below." };

  const amount = Math.round(Number(formData.get("amount")) * 100) / 100;
  if (!(amount > 0)) return { error: "Enter an amount." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("request_payout", {
    p_store: session.store.slug,
    p_amount: amount,
    p_note: text(formData, "note", 500)
  });

  if (error) {
    if (isMissingSchema(error)) return { error: MIGRATION_HINT };
    // The database explains itself ("more than your available balance", "already have a request").
    return { error: error.message || "We couldn't send that request." };
  }

  const site = await siteUrl();
  const admins = adminEmails();
  if (admins.length) {
    sendLater({
      to: admins,
      ...payoutRequestedEmail({
        storeName: session.store.name,
        amount,
        method: METHOD_LABELS[session.profile.payoutMethod] ?? "",
        adminUrl: `${site}/admin/payouts`
      })
    });
  }

  revalidatePath("/dashboard", "layout");
  return { ok: true, message: `Requested ${money(amount, 2)}. We'll email you when it's sent.` };
}

export async function cancelPayoutRequest(id: string): Promise<Result> {
  await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_payout_request", { p_id: id });
  if (error) return { ok: false, error: "We couldn't cancel that request." };

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
