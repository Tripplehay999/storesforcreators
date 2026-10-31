"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStoreBalance } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/data";
import { money } from "@/lib/format";
import { siteUrl } from "@/lib/site";
import { applicationDecisionEmail, newSaleEmail, payoutSentEmail } from "@/lib/email-templates";
import { sendLater, storeOwnerContact } from "@/lib/notify";
import { isMissingSchema } from "@/lib/schema";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AdminState = { ok?: boolean; error?: string; message?: string };

function text(formData: FormData, name: string, max = 200) {
  return String(formData.get(name) || "").trim().slice(0, max);
}

function amountOf(formData: FormData, name: string) {
  return Math.round(Number(formData.get(name)) * 100) / 100;
}

// Admin pages are small and always dynamic, so refresh the whole panel.
function refresh() {
  revalidatePath("/admin", "layout");
  revalidatePath("/dashboard", "layout");
}

// ── Users ────────────────────────────────────────────────────

export async function setUserRole(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.rpc("admin_set_role", {
    target: text(formData, "id"),
    new_role: text(formData, "role")
  });

  if (error) return { error: error.message };

  refresh();
  return { ok: true, message: "Role updated." };
}

// ── Stores ───────────────────────────────────────────────────

export async function updateStore(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const supabase = await createClient();
  const slug = text(formData, "slug");

  const { error } = await supabase.rpc("admin_update_store", {
    target: slug,
    new_share: Math.round(Number(formData.get("revenue_share"))),
    new_published: formData.get("published") === "on"
  });

  if (error) return { error: error.message };

  const name = text(formData, "name", 120);

  if (name) {
    const { error: nameError } = await supabase.from("stores").update({ name }).eq("slug", slug);
    if (nameError) return { error: "Saved share and visibility, but couldn't rename the store." };
  }

  refresh();
  revalidatePath("/");
  revalidatePath(`/store/${slug}`);
  return { ok: true, message: `Saved ${slug}.` };
}

export async function deleteStore(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const supabase = await createClient();
  const slug = text(formData, "slug");

  const { error } = await supabase.from("stores").delete().eq("slug", slug);

  if (error) return { error: "Couldn't delete that store." };

  refresh();
  revalidatePath("/");
  return { ok: true, message: `Deleted ${slug} and its products.` };
}

// ── Products ─────────────────────────────────────────────────

export async function deleteProductAdmin(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const supabase = await createClient();
  const id = text(formData, "id");

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) return { error: "Couldn't delete that product." };

  refresh();
  revalidatePath("/");
  return { ok: true, message: "Product deleted." };
}

// ── Orders ───────────────────────────────────────────────────

export async function recordOrder(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();

  const productId = text(formData, "product", 80);
  const amount = amountOf(formData, "amount");

  if (!(amount > 0 && amount < 100000)) return { error: "Enter an order amount." };

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("id, name, store_slug")
    .eq("id", productId)
    .maybeSingle();

  if (!product) return { error: "Choose a product." };

  const balance = await getStoreBalance(product.store_slug);
  const share = balance?.revenueShare ?? 50;

  const { error } = await supabase.from("orders").insert({
    store_slug: product.store_slug,
    product_id: product.id,
    product_name: product.name,
    customer_email: text(formData, "customer_email", 320) || null,
    amount,
    creator_amount: Math.round(amount * share) / 100
  });

  if (error) return { error: "Couldn't record that order." };

  const site = await siteUrl();
  const creatorAmount = Math.round(amount * share) / 100;
  sendLater(async () => {
    const owner = await storeOwnerContact(supabase, product.store_slug);
    if (!owner?.wantsEmail) return null;
    return {
      to: owner.email,
      ...newSaleEmail({
        name: owner.name,
        storeName: balance?.name ?? product.store_slug,
        productName: product.name,
        amount,
        share: creatorAmount,
        dashboardUrl: `${site}/dashboard/earnings`
      })
    };
  });

  refresh();
  return { ok: true, message: `Order recorded for ${product.name}.` };
}

export async function setOrderStatus(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const status = text(formData, "status");

  if (status !== "completed" && status !== "refunded") return { error: "Unknown status." };

  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ status }).eq("id", text(formData, "id"));

  if (error) return { error: "Couldn't update that order." };

  refresh();
  return { ok: true, message: status === "refunded" ? "Order refunded." : "Order restored." };
}

export async function deleteOrder(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("orders").delete().eq("id", text(formData, "id"));

  if (error) return { error: "Couldn't delete that order." };

  refresh();
  return { ok: true, message: "Order deleted." };
}

// ── Payouts ──────────────────────────────────────────────────

/** An error message if paying `amount` would take the store's balance below zero. */
async function exceedsBalance(slug: string, amount: number) {
  const balance = await getStoreBalance(slug);

  if (!balance) return "Choose a store.";
  if (amount > balance.balance + 0.005) {
    return `That's more than ${balance.name}'s available balance of ${money(balance.balance, 2)}.`;
  }
  return null;
}

async function notifyPayoutSent(storeSlug: string, amount: number, method: string, reference: string) {
  const supabase = await createClient();
  const site = await siteUrl();
  sendLater(async () => {
    const owner = await storeOwnerContact(supabase, storeSlug);
    if (!owner?.wantsEmail) return null;
    return { to: owner.email, ...payoutSentEmail({ name: owner.name, amount, method, reference, dashboardUrl: `${site}/dashboard/earnings` }) };
  });
}

/** Pay or decline a creator's payout request. Paying records the payout (balance-checked) and links it. */
export async function resolvePayoutRequest(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const supabase = await createClient();
  const id = text(formData, "id");
  const decision = text(formData, "decision");

  const { data: request, error: readError } = await supabase
    .from("payout_requests")
    .select("id, store_slug, amount, status")
    .eq("id", id)
    .maybeSingle();

  if (isMissingSchema(readError)) return { error: "Run migration 004 first." };
  if (!request || request.status !== "open") return { error: "That request has already been handled." };

  if (decision === "decline") {
    const { error } = await supabase
      .from("payout_requests")
      .update({ status: "declined", resolved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { error: "Couldn't decline that request." };
    refresh();
    return { ok: true, message: "Request declined." };
  }

  const amount = Number(request.amount);
  const overdraw = await exceedsBalance(request.store_slug, amount);
  if (overdraw) return { error: overdraw };

  const method = text(formData, "method", 60);
  const reference = text(formData, "reference");
  const { data: payout, error } = await supabase
    .from("payouts")
    .insert({ store_slug: request.store_slug, amount, method, reference, status: "paid", paid_at: new Date().toISOString() })
    .select("id")
    .single();

  if (error || !payout) return { error: "Couldn't record that payout." };

  await supabase
    .from("payout_requests")
    .update({ status: "paid", payout_id: payout.id, resolved_at: new Date().toISOString() })
    .eq("id", id);

  await notifyPayoutSent(request.store_slug, amount, method, reference);
  refresh();
  return { ok: true, message: `Paid ${money(amount, 2)}. We've emailed the creator.` };
}

export async function createPayout(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();

  const amount = amountOf(formData, "amount");

  if (!(amount > 0 && amount < 1000000)) return { error: "Enter a payout amount." };

  const supabase = await createClient();
  const markPaid = formData.get("paid") === "on";
  const store = text(formData, "store", 40);
  const overdraw = await exceedsBalance(store, amount);

  if (overdraw) return { error: overdraw };

  const { error } = await supabase.from("payouts").insert({
    store_slug: store,
    amount,
    method: text(formData, "method", 60),
    reference: text(formData, "reference"),
    note: text(formData, "note", 1000),
    status: markPaid ? "paid" : "pending",
    paid_at: markPaid ? new Date().toISOString() : null
  });

  if (error) return { error: "Couldn't create that payout." };

  if (markPaid) await notifyPayoutSent(store, amount, text(formData, "method", 60), text(formData, "reference"));

  refresh();
  return { ok: true, message: markPaid ? "Payout recorded as paid." : "Payout scheduled." };
}

export async function setPayoutStatus(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const status = text(formData, "status");

  if (!["pending", "paid", "cancelled"].includes(status)) return { error: "Unknown status." };

  const supabase = await createClient();
  const id = text(formData, "id");
  const { data: current } = await supabase
    .from("payouts")
    .select("store_slug, amount, status, paid_at")
    .eq("id", id)
    .maybeSingle();

  if (!current) return { error: "That payout no longer exists." };

  // Reopening a cancelled payout commits the money again.
  if (current.status === "cancelled" && status !== "cancelled") {
    const overdraw = await exceedsBalance(current.store_slug, Number(current.amount));
    if (overdraw) return { error: overdraw };
  }

  const { error } = await supabase
    .from("payouts")
    .update({
      status,
      // Keep the original paid date if it was already paid.
      paid_at: status === "paid" ? (current.paid_at ?? new Date().toISOString()) : null,
      ...(formData.has("reference") ? { reference: text(formData, "reference") } : {})
    })
    .eq("id", id);

  if (error) return { error: "Couldn't update that payout." };

  if (status === "paid" && current.status !== "paid") {
    const { data: payout } = await supabase.from("payouts").select("method, reference").eq("id", id).maybeSingle();
    await notifyPayoutSent(current.store_slug, Number(current.amount), payout?.method ?? "", payout?.reference ?? "");
  }

  refresh();
  return { ok: true, message: `Payout marked ${status}.` };
}

// ── Applications ─────────────────────────────────────────────

export async function setApplicationStatus(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const status = text(formData, "status");

  if (!["new", "reviewing", "accepted", "declined"].includes(status)) return { error: "Unknown status." };

  const supabase = await createClient();
  const id = text(formData, "id");
  const { data: before } = await supabase.from("applications").select("name, email, status").eq("id", id).maybeSingle();
  const { error } = await supabase.from("applications").update({ status }).eq("id", id);

  if (error) return { error: "Couldn't update that application." };

  // Tell the applicant when a decision is first made (not when an admin re-clicks it).
  if (before && before.status !== status && (status === "accepted" || status === "declined")) {
    const site = await siteUrl();
    sendLater({ to: before.email, ...applicationDecisionEmail({ name: before.name, accepted: status === "accepted", siteUrl: site }) });
  }

  refresh();
  return { ok: true, message: `Application marked ${status}.${status === "accepted" || status === "declined" ? " We've emailed them." : ""}` };
}

export async function deleteApplication(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("applications").delete().eq("id", text(formData, "id"));

  if (error) return { error: "Couldn't delete that application." };

  refresh();
  return { ok: true, message: "Application deleted." };
}

// ── User management ──────────────────────────────────────────

export async function updateUserProfile(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: text(formData, "full_name"),
      social_handle: text(formData, "social_handle")
    })
    .eq("id", text(formData, "id"));

  if (error) return { error: "Couldn't update that profile." };

  refresh();
  return { ok: true, message: "Profile updated." };
}

export async function setUserSuspended(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const supabase = await createClient();
  const suspend = formData.get("suspended") === "true";

  const { error } = await supabase.rpc("admin_set_suspended", {
    target: text(formData, "id"),
    value: suspend
  });

  if (error) return { error: error.message };

  refresh();
  return { ok: true, message: suspend ? "Account suspended." : "Account reactivated." };
}

export async function sendPasswordReset(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const supabase = await createClient();
  const email = text(formData, "email", 320);

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteUrl()}/auth/callback?next=/reset-password`
  });

  if (error) return { error: error.message };
  return { ok: true, message: `Password reset email sent to ${email}.` };
}

export async function confirmUserEmail(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();

  if (!hasServiceRole()) return { error: "Add SUPABASE_SERVICE_ROLE_KEY to enable this." };

  const { error } = await createServiceClient().auth.admin.updateUserById(text(formData, "id"), {
    email_confirm: true
  });

  if (error) return { error: error.message };
  return { ok: true, message: "Email marked as confirmed." };
}

export async function deleteUser(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const { profile } = await requireAdmin();
  const id = text(formData, "id");

  if (!hasServiceRole()) return { error: "Add SUPABASE_SERVICE_ROLE_KEY to enable this." };
  if (id === profile.id) return { error: "You can't delete your own account here." };

  const { error } = await createServiceClient().auth.admin.deleteUser(id);

  if (error) return { error: error.message };

  refresh();
  redirect("/admin/users");
}

// ── Balance adjustments ──────────────────────────────────────

export async function addAdjustment(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const { profile } = await requireAdmin();
  const magnitude = Math.abs(amountOf(formData, "amount"));
  const amount = formData.get("direction") === "debit" ? -magnitude : magnitude;
  const reason = text(formData, "reason", 300);

  if (!(magnitude > 0)) return { error: "Enter an amount." };
  if (!reason) return { error: "Add a reason so the creator's history makes sense." };

  const supabase = await createClient();
  const { error } = await supabase.from("balance_adjustments").insert({
    store_slug: text(formData, "store", 40),
    amount,
    reason,
    created_by: profile.id
  });

  if (error) return { error: "Couldn't save that adjustment." };

  refresh();
  return { ok: true, message: amount > 0 ? "Credit added." : "Deduction added." };
}

export async function deleteAdjustment(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("balance_adjustments").delete().eq("id", text(formData, "id"));

  if (error) return { error: "Couldn't remove that adjustment." };

  refresh();
  return { ok: true, message: "Adjustment removed." };
}

// ── Admin notes ──────────────────────────────────────────────

export async function addNote(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const { profile } = await requireAdmin();
  const body = text(formData, "body", 4000);

  if (!body) return { error: "Write a note first." };

  const supabase = await createClient();
  const { error } = await supabase.from("admin_notes").insert({
    user_id: text(formData, "user_id"),
    body,
    author_id: profile.id
  });

  if (error) return { error: "Couldn't save that note." };

  refresh();
  return { ok: true, message: "Note added." };
}

export async function deleteNote(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("admin_notes").delete().eq("id", text(formData, "id"));

  if (error) return { error: "Couldn't delete that note." };

  refresh();
  return { ok: true, message: "Note deleted." };
}
