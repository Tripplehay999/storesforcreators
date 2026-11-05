import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

// Signed links for "Unsubscribe" and "Email settings" in emails, so people can change what they get
// without logging in. The link carries the user's id plus a signature only this server can make,
// so nobody can change someone else's settings by editing the address.

/** The two optional kinds of email. Account emails (receipts, password resets) can't be switched off. */
export type EmailList = "tips" | "sales";

export const LIST_COLUMNS: Record<EmailList, "tips_emails" | "email_notifications"> = {
  tips: "tips_emails",
  sales: "email_notifications"
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function secret() {
  return process.env.EMAIL_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

function sign(userId: string) {
  return createHmac("sha256", secret()).update(`email-prefs:v1:${userId.toLowerCase()}`).digest("base64url");
}

/** False until the server has a key to sign links with (SUPABASE_SERVICE_ROLE_KEY). */
export function emailLinksAvailable() {
  return Boolean(secret());
}

export function preferencesToken(userId: string) {
  return `${userId}.${sign(userId)}`;
}

/** The user id a token belongs to, or null if it's malformed or the signature doesn't match. */
export function verifyPreferencesToken(token: string | null | undefined): string | null {
  if (!token || !emailLinksAvailable()) return null;

  const dot = token.lastIndexOf(".");
  const userId = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(sign(userId));

  if (dot < 0 || !UUID.test(userId)) return null;
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return userId;
}

/** Links for an optional email's footer and headers. Null when links can't be signed yet. */
export function emailLinks(site: string, userId: string, list: EmailList) {
  if (!emailLinksAvailable() || !UUID.test(userId)) return null;

  const token = encodeURIComponent(preferencesToken(userId));
  return {
    preferencesUrl: `${site}/email-preferences?t=${token}`,
    unsubscribeUrl: `${site}/api/email/unsubscribe?t=${token}&list=${list}`
  };
}
