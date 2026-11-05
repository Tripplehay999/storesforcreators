"use server";

import { revalidatePath } from "next/cache";
import type { AdminState } from "@/app/admin/actions";
import { CONTACT_LIST } from "@/lib/contact";
import { requireAdmin } from "@/lib/data";
import { emailConfigured, sendEmail } from "@/lib/email";
import { catalogEntry } from "@/lib/email-catalog";
import { emailLayout, esc } from "@/lib/email-templates";
import { runOnboarding } from "@/lib/onboarding";
import { siteUrl } from "@/lib/site";

const NOT_CONNECTED = "Email isn't connected yet, so nothing can be sent. Finish \"Email setup\" at the top of this page first.";

/** Sends a sample of one of the site's emails to the admin's own inbox. */
export async function sendTestEmail(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const { profile } = await requireAdmin();
  const entry = catalogEntry(String(formData.get("key") || ""));

  if (!entry) return { error: "We don't know that email." };
  if (!emailConfigured()) return { error: NOT_CONNECTED };

  const site = await siteUrl();
  const sample = entry.sample({ id: profile.id, email: profile.email, name: profile.fullName || "there" }, site);
  const result = await sendEmail({ ...sample, to: profile.email, subject: `[Test] ${sample.subject}` });

  return result.ok
    ? { ok: true, message: `Sent "${entry.label}" to ${profile.email}. It can take a minute to arrive.` }
    : { error: `That didn't send (${result.error}). Check "Email setup" above.` };
}

/** Sends a short email to one of the business addresses, to prove mail to it reaches your inbox. */
export async function testAddress(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const { profile } = await requireAdmin();
  const address = String(formData.get("address") || "");

  if (!CONTACT_LIST.some(item => item.address === address)) return { error: "We don't know that address." };
  if (!emailConfigured()) return { error: NOT_CONNECTED };

  const sentAt = new Date().toLocaleString("en-CA", { timeZone: process.env.NEXT_PUBLIC_TIME_ZONE || "America/Toronto" });
  const result = await sendEmail({
    to: address,
    replyTo: profile.email,
    subject: `Test: is ${address} working?`,
    html: emailLayout({
      preheader: `Mail sent to ${address} is reaching you.`,
      tag: "Test",
      heading: "It works!",
      mark: `${address.split("@")[0]}@ is set up.`,
      body: `If you're reading this in your own inbox, mail sent to <strong style="color:#1c1722;">${esc(address)}</strong> is reaching you.`,
      footnote: `Sent from Admin → Emails on ${esc(sentAt)}.`
    }),
    text: `If you're reading this in your own inbox, mail sent to ${address} is reaching you.\n\nSent from Admin → Emails on ${sentAt}.`
  });

  return result.ok
    ? { ok: true, message: `Sent a test to ${address}. If it doesn't reach your inbox within a few minutes, check its route in Cloudflare → Email Routing.` }
    : { error: `That didn't send (${result.error}).` };
}

/** Runs the daily onboarding emails now, instead of waiting for the scheduled run. */
export async function sendDueOnboardingEmails(): Promise<AdminState> {
  await requireAdmin();
  const result = await runOnboarding(await siteUrl());

  revalidatePath("/admin/emails");
  if (!result.ok) return { error: result.error };
  if (result.sent === 0 && result.failed === 0) return { ok: true, message: "Nobody is due an onboarding email right now." };
  return {
    ok: true,
    message: `Sent ${result.sent} onboarding email${result.sent === 1 ? "" : "s"}.${result.failed ? ` ${result.failed} didn't send and will be retried on the next run.` : ""}`
  };
}
