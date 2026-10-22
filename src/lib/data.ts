import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { rowToProduct, rowToStore, seedProducts, seedStores } from "./catalog";
import { createClient, isSupabaseConfigured } from "./supabase/server";
import type { Application, Order, Product, Profile, Store } from "./types";

// ── Public catalog ───────────────────────────────────────────

export const getStores = cache(async (): Promise<Store[]> => {
  if (!isSupabaseConfigured()) return seedStores;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("published", true)
    .order("created_at");

  if (error) throw error;
  return data.map(rowToStore);
});

export const getStore = cache(async (slug: string): Promise<Store | null> => {
  if (!isSupabaseConfigured()) return seedStores.find(store => store.slug === slug) ?? null;

  const supabase = await createClient();
  const { data } = await supabase.from("stores").select("*").eq("slug", slug).maybeSingle();

  return data ? rowToStore(data) : null;
});

export const getProducts = cache(async (storeSlug?: string): Promise<Product[]> => {
  if (!isSupabaseConfigured()) {
    return storeSlug ? seedProducts.filter(product => product.store === storeSlug) : seedProducts;
  }

  const supabase = await createClient();
  let query = supabase.from("products").select("*").order("created_at");

  if (storeSlug) query = query.eq("store_slug", storeSlug);

  const { data, error } = await query;

  if (error) throw error;
  return data.map(rowToProduct);
});

export const getProduct = cache(async (id: string): Promise<Product | null> => {
  if (!isSupabaseConfigured()) return seedProducts.find(product => product.id === id) ?? null;

  const supabase = await createClient();
  const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();

  return data ? rowToProduct(data) : null;
});

// ── Signed-in creator ────────────────────────────────────────

export type Session = {
  profile: Profile;
  store: Store | null;
};

export const getSession = cache(async (): Promise<Session | null> => {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: profile }, { data: store }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("stores").select("*").eq("owner_id", user.id).maybeSingle()
  ]);

  return {
    profile: {
      id: user.id,
      email: profile?.email ?? user.email ?? "",
      fullName: profile?.full_name ?? "",
      socialHandle: profile?.social_handle ?? "",
      role: profile?.role === "admin" ? "admin" : "creator",
      suspended: Boolean(profile?.suspended)
    },
    store: store ? rowToStore(store) : null
  };
});

export async function requireSession() {
  const session = await getSession();

  if (!session) redirect("/login");
  if (session.profile.suspended) redirect("/suspended");
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();

  if (session.profile.role !== "admin") redirect("/dashboard");
  return session;
}

/**
 * The store a dashboard page works on: your own, or — for admins opening a
 * creator's hub from the admin panel — the one named in ?store=.
 */
export async function getViewedStore(session: Session, slug?: string): Promise<Store | null> {
  if (slug && session.profile.role === "admin" && slug !== session.store?.slug) {
    return getStore(slug);
  }

  return session.store;
}

export async function getOrders(storeSlug: string, since: Date): Promise<Order[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("store_slug", storeSlug)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map(row => ({
    id: row.id,
    storeSlug: row.store_slug,
    productId: row.product_id,
    productName: row.product_name,
    amount: Number(row.amount),
    creatorAmount: Number(row.creator_amount),
    status: row.status,
    createdAt: row.created_at
  }));
}

export async function getApplications(): Promise<Application[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map(row => ({
    id: row.id,
    name: row.name,
    email: row.email,
    socialProfile: row.social_profile,
    followers: row.followers,
    niche: row.niche,
    message: row.message,
    status: row.status,
    createdAt: row.created_at
  }));
}
