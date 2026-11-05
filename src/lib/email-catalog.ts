import "server-only";

import type { Email } from "./email";
import { emailLinks } from "./email-links";
import {
  applicationDecisionEmail,
  applicationReceivedEmail,
  newApplicationEmail,
  newSaleEmail,
  payoutRequestedEmail,
  payoutSentEmail,
  receiptEmail,
  storeLiveEmail
} from "./email-templates";
import { ONBOARDING_EMAILS, sampleOnboardingEmail, type OnboardingKind } from "./onboarding";
import { storeUrl } from "@/lib/store-links";

// Every email the app sends, for Admin → Emails: what it is, who gets it, when, and a sample of it
// (filled in with the admin's own name and example amounts) to preview or send as a test.

type Me = { id: string; email: string; name: string };
type Sample = (me: Me, site: string) => Omit<Email, "to">;

export type CatalogEntry = { key: string; label: string; to: string; when: string; group: "Onboarding" | "Sales" | "Payouts" | "Applications"; sample: Sample };

const onboarding = (kind: OnboardingKind): CatalogEntry => ({
  key: kind,
  label: ONBOARDING_EMAILS[kind].label,
  to: "Creator",
  when: ONBOARDING_EMAILS[kind].when,
  group: "Onboarding",
  sample: (me, site) => sampleOnboardingEmail(kind, me, site)
});

export const EMAIL_CATALOG: CatalogEntry[] = [
  onboarding("welcome"),
  onboarding("nudge-store"),
  onboarding("nudge-product"),
  onboarding("nudge-publish"),
  onboarding("nudge-share"),
  {
    key: "store-live", label: "Your store is live", to: "Creator", when: "The first time their store is public", group: "Onboarding",
    sample: (me, site) => storeLiveEmail({ name: me.name, storeName: "Your Store", storeUrl: storeUrl(site, "your-store"), siteUrl: site })
  },
  {
    key: "first-sale", label: "First sale", to: "Creator", when: "Their store's very first sale (if sale emails are on)", group: "Sales",
    sample: (me, site) => newSaleEmail({ name: me.name, storeName: "Your Store", productName: "Sample guide", amount: 25, share: 12.5, dashboardUrl: `${site}/dashboard/earnings`, first: true, manage: emailLinks(site, me.id, "sales") })
  },
  {
    key: "sale", label: "You made a sale", to: "Creator", when: "Every sale after the first (if sale emails are on)", group: "Sales",
    sample: (me, site) => newSaleEmail({ name: me.name, storeName: "Your Store", productName: "Sample guide", amount: 25, share: 12.5, dashboardUrl: `${site}/dashboard/earnings`, manage: emailLinks(site, me.id, "sales") })
  },
  {
    key: "receipt", label: "Receipt and download", to: "Buyer", when: "Right after they pay", group: "Sales",
    sample: (_me, site) => receiptEmail({ productName: "Sample guide", storeName: "Your Store", amount: 25, downloadUrl: `${site}/download/sample-link-for-preview-only`, storeUrl: storeUrl(site, "your-store") })
  },
  {
    key: "payout-sent", label: "Payout sent", to: "Creator", when: "When an admin records a payout (if sale emails are on)", group: "Payouts",
    sample: (me, site) => payoutSentEmail({ name: me.name, amount: 120, method: "PayPal", reference: "Sample reference", dashboardUrl: `${site}/dashboard/earnings`, manage: emailLinks(site, me.id, "sales") })
  },
  {
    key: "payout-requested", label: "Payout request", to: "Admins", when: "When a creator asks to be paid", group: "Payouts",
    sample: (_me, site) => payoutRequestedEmail({ storeName: "Your Store", amount: 120, method: "PayPal", adminUrl: `${site}/admin/payouts` })
  },
  {
    key: "application-received", label: "Application received", to: "Applicant", when: "Right after they apply", group: "Applications",
    sample: (me, site) => applicationReceivedEmail({ name: me.name, siteUrl: site })
  },
  {
    key: "new-application", label: "New application", to: "Admins", when: "When someone applies", group: "Applications",
    sample: (me, site) => newApplicationEmail({ name: me.name, email: me.email, social: "@yourhandle", followers: "10K–50K", niche: "Fitness", message: "This is a sample application message.", adminUrl: `${site}/admin/applications` })
  },
  {
    key: "application-accepted", label: "Application accepted", to: "Applicant", when: "When an admin marks it accepted", group: "Applications",
    sample: (me, site) => applicationDecisionEmail({ name: me.name, accepted: true, siteUrl: site })
  },
  {
    key: "application-declined", label: "Application declined", to: "Applicant", when: "When an admin marks it declined", group: "Applications",
    sample: (me, site) => applicationDecisionEmail({ name: me.name, accepted: false, siteUrl: site })
  }
];

export function catalogEntry(key: string) {
  return EMAIL_CATALOG.find(entry => entry.key === key) ?? null;
}
