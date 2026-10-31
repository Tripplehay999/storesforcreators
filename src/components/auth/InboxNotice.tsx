"use client";

import { useState } from "react";
import { resendConfirmation } from "@/app/(auth)/actions";
import Icon from "@/components/hub/Icon";

const COPY = {
  confirm: { title: "Check your inbox", lead: "We sent a link to confirm your account to", after: "Open it to finish setting up." },
  magic: { title: "Check your inbox", lead: "If there's an account for", after: "you'll get a login link in a moment. It works once." },
  reset: { title: "Check your inbox", lead: "If there's an account for", after: "you'll get a link to choose a new password." }
};

// One-tap shortcuts to the big webmail inboxes.
const INBOXES: [RegExp, string, string][] = [
  [/@(gmail|googlemail)\.com$/i, "Gmail", "https://mail.google.com/mail/u/0/#inbox"],
  [/@(outlook|hotmail|live|msn)\.[a-z.]+$/i, "Outlook", "https://outlook.live.com/mail/0/inbox"],
  [/@(yahoo|ymail)\.[a-z.]+$/i, "Yahoo Mail", "https://mail.yahoo.com"],
  [/@(icloud|me|mac)\.com$/i, "iCloud Mail", "https://www.icloud.com/mail"],
  [/@(proton\.me|protonmail\.com|pm\.me)$/i, "Proton Mail", "https://mail.proton.me"]
];

export default function InboxNotice({ email, kind }: { email: string; kind: keyof typeof COPY }) {
  const copy = COPY[kind];
  const inbox = INBOXES.find(([pattern]) => pattern.test(email));
  const [status, setStatus] = useState<{ sending: boolean; message?: string; ok?: boolean }>({ sending: false });
  const [cooldown, setCooldown] = useState(false);

  async function resend() {
    setStatus({ sending: true });
    const result = await resendConfirmation(email);
    setStatus({ sending: false, message: result.message, ok: result.ok });
    setCooldown(true);
    setTimeout(() => setCooldown(false), 30000);
  }

  return (
    <div className="au-inbox" role="status">
      <span className="au-inbox-icon"><Icon name="mail" size={26} /></span>
      <h2>{copy.title}</h2>
      <p>{copy.lead} <strong>{email}</strong>{kind === "confirm" ? "." : ","} {copy.after}</p>

      {inbox && (
        <a className="au-submit" href={inbox[2]} target="_blank" rel="noreferrer">
          Open {inbox[1]} <Icon name="external" size={16} />
        </a>
      )}

      <ul className="au-inbox-tips">
        <li>It can take a minute to arrive.</li>
        <li>Not there? Check your spam or promotions folder.</li>
      </ul>

      <div className="au-inbox-actions">
        {kind === "confirm" && (
          <button type="button" className="au-link-button" onClick={resend} disabled={status.sending || cooldown}>
            {status.sending ? "Sending…" : cooldown ? "Sent. You can resend in 30 seconds" : "Resend the email"}
          </button>
        )}
        <a className="au-link-button" href="">Use a different email</a>
      </div>

      {status.message && <p className={status.ok ? "au-ok" : "au-error-text"}>{status.message}</p>}
    </div>
  );
}
