import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT } from "@/lib/contact";
import { verifyPreferencesToken } from "@/lib/email-links";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/admin";
import { updateEmailPreferences } from "./actions";

export const metadata: Metadata = { title: "Email settings | Stores for Creators", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ t?: string; unsubscribe?: string; status?: string }> };

const LISTS = {
  tips: { name: "tips and reminders", title: "Tips and reminders", text: "A few short emails while you set up your store, only for steps you haven't done yet." },
  sales: { name: "sale and payout emails", title: "Sale and payout emails", text: "An email each time you make a sale, and when we send you a payout." }
};

/** "tripp@gmail.com" → "tr•••@gmail.com", so a forwarded link doesn't show the whole address. */
function masked(email: string) {
  const [name, domain] = email.split("@");
  return domain ? `${name.slice(0, 2)}•••@${domain}` : "your account";
}

// Opened from "Email settings" or "Unsubscribe" at the bottom of an email. No login needed: the link
// is signed for one account (see email-links.ts).
export default async function EmailPreferencesPage({ searchParams }: Props) {
  const { t: token, unsubscribe, status } = await searchParams;
  const userId = verifyPreferencesToken(token);
  const profile = userId && hasServiceRole()
    ? (await createServiceClient().from("profiles").select("*").eq("id", userId).maybeSingle()).data
    : null;

  if (!profile) {
    return (
      <main className="order-page">
        <section className="order-card">
          <span className="order-badge" aria-hidden="true">!</span>
          <h1>This link doesn&apos;t work</h1>
          <p>Open the full link from the bottom of one of our emails. Or log in and change your email settings under <strong>Storefront → Your account</strong>.</p>
          <Link className="btn btn-dark" href={`/login?next=${encodeURIComponent("/dashboard/store#account")}`}>Log in</Link>
          <Link className="order-home" href="/">Back to Stores for Creators</Link>
        </section>
      </main>
    );
  }

  const sales = profile.email_notifications !== false;
  const tips = profile.tips_emails !== false;
  const tipsAvailable = "tips_emails" in profile;
  const list = unsubscribe === "sales" || (unsubscribe === "tips" && tipsAvailable) ? unsubscribe : null;
  const done = status?.startsWith("unsubscribed-") ? LISTS[status.slice(13) as keyof typeof LISTS] : null;
  const alreadyOff = list && (list === "tips" ? !tips : !sales);

  return (
    <main className="order-page">
      <section className="order-card">
        <span className="order-badge" aria-hidden="true">✉</span>

        {done ? (
          <>
            <h1>You&apos;re unsubscribed</h1>
            <p>We won&apos;t send you {done.name} any more. You can turn them back on below at any time.</p>
          </>
        ) : list && !alreadyOff ? (
          <>
            <h1>Unsubscribe?</h1>
            <p>Stop getting <strong>{LISTS[list].name}</strong> at {masked(profile.email)}.</p>
            <form className="prefs-form" action={updateEmailPreferences}>
              <input type="hidden" name="t" value={token} />
              <input type="hidden" name="unsubscribe" value={list} />
              <button className="btn btn-dark" type="submit">Yes, unsubscribe me</button>
            </form>
            <p className="prefs-note">Or choose exactly what you get:</p>
          </>
        ) : (
          <>
            <h1>Email settings</h1>
            <p>Choose what we send to {masked(profile.email)}.</p>
          </>
        )}

        {status === "saved" && <p className="prefs-ok" role="status">Saved. Your email settings are updated.</p>}
        {status === "error" && <p className="order-error" role="alert">We couldn&apos;t save that. Please try again.</p>}

        <form className="prefs-form" action={updateEmailPreferences}>
          <input type="hidden" name="t" value={token} />
          <label className="prefs-option">
            <input type="checkbox" name="sales" defaultChecked={sales} />
            <span><strong>{LISTS.sales.title}</strong><small>{LISTS.sales.text}</small></span>
          </label>
          {tipsAvailable && (
            <label className="prefs-option">
              <input type="checkbox" name="tips" defaultChecked={tips} />
              <span><strong>{LISTS.tips.title}</strong><small>{LISTS.tips.text}</small></span>
            </label>
          )}
          <button className="btn btn-dark" type="submit">Save my settings</button>
        </form>

        <p className="prefs-note">
          Emails about your account and orders, like password resets and receipts, always come through.
          Questions? Write to <a href={`mailto:${CONTACT.support}`}>{CONTACT.support}</a>.
        </p>
        <Link className="order-home" href="/">Back to Stores for Creators</Link>
      </section>
    </main>
  );
}
