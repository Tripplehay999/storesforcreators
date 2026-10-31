import { NextResponse, type NextRequest } from "next/server";
import { siteUrl } from "@/lib/site";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/admin";
import { MAX_DOWNLOADS } from "@/lib/downloads";

// Counts one download, then redirects to a one-minute signed link for the private file.
export async function POST(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const site = await siteUrl();
  const page = `${site}/download/${encodeURIComponent(token)}`;

  if (!hasServiceRole() || !/^[A-Za-z0-9_-]{20,64}$/.test(token)) return NextResponse.redirect(page, 303);

  const db = createServiceClient();
  const { data: order } = await db
    .from("orders")
    .select("id, product_id, status, download_count, download_expires_at")
    .eq("download_token", token)
    .maybeSingle();

  const expired = order?.download_expires_at ? new Date(order.download_expires_at) < new Date() : false;
  if (!order || order.status !== "completed" || expired || order.download_count >= MAX_DOWNLOADS || !order.product_id) {
    return NextResponse.redirect(page, 303);
  }

  // Compare-and-set, so two clicks at once can't both use the last download.
  const { data: counted } = await db
    .from("orders")
    .update({ download_count: order.download_count + 1 })
    .eq("id", order.id)
    .eq("download_count", order.download_count)
    .select("id");

  if (!counted?.length) return NextResponse.redirect(page, 303);

  const { data: file } = await db.from("product_files").select("path, file_name").eq("product_id", order.product_id).maybeSingle();
  if (!file) return NextResponse.redirect(`${page}?error=file`, 303);

  const { data: signed, error } = await db.storage.from("product-files").createSignedUrl(file.path, 60, { download: file.file_name });
  if (error || !signed?.signedUrl) return NextResponse.redirect(`${page}?error=file`, 303);

  return NextResponse.redirect(signed.signedUrl, 303);
}
