"use server";

import { revalidatePath } from "next/cache";
import { normalizeProduct, productToRow, safeColor, safeImage, slugify } from "@/lib/catalog";
import { getSession, requireSession } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

export type FormState = { ok?: boolean; error?: string; message?: string };
export type Result = { ok: true } | { ok: false; error: string };

function text(formData: FormData, name: string, max: number) {
  return String(formData.get(name) || "").trim().slice(0, max);
}

function revalidateStore(slug: string) {
  revalidatePath("/");
  revalidatePath(`/store/${slug}`);
  revalidatePath("/dashboard", "layout");
}

// ── Profile & store ──────────────────────────────────────────

export async function saveProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: text(formData, "full_name", 200),
      social_handle: text(formData, "social_handle", 200)
    })
    .eq("id", session.profile.id);

  if (error) return { error: "We couldn't save your profile. Please try again." };

  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Profile saved." };
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
    published: formData.get("published") === "on"
  };

  if (!fields.name) return { error: "Give your store a name." };

  if (session.store) {
    const { error } = await supabase.from("stores").update(fields).eq("slug", session.store.slug);

    if (error) return { error: "We couldn't save your store. Please try again." };

    revalidateStore(session.store.slug);
    return { ok: true, message: "Store saved." };
  }

  const slug = slugify(formData.get("slug"), 40);

  if (slug.length < 2) return { error: "Choose a store URL with at least 2 letters or numbers." };

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
  return { ok: true, message: "Your store is live! Next, add your first product." };
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
