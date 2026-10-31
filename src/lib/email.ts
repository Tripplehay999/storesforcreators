import "server-only";

// Transactional email through Resend (https://resend.com). Off until RESEND_API_KEY and EMAIL_FROM
// are set; until then sends are skipped and logged, and nothing else in the app is affected.

export type Email = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /** Resend ignores a repeat send with the same key, so retries can't double-email someone. */
  idempotencyKey?: string;
};

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

/** Admin addresses for "new application" and "payout requested" alerts (comma-separated ADMIN_EMAILS). */
export function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "").split(",").map(address => address.trim()).filter(Boolean);
}

export async function sendEmail(email: Email): Promise<{ ok: boolean; error?: string }> {
  const recipients = (Array.isArray(email.to) ? email.to : [email.to]).filter(Boolean);
  if (recipients.length === 0) return { ok: false, error: "No recipient" };

  if (!emailConfigured()) {
    console.info(`[email] skipped (RESEND_API_KEY / EMAIL_FROM not set): "${email.subject}" to ${recipients.join(", ")}`);
    return { ok: false, error: "Email isn't configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        ...(email.idempotencyKey ? { "Idempotency-Key": email.idempotencyKey } : {})
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: recipients,
        subject: email.subject,
        html: email.html,
        text: email.text,
        ...(email.replyTo || process.env.EMAIL_REPLY_TO ? { reply_to: email.replyTo ?? process.env.EMAIL_REPLY_TO } : {})
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error(`[email] Resend ${response.status} for "${email.subject}": ${detail.slice(0, 300)}`);
      return { ok: false, error: `Resend returned ${response.status}` };
    }

    return { ok: true };
  } catch (error) {
    console.error(`[email] failed to send "${email.subject}":`, error);
    return { ok: false, error: "Network error" };
  }
}
