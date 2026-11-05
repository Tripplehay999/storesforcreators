import "server-only";

import { Resolver } from "node:dns/promises";
import { MAIL_DOMAIN } from "./contact";
import { adminEmails, emailConfigured } from "./email";
import { emailLinksAvailable } from "./email-links";
import { hasServiceRole } from "./supabase/admin";

// Live checks for Admin → Emails: real DNS lookups of the domain and, when the key allows it,
// Resend's own verification status. Plain-language results, never keys.

export type SetupCheck = { label: string; state: "ok" | "todo" | "warn"; text: string; fix?: string };

function resolver() {
  const dns = new Resolver({ timeout: 3000, tries: 2 });
  dns.setServers(["1.1.1.1", "8.8.8.8"]);
  return dns;
}

async function txt(name: string) {
  try {
    return (await resolver().resolveTxt(name)).map(parts => parts.join(""));
  } catch {
    return [];
  }
}

async function mx(name: string) {
  try {
    return (await resolver().resolveMx(name)).sort((a, b) => a.priority - b.priority).map(record => record.exchange.toLowerCase());
  } catch {
    return [];
  }
}

function mailProvider(hosts: string[]) {
  const all = hosts.join(" ");
  if (all.includes("mx.cloudflare.net")) return "Cloudflare Email Routing";
  if (all.includes("google.com") || all.includes("googlemail.com")) return "Google Workspace";
  if (all.includes("zoho")) return "Zoho Mail";
  if (all.includes("outlook.com")) return "Microsoft 365";
  return hosts[0] ?? "";
}

/** "Stores for Creators <hello@site.com>" → "hello@site.com" */
export function senderAddress() {
  const from = process.env.EMAIL_FROM ?? "";
  return (from.match(/<([^>]+)>/)?.[1] ?? from).trim();
}

type ResendDomain = { name: string; status: string };

/** Resend's verification status for the domain, or null if the key can't read domains (sending-only keys can't). */
async function resendDomainStatus(): Promise<string | null> {
  if (!process.env.RESEND_API_KEY) return null;
  try {
    const response = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      cache: "no-store",
      signal: AbortSignal.timeout(4000)
    });
    if (!response.ok) return null;
    const body = await response.json() as { data?: ResendDomain[] };
    return body.data?.find(domain => domain.name.toLowerCase() === MAIL_DOMAIN)?.status ?? "missing";
  } catch {
    return null;
  }
}

export async function checkEmailSetup(): Promise<{ checks: SetupCheck[]; receiving: boolean; provider: string }> {
  const sender = senderAddress();
  const senderDomain = sender.split("@")[1]?.toLowerCase() ?? "";

  const [mxHosts, rootTxt, dmarc, dkim, resendStatus] = await Promise.all([
    mx(MAIL_DOMAIN),
    txt(MAIL_DOMAIN),
    txt(`_dmarc.${MAIL_DOMAIN}`),
    txt(`resend._domainkey.${MAIL_DOMAIN}`),
    resendDomainStatus()
  ]);

  const provider = mailProvider(mxHosts);
  const receiving = mxHosts.length > 0;
  const spf = rootTxt.find(record => record.toLowerCase().startsWith("v=spf1"));
  const dmarcRecord = dmarc.find(record => record.toLowerCase().startsWith("v=dmarc1"));
  const verified = resendStatus === "verified" || (resendStatus === null && dkim.length > 0);

  const checks: SetupCheck[] = [
    {
      label: "Receiving email",
      state: receiving ? "ok" : "todo",
      text: receiving ? `On, through ${provider}. Mail to @${MAIL_DOMAIN} addresses is delivered.` : `Off. Mail sent to any @${MAIL_DOMAIN} address bounces right now.`,
      fix: receiving ? undefined : "Turn on Email Routing in Cloudflare (step 1 below)."
    },
    {
      label: "Sending service (Resend)",
      state: emailConfigured() ? "ok" : "todo",
      text: emailConfigured() ? "Connected." : "Not connected. No emails are being sent; they're skipped and logged.",
      fix: emailConfigured() ? undefined : "Add RESEND_API_KEY and EMAIL_FROM in Vercel (step 2 below)."
    },
    {
      label: "Domain verified for sending",
      state: verified ? "ok" : "todo",
      text: resendStatus === "verified"
        ? `${MAIL_DOMAIN} is verified in Resend.`
        : resendStatus === "missing"
          ? `${MAIL_DOMAIN} hasn't been added in Resend yet.`
          : resendStatus
            ? `Resend says: ${resendStatus.replace(/_/g, " ")}. DNS changes can take up to an hour.`
            : dkim.length > 0 ? "Resend's signing record is in place." : "Resend's signing record isn't in the DNS yet.",
      fix: verified ? undefined : `In Resend → Domains, add ${MAIL_DOMAIN} and copy its records into Cloudflare DNS (step 2 below).`
    },
    {
      label: "Sender address",
      state: !sender ? "todo" : senderDomain === MAIL_DOMAIN ? "ok" : "warn",
      text: !sender ? "Not set." : `Emails come from ${sender}.`,
      fix: !sender
        ? `Set EMAIL_FROM to Stores for Creators <hello@${MAIL_DOMAIN}>.`
        : senderDomain === MAIL_DOMAIN ? undefined : `Use an @${MAIL_DOMAIN} address so emails match your domain.`
    },
    {
      label: "Replies go to",
      state: process.env.EMAIL_REPLY_TO || sender ? "ok" : "todo",
      text: process.env.EMAIL_REPLY_TO ? process.env.EMAIL_REPLY_TO : sender ? `${sender} (the sender address)` : "Nowhere yet."
    },
    {
      label: "Spam protection (SPF)",
      state: spf ? "ok" : "todo",
      text: spf ? "In place." : "Missing.",
      fix: spf ? undefined : "Turning on Cloudflare Email Routing adds it for you."
    },
    {
      label: "Spoofing protection (DMARC)",
      state: dmarcRecord ? "ok" : "warn",
      text: dmarcRecord ? "In place." : "Missing. Gmail and Yahoo are more likely to send your emails to spam without it.",
      fix: dmarcRecord ? undefined : `Add a TXT record named _dmarc with the value v=DMARC1; p=none; (step 3 below).`
    },
    {
      label: "Admin alerts",
      state: adminEmails().length ? "ok" : "warn",
      text: adminEmails().length ? `New applications and payout requests go to ${adminEmails().join(", ")}.` : "Nobody gets alerts about new applications or payout requests.",
      fix: adminEmails().length ? undefined : "Set ADMIN_EMAILS in Vercel to the address(es) that should get them."
    },
    {
      label: "Daily onboarding emails",
      state: process.env.CRON_SECRET && hasServiceRole() ? "ok" : "todo",
      text: process.env.CRON_SECRET && hasServiceRole() ? "On. Runs every day at about 10 am Toronto time." : "Off.",
      fix: process.env.CRON_SECRET && hasServiceRole() ? undefined : "Add CRON_SECRET in Vercel (any long random text), then redeploy."
    },
    {
      label: "Unsubscribe links",
      state: emailLinksAvailable() ? "ok" : "todo",
      text: emailLinksAvailable() ? "On. Optional emails have Email settings and Unsubscribe links." : "Off until SUPABASE_SERVICE_ROLE_KEY is set."
    },
    {
      label: "Links in emails",
      state: process.env.NEXT_PUBLIC_SITE_URL ? "ok" : "warn",
      text: process.env.NEXT_PUBLIC_SITE_URL ? `Point to ${process.env.NEXT_PUBLIC_SITE_URL}.` : "Use whichever address the request came in on.",
      fix: process.env.NEXT_PUBLIC_SITE_URL ? undefined : `Set NEXT_PUBLIC_SITE_URL to https://www.${MAIL_DOMAIN} in Vercel.`
    }
  ];

  return { checks, receiving, provider };
}
