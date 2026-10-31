import "server-only";

import { isMissingSchema } from "./schema";
import { createClient } from "./supabase/server";

// Loaders for the features added in migration 004. Each reports `ready: false` (instead of throwing)
// when that migration hasn't been run, so pages can show a setup hint.

export type DiscountCode = {
  id: string;
  code: string;
  percentOff: number;
  maxUses: number | null;
  uses: number;
  expiresAt: string | null;
  active: boolean;
};

export type Visit = { productId: string; hour: string; source: string; views: number };

export type PayoutRequest = {
  id: string;
  storeSlug: string;
  amount: number;
  note: string;
  status: "open" | "paid" | "declined" | "cancelled";
  createdAt: string;
  resolvedAt: string | null;
};

export type ProductFile = { fileName: string; sizeBytes: number; path: string };

export type Insight<T> = { payload: T; createdAt: string; focus: string };

export async function getDiscountCodes(storeSlug: string): Promise<{ ready: boolean; codes: DiscountCode[] }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("discount_codes")
    .select("*")
    .eq("store_slug", storeSlug)
    .order("created_at", { ascending: false });

  if (isMissingSchema(error)) return { ready: false, codes: [] };
  if (error) throw error;

  return {
    ready: true,
    codes: data.map(row => ({
      id: row.id,
      code: row.code,
      percentOff: row.percent_off,
      maxUses: row.max_uses,
      uses: row.uses,
      expiresAt: row.expires_at,
      active: row.active
    }))
  };
}

export async function getVisits(storeSlug: string, since: Date): Promise<{ ready: boolean; visits: Visit[] }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_visits")
    .select("product_id, hour, source, views")
    .eq("store_slug", storeSlug)
    .gte("hour", since.toISOString())
    .limit(20000);

  if (isMissingSchema(error)) return { ready: false, visits: [] };
  if (error) throw error;

  return {
    ready: true,
    visits: data.map(row => ({ productId: row.product_id, hour: row.hour, source: row.source, views: row.views }))
  };
}

function rowToRequest(row: Record<string, unknown>): PayoutRequest {
  return {
    id: String(row.id),
    storeSlug: String(row.store_slug),
    amount: Number(row.amount),
    note: String(row.note ?? ""),
    status: row.status as PayoutRequest["status"],
    createdAt: String(row.created_at),
    resolvedAt: (row.resolved_at as string | null) ?? null
  };
}

/** A store's payout requests (newest first), or every open request for admins (storeSlug omitted). */
export async function getPayoutRequests(storeSlug?: string): Promise<{ ready: boolean; requests: PayoutRequest[] }> {
  const supabase = await createClient();
  let query = supabase.from("payout_requests").select("*").order("created_at", { ascending: false }).limit(100);
  query = storeSlug ? query.eq("store_slug", storeSlug) : query.eq("status", "open");

  const { data, error } = await query;

  if (isMissingSchema(error)) return { ready: false, requests: [] };
  if (error) throw error;
  return { ready: true, requests: data.map(rowToRequest) };
}

export async function getProductFiles(productIds: string[]): Promise<{ ready: boolean; files: Record<string, ProductFile> }> {
  if (productIds.length === 0) return { ready: true, files: {} };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_files")
    .select("product_id, path, file_name, size_bytes")
    .in("product_id", productIds);

  if (isMissingSchema(error)) return { ready: false, files: {} };
  if (error) throw error;

  return {
    ready: true,
    files: Object.fromEntries(data.map(row => [row.product_id, { path: row.path, fileName: row.file_name, sizeBytes: Number(row.size_bytes) }]))
  };
}

export async function getLatestInsight<T>(storeSlug: string, kind: "recommendations" | "captions"): Promise<{ ready: boolean; insight: Insight<T> | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_insights")
    .select("payload, created_at, focus")
    .eq("store_slug", storeSlug)
    .eq("kind", kind)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (isMissingSchema(error)) return { ready: false, insight: null };
  if (error) throw error;

  return { ready: true, insight: data ? { payload: data.payload as T, createdAt: data.created_at, focus: data.focus } : null };
}
