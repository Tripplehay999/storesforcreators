import "server-only";

import { sendEmail, emailConfigured, type Email } from "./email";
import { emailLinks } from "./email-links";
import { nudgeProductEmail, nudgePublishEmail, nudgeShareEmail, nudgeStoreEmail, welcomeEmail } from "./email-templates";
import { isMissingSchema } from "./schema";
import { createServiceClient, hasServiceRole } from "./supabase/admin";
import { storeUrl } from "@/lib/store-links";

// The welcome series. "welcome" goes out when someone confirms their email; the four follow-ups are
// picked by the daily run (/api/cron/onboarding, or "Send due emails now" on Admin → Emails).
// Each email goes to a person at most once (email_log, migration 007), at most one every 2 days,
// and only while the step it's about is still undone. Creators can switch these off.

/** Where sign-up confirmations land (signUp, submitApplication and the confirm-signup template). */
export const WELCOME_PATH = "/dashboard?notice=welcome";

export const ONBOARDING_EMAILS = {
  welcome: { label: "Welcome", when: "As soon as they confirm their email" },
  "nudge-store": { label: "Create your store", when: "2 days after signing up, if they have no store" },
  "nudge-product": { label: "Add your first product", when: "2 days after making their store, if it has no products" },
  "nudge-publish": { label: "Your store is hidden", when: "3 days after making their store, if it has products but is hidden" },
  "nudge-share": { label: "Get your first sale", when: "5 days after making their store, if it's public with products but no sales" }
} as const;

export type OnboardingKind = keyof typeof ONBOARDING_EMAILS;

/** One row from onboarding_candidates() (migration 007). */
export type Candidate = {
  user_id: string;
  email: string;
  full_name: string;
  joined_at: string;
  store_slug: string | null;
  store_name: string | null;
  store_created_at: string | null;
  store_published: boolean | null;
  product_count: number | null;
  order_count: number | null;
  sent: string[];
  last_sent_at: string | null;
};

const DAY = 24 * 60 * 60 * 1000;
const GAP_DAYS = 2;

function daysSince(timestamp: string | null, now: Date) {
  return timestamp ? (now.getTime() - Date.parse(timestamp)) / DAY : 0;
}

/** The follow-up this person is due today, or null. */
export function dueEmail(candidate: Candidate, now = new Date()): OnboardingKind | null {
  if (candidate.last_sent_at && daysSince(candidate.last_sent_at, now) < GAP_DAYS) return null;

  const sent = new Set(candidate.sent);
  const due = (kind: OnboardingKind, ready: boolean) => (ready && !sent.has(kind) ? kind : null);
  const storeAge = daysSince(candidate.store_created_at, now);

  if (!candidate.store_slug) return due("nudge-store", daysSince(candidate.joined_at, now) >= 2);
  if (!candidate.product_count) return due("nudge-product", storeAge >= 2);
  if (!candidate.store_published) return due("nudge-publish", storeAge >= 3);
  if (!candidate.order_count) return due("nudge-share", storeAge >= 5);
  return null;
}

function buildEmail(kind: OnboardingKind, candidate: Candidate, site: string): Email {
  const manage = emailLinks(site, candidate.user_id, "tips");
  const base = { name: candidate.full_name, siteUrl: site, manage };
  const storeName = candidate.store_name ?? "Your store";
  const template = (() => {
    switch (kind) {
      case "welcome": return welcomeEmail({ ...base, hasStore: Boolean(candidate.store_slug) });
      case "nudge-store": return nudgeStoreEmail(base);
      case "nudge-product": return nudgeProductEmail({ ...base, storeName });
      case "nudge-publish": return nudgePublishEmail({ ...base, storeName, productCount: candidate.product_count ?? 0 });
      case "nudge-share": return nudgeShareEmail({ ...base, storeName, storeUrl: storeUrl(site, candidate.store_slug ?? "") });
    }
  })();

  return { to: candidate.email, ...template };
}

type Db = ReturnType<typeof createServiceClient>;

/** Records the email as sent before sending, so two runs at once can't both send it. */
async function claim(db: Db, userId: string, kind: string): Promise<"claimed" | "taken" | "no-log"> {
  const { error } = await db.from("email_log").insert({ user_id: userId, kind });
  if (!error) return "claimed";
  if (error.code === "23505") return "taken";
  if (isMissingSchema(error)) return "no-log";
  throw new Error(`email_log: ${error.message}`);
}

async function release(db: Db, userId: string, kind: string) {
  await db.from("email_log").delete().eq("user_id", userId).eq("kind", kind);
}

/**
 * Sends an email a person should only ever get once (welcome, "your store is live"). Without the
 * service key or migration 007 it still sends, de-duplicated by Resend for 24 hours.
 */
export async function sendOnce(userId: string, kind: string, build: () => Email | Promise<Email>) {
  const idempotencyKey = `${kind}-${userId}`;

  if (!hasServiceRole()) {
    await sendEmail({ ...(await build()), idempotencyKey });
    return;
  }

  const db = createServiceClient();
  const claimed = await claim(db, userId, kind);
  if (claimed === "taken") return;

  const result = await sendEmail({ ...(await build()), idempotencyKey });
  if (!result.ok && claimed === "claimed") await release(db, userId, kind);
}

/** The welcome email, once per person. Called right after someone confirms their account. */
export async function sendWelcome(user: { id: string; email: string; name: string }, site: string) {
  if (!user.email) return;

  await sendOnce(user.id, "welcome", async () => {
    const store = hasServiceRole()
      ? (await createServiceClient().from("stores").select("slug").eq("owner_id", user.id).maybeSingle()).data
      : null;

    return buildEmail("welcome", {
      user_id: user.id, email: user.email, full_name: user.name, joined_at: new Date().toISOString(),
      store_slug: store?.slug ?? null, store_name: null, store_created_at: null, store_published: null,
      product_count: null, order_count: null, sent: [], last_sent_at: null
    }, site);
  });
}

export type OnboardingPlan =
  | { ok: false; error: string }
  | { ok: true; checked: number; due: { candidate: Candidate; kind: OnboardingKind }[] };

/** Who is due which follow-up right now. Doesn't send anything. */
export async function planOnboarding(now = new Date()): Promise<OnboardingPlan> {
  if (!hasServiceRole()) return { ok: false, error: "The server's Supabase service key isn't set (SUPABASE_SERVICE_ROLE_KEY)." };

  const { data, error } = await createServiceClient().rpc("onboarding_candidates");
  if (error) {
    return { ok: false, error: isMissingSchema(error) ? "Run supabase/migrations/007_onboarding_emails.sql in Supabase first." : error.message };
  }

  const candidates = (data ?? []) as Candidate[];
  const due = candidates
    .map(candidate => ({ candidate, kind: dueEmail(candidate, now) }))
    .filter((item): item is { candidate: Candidate; kind: OnboardingKind } => item.kind !== null);

  return { ok: true, checked: candidates.length, due };
}

export type OnboardingRun =
  | { ok: false; error: string }
  | { ok: true; checked: number; sent: number; failed: number; skipped: number };

/** Sends every follow-up that's due. Safe to run more than once a day. */
export async function runOnboarding(site: string): Promise<OnboardingRun> {
  if (!emailConfigured()) return { ok: false, error: "Email isn't connected yet (RESEND_API_KEY and EMAIL_FROM)." };

  const plan = await planOnboarding();
  if (!plan.ok) return { ok: false, error: plan.error };

  const db = createServiceClient();
  let sent = 0, failed = 0, skipped = 0;

  for (const { candidate, kind } of plan.due) {
    const claimed = await claim(db, candidate.user_id, kind);
    if (claimed !== "claimed") { skipped++; continue; }

    const result = await sendEmail(buildEmail(kind, candidate, site));
    if (result.ok) {
      sent++;
    } else {
      failed++;
      await release(db, candidate.user_id, kind); // try again on the next run
    }

    // Resend allows a few emails a second; stay well under it.
    await new Promise(resolve => setTimeout(resolve, 600));
  }

  return { ok: true, checked: plan.checked, sent, failed, skipped };
}

/** A sample of each onboarding email, for previews and test sends on Admin → Emails. */
export function sampleOnboardingEmail(kind: OnboardingKind, to: { id: string; email: string; name: string }, site: string): Email {
  const now = Date.now();
  return buildEmail(kind, {
    user_id: to.id, email: to.email, full_name: to.name, joined_at: new Date(now - 3 * DAY).toISOString(),
    store_slug: "your-store", store_name: "Your Store", store_created_at: new Date(now - 6 * DAY).toISOString(),
    store_published: kind !== "nudge-publish", product_count: 2, order_count: 0, sent: [], last_sent_at: null
  }, site);
}
