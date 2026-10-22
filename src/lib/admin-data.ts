import "server-only";

import { createClient } from "./supabase/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export type StoreBalance = {
  slug: string;
  name: string;
  ownerId: string | null;
  revenueShare: number;
  published: boolean;
  isDemo: boolean;
  createdAt: string;
  gross: number;
  earned: number;
  orderCount: number;
  paidOut: number;
  pendingPayouts: number;
  adjustments: number;
  balance: number;
  productCount: number;
};

export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  socialHandle: string;
  role: "creator" | "admin";
  suspended: boolean;
  createdAt: string;
  store: { slug: string; name: string } | null;
};

export type Adjustment = {
  id: string;
  storeSlug: string;
  amount: number;
  reason: string;
  createdAt: string;
};

export type AdminNote = {
  id: string;
  body: string;
  authorName: string;
  createdAt: string;
};

export type AdminOrder = {
  id: string;
  storeSlug: string;
  productName: string;
  customerEmail: string | null;
  amount: number;
  creatorAmount: number;
  status: "completed" | "refunded";
  createdAt: string;
};

export type Payout = {
  id: string;
  storeSlug: string;
  amount: number;
  status: "pending" | "paid" | "cancelled";
  method: string;
  reference: string;
  note: string;
  createdAt: string;
  paidAt: string | null;
};

function rowToBalance(row: any): StoreBalance {
  return {
    slug: row.slug,
    name: row.name,
    ownerId: row.owner_id,
    revenueShare: Number(row.revenue_share),
    published: Boolean(row.published),
    isDemo: Boolean(row.is_demo),
    createdAt: row.created_at,
    gross: Number(row.gross),
    earned: Number(row.earned),
    orderCount: Number(row.order_count),
    paidOut: Number(row.paid_out),
    pendingPayouts: Number(row.pending_payouts),
    adjustments: Number(row.adjustments ?? 0),
    balance: Number(row.balance),
    productCount: Number(row.product_count)
  };
}

function rowToOrder(row: any): AdminOrder {
  return {
    id: row.id,
    storeSlug: row.store_slug,
    productName: row.product_name,
    customerEmail: row.customer_email,
    amount: Number(row.amount),
    creatorAmount: Number(row.creator_amount),
    status: row.status,
    createdAt: row.created_at
  };
}

export async function getStoreBalances(): Promise<StoreBalance[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("store_balances").select("*").order("created_at");

  if (error) throw error;
  return data.map(rowToBalance);
}

export async function getUsers(search?: string): Promise<AdminUser[]> {
  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select("*, stores(slug, name)")
    .order("created_at", { ascending: false });

  if (search) {
    const term = search.replace(/[%,()]/g, "");
    query = query.or(`email.ilike.%${term}%,full_name.ilike.%${term}%`);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data.map(rowToUser);
}

function rowToUser(row: any): AdminUser {
  const store = Array.isArray(row.stores) ? row.stores[0] : row.stores;

  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    socialHandle: row.social_handle,
    role: row.role,
    suspended: Boolean(row.suspended),
    createdAt: row.created_at,
    store: store ? { slug: store.slug, name: store.name } : null
  };
}

export async function getUser(id: string): Promise<AdminUser | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*, stores(slug, name)")
    .eq("id", id)
    .maybeSingle();

  return data ? rowToUser(data) : null;
}

export async function getAdjustments(storeSlug: string): Promise<Adjustment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("balance_adjustments")
    .select("*")
    .eq("store_slug", storeSlug)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map(row => ({
    id: row.id,
    storeSlug: row.store_slug,
    amount: Number(row.amount),
    reason: row.reason,
    createdAt: row.created_at
  }));
}

export async function getNotes(userId: string): Promise<AdminNote[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admin_notes")
    .select("*, author:profiles!admin_notes_author_id_fkey(full_name, email)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map(row => ({
    id: row.id,
    body: row.body,
    authorName: row.author?.full_name || row.author?.email || "Admin",
    createdAt: row.created_at
  }));
}

export async function getApplicationsByEmail(email: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select("id, status, followers, niche, created_at")
    .ilike("email", email)
    .order("created_at", { ascending: false });

  return (data ?? []).map(row => ({
    id: row.id as string,
    status: row.status as string,
    followers: row.followers as string,
    niche: row.niche as string,
    createdAt: row.created_at as string
  }));
}

export async function getAllOrders(filters: { store?: string; status?: string; limit?: number } = {}): Promise<AdminOrder[]> {
  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 200);

  if (filters.store) query = query.eq("store_slug", filters.store);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;

  if (error) throw error;
  return data.map(rowToOrder);
}

export async function getOrdersSince(since: Date): Promise<AdminOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .gte("created_at", since.toISOString())
    .order("created_at");

  if (error) throw error;
  return data.map(rowToOrder);
}

export async function getPayouts(filters: { store?: string; status?: string } = {}): Promise<Payout[]> {
  const supabase = await createClient();
  let query = supabase.from("payouts").select("*").order("created_at", { ascending: false }).limit(300);

  if (filters.store) query = query.eq("store_slug", filters.store);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;

  if (error) throw error;

  return data.map(row => ({
    id: row.id,
    storeSlug: row.store_slug,
    amount: Number(row.amount),
    status: row.status,
    method: row.method,
    reference: row.reference,
    note: row.note,
    createdAt: row.created_at,
    paidAt: row.paid_at
  }));
}

export async function getCounts() {
  const supabase = await createClient();
  const count = async (table: string, apply?: (query: any) => any) => {
    let query = supabase.from(table).select("*", { count: "exact", head: true });
    if (apply) query = apply(query);
    const { count: total } = await query;
    return total ?? 0;
  };

  const [users, admins, newApplications, pendingPayouts] = await Promise.all([
    count("profiles"),
    count("profiles", query => query.eq("role", "admin")),
    count("applications", query => query.eq("status", "new")),
    count("payouts", query => query.eq("status", "pending"))
  ]);

  return { users, admins, newApplications, pendingPayouts };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
