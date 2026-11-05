import ActionForm from "@/components/admin/ActionForm";
import CopyButton from "@/components/admin/CopyButton";
import SignatureMaker from "@/components/admin/SignatureMaker";
import { AUTH_EMAILS } from "@/lib/auth-email-templates";
import { CONTACT, CONTACT_LIST, LOGO, MAIL_DOMAIN, PUBLIC_SITE } from "@/lib/contact";
import { adminOnly } from "@/lib/data";
import { EMAIL_CATALOG } from "@/lib/email-catalog";
import { checkEmailSetup, type SetupCheck } from "@/lib/email-setup";
import { shortDate } from "@/lib/format";
import { ONBOARDING_EMAILS, planOnboarding, type OnboardingKind } from "@/lib/onboarding";
import { isMissingSchema } from "@/lib/schema";
import { createClient } from "@/lib/supabase/server";
import { sendDueOnboardingEmails, sendTestEmail, testAddress } from "./actions";

const PILL: Record<SetupCheck["state"], { className: string; mark: string }> = {
  ok: { className: "green", mark: "✓" },
  warn: { className: "amber", mark: "!" },
  todo: { className: "red", mark: "✕" }
};

type LogRow = { kind: string; sent_at: string; profiles: { full_name: string; email: string } | null };

function kindLabel(kind: string) {
  if (kind === "store-live") return "Your store is live";
  return ONBOARDING_EMAILS[kind as OnboardingKind]?.label ?? kind;
}

async function recentSends(): Promise<{ rows: LogRow[]; missing: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("email_log")
    .select("kind, sent_at, profiles(full_name, email)")
    .order("sent_at", { ascending: false })
    .limit(25);

  if (error) return { rows: [], missing: isMissingSchema(error) };
  return { rows: (data ?? []) as unknown as LogRow[], missing: false };
}

export default async function AdminEmailsPage() {
  const session = await adminOnly();
  const [setup, plan, log] = await Promise.all([checkEmailSetup(), planOnboarding(), recentSends()]);
  const todo = setup.checks.filter(check => check.state !== "ok").length;

  return (
    <>
      <div className="adm-page-head">
        <div>
          <span className="adm-crumb">Admin</span>
          <h1>Emails</h1>
          <p>Your email addresses, every email the site sends, and who gets an onboarding email next.</p>
        </div>
      </div>

      <section className="adm-panel">
        <div className="adm-panel-head">
          <strong>Email setup</strong>
          <small>{todo === 0 ? "Everything is connected" : `${todo} thing${todo === 1 ? "" : "s"} left to do. Checked live just now.`}</small>
        </div>
        <div className="adm-panel-body">
          <dl className="adm-dl">
            {setup.checks.map(check => (
              <div key={check.label} style={{ display: "contents" }}>
                <dt>{check.label}</dt>
                <dd>
                  <span className={`adm-pill ${PILL[check.state].className}`}>{PILL[check.state].mark}</span> {check.text}
                  {check.fix && <span className="adm-sub">→ {check.fix}</span>}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="adm-panel">
        <div className="adm-panel-head">
          <strong>Your email addresses</strong>
          <small>{setup.receiving ? `Delivered by ${setup.provider}` : "Not receiving mail yet: see step 1 below"}</small>
        </div>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Address</th><th>Use it for</th><th /></tr></thead>
            <tbody>
              {CONTACT_LIST.map(item => (
                <tr key={item.address}>
                  <td><strong>{item.address}</strong></td>
                  <td className="adm-muted">{item.purpose}</td>
                  <td>
                    <div className="adm-row-actions">
                      <ActionForm action={testAddress}>
                        <input type="hidden" name="address" value={item.address} />
                        <button className="adm-btn adm-btn-sm" type="submit">Send a test</button>
                      </ActionForm>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="adm-muted adm-footnote">
          To add another address (for example press@{MAIL_DOMAIN}), add it to <span className="adm-mono">src/lib/contact.ts</span> and create the same
          address in Cloudflare → Email Routing. Or turn on Cloudflare&apos;s catch-all rule so any @{MAIL_DOMAIN} address reaches you.
        </p>
      </section>

      <section className="adm-panel">
        <div className="adm-panel-head">
          <strong>How to set up your addresses</strong>
          <small>About 20 minutes, free. Open each step.</small>
        </div>
        <div className="adm-panel-body adm-steps">
          <details open={!setup.receiving}>
            <summary>1. Receive mail at {CONTACT.partnerships} and the others (Cloudflare)</summary>
            <ol>
              <li>Log in at <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer">dash.cloudflare.com</a> and click <strong>{MAIL_DOMAIN}</strong>.</li>
              <li>In the menu on the left, open <strong>Email</strong> → <strong>Email Routing</strong> and press <strong>Get started</strong> (or <strong>Enable</strong>).</li>
              <li>When Cloudflare offers to add its records, press <strong>Add records and enable</strong>.</li>
              <li>Under <strong>Destination addresses</strong>, add the inbox you already use (like your Gmail). Cloudflare emails it a link: open it and press <strong>Verify</strong>.</li>
              <li>Under <strong>Routing rules</strong> → <strong>Custom addresses</strong>, press <strong>Create address</strong>. Type <strong>partnerships</strong>, choose <strong>Send to an email</strong>, pick your inbox, and save. Do the same for <strong>support</strong> and <strong>hello</strong>.</li>
              <li>Come back here and press <strong>Send a test</strong> next to each address. The test should land in your inbox within a minute or two (once step 2 is done, since the test is sent by the site).</li>
            </ol>
          </details>

          <details>
            <summary>2. Send the site&apos;s emails from your domain (Resend)</summary>
            <ol>
              <li>Log in at <a href="https://resend.com/domains" target="_blank" rel="noreferrer">resend.com</a> → <strong>Domains</strong> → <strong>Add domain</strong>, and type <strong>{MAIL_DOMAIN}</strong>.</li>
              <li>Resend lists a few DNS records. If it offers to add them to Cloudflare for you, use that. Otherwise, in Cloudflare → <strong>DNS</strong> → <strong>Records</strong>, press <strong>Add record</strong> for each one and copy the Type, Name, Value (and Priority, for MX) exactly.</li>
              <li>Back in Resend, press <strong>Verify</strong>. It usually takes a few minutes, sometimes up to an hour.</li>
              <li>In Resend → <strong>API Keys</strong>, create a key. <strong>Full access</strong> lets this page check your domain; <strong>Sending access</strong> also works.</li>
              <li>In Vercel → your project → <strong>Settings</strong> → <strong>Environment Variables</strong>, add:
                <ul>
                  <li><span className="adm-mono">RESEND_API_KEY</span>: the key you just made</li>
                  <li><span className="adm-mono">EMAIL_FROM</span>: <span className="adm-mono">Stores for Creators &lt;{CONTACT.hello}&gt;</span></li>
                  <li><span className="adm-mono">EMAIL_REPLY_TO</span>: <span className="adm-mono">{CONTACT.support}</span></li>
                  <li><span className="adm-mono">ADMIN_EMAILS</span>: the inbox that should get new applications and payout requests</li>
                  <li><span className="adm-mono">CRON_SECRET</span>: any long random text (it switches on the daily onboarding emails)</li>
                  <li><span className="adm-mono">NEXT_PUBLIC_SITE_URL</span>: <span className="adm-mono">https://www.{MAIL_DOMAIN}</span></li>
                </ul>
              </li>
              <li>In Vercel → <strong>Deployments</strong>, open the menu (⋯) on the newest one and press <strong>Redeploy</strong>, so the new settings take effect.</li>
            </ol>
          </details>

          <details>
            <summary>3. Keep your emails out of spam (DMARC)</summary>
            <ol>
              <li>In Cloudflare → <strong>DNS</strong> → <strong>Records</strong>, press <strong>Add record</strong>.</li>
              <li>Type: <strong>TXT</strong>. Name: <span className="adm-mono">_dmarc</span>. Content: <span className="adm-mono">v=DMARC1; p=none;</span> Then save.</li>
            </ol>
          </details>

          <details>
            <summary>4. Write and reply as {CONTACT.hello} or {CONTACT.partnerships} from Gmail (optional)</summary>
            <ol>
              <li>In Resend → <strong>API Keys</strong>, make a key just for Gmail: name it <strong>Gmail</strong> and choose <strong>Sending access</strong>. (Keeping it separate means you can delete it without stopping the site&apos;s emails.)</li>
              <li>In Gmail on a computer, press the gear → <strong>See all settings</strong> → <strong>Accounts and Import</strong>. Next to <strong>Send mail as</strong>, press <strong>Add another email address</strong>.</li>
              <li>Name: <strong>Stores for Creators</strong>. Email: <strong>{CONTACT.partnerships}</strong>. Press <strong>Next step</strong>.</li>
              <li>SMTP Server: <span className="adm-mono">smtp.resend.com</span>. Port: <strong>465</strong>. Username: <span className="adm-mono">resend</span>. Password: the Gmail key. Choose <strong>Secured connection using SSL</strong>, then <strong>Add account</strong>.</li>
              <li>Gmail sends a code to {CONTACT.partnerships}, which Cloudflare forwards to your inbox. Type the code in to finish.</li>
              <li>Do the same for {CONTACT.hello} and {CONTACT.support} if you want to write from them too. The same key works for all of them.</li>
              <li>Still in <strong>Accounts and Import</strong>, choose <strong>Reply from the same address the message was sent to</strong>. Now when a brand writes to partnerships@, your reply comes from partnerships@ too.</li>
              <li>To write a new email, press <strong>Compose</strong>, then click the <strong>From</strong> line and pick the address.</li>
            </ol>
          </details>

          <details>
            <summary>5. Send sign-up and login emails from your domain too (Supabase)</summary>
            <ol>
              <li>In Supabase → <strong>Authentication</strong> → <strong>Emails</strong> → <strong>SMTP Settings</strong>, turn on <strong>Enable custom SMTP</strong>.</li>
              <li>Sender email: <span className="adm-mono">{CONTACT.hello}</span>. Sender name: <strong>Stores for Creators</strong>. Host: <span className="adm-mono">smtp.resend.com</span>. Port: <strong>465</strong>. Username: <span className="adm-mono">resend</span>. Password: your Resend API key. Save.</li>
              <li>Under <strong>Authentication</strong> → <strong>URL Configuration</strong>, set <strong>Site URL</strong> to <span className="adm-mono">https://www.{MAIL_DOMAIN}</span> and add <span className="adm-mono">https://www.{MAIL_DOMAIN}/auth/callback</span> to <strong>Redirect URLs</strong>.</li>
              <li>Paste the branded templates (listed under &quot;Account emails&quot; below) into <strong>Authentication</strong> → <strong>Emails</strong> → <strong>Templates</strong>, if you haven&apos;t already.</li>
            </ol>
          </details>
        </div>
      </section>

      <section className="adm-panel">
        <div className="adm-panel-head">
          <strong>Your logo in emails</strong>
          <small>The site&apos;s own emails already show it at the top</small>
        </div>
        <div className="adm-panel-body adm-steps">
          <details open>
            <summary>Email signature with your logo (for Gmail)</summary>
            <div style={{ padding: "4px 16px 16px" }}>
              <SignatureMaker
                addresses={CONTACT_LIST.map(item => item.address)}
                defaultName={session.profile.fullName}
                logoUrl={LOGO.tile}
                siteUrl={PUBLIC_SITE}
              />
            </div>
            <ol>
              <li>Fill in your name above, pick the address, and press <strong>Copy signature</strong>.</li>
              <li>In Gmail on a computer, press the gear → <strong>See all settings</strong>. On the <strong>General</strong> tab, scroll down to <strong>Signature</strong> and press <strong>+ Create new</strong>. Give it a name like <strong>hello</strong>.</li>
              <li>Click in the big box next to it and paste (<strong>Ctrl + V</strong>, or <strong>⌘ + V</strong> on a Mac). The logo and your details appear.</li>
              <li>Under <strong>Signature defaults</strong>, pick the address in the drop-down (it only shows addresses added in step 4 above), then choose your new signature for both <strong>For new emails use</strong> and <strong>On reply/forward use</strong>.</li>
              <li>Scroll to the very bottom and press <strong>Save Changes</strong>.</li>
              <li>For another address, pick it above, copy again, and repeat. Each address gets its own signature.</li>
            </ol>
          </details>

          <details>
            <summary>Show your logo next to your name in Gmail inboxes</summary>
            <ol>
              <li>
                Gmail shows the profile photo of the Google account that uses an address. Your addresses don&apos;t have one yet, so make a free one for each. This doesn&apos;t create a new inbox; mail still comes to you through Cloudflare.
                <div className="adm-logo-files" style={{ marginTop: 10 }}>
                  <img src="/icon-maskable-512.png" width={56} height={56} alt="Stores for Creators logo" />
                  <a className="adm-btn adm-btn-sm" href="/icon-maskable-512.png" download="stores-for-creators-logo.png">Download the logo</a>
                </div>
              </li>
              <li>Open a private window (<strong>Ctrl + Shift + N</strong> in Chrome) so you stay logged in to your own Gmail, and go to <a href="https://accounts.google.com/signup" target="_blank" rel="noreferrer">accounts.google.com/signup</a>.</li>
              <li>Type <strong>Stores for Creators</strong> as the name. If Google asks what the account is for, choose <strong>For my personal use</strong> (the business option is the paid Google Workspace).</li>
              <li>When Google suggests Gmail addresses, press <strong>Use your existing email</strong> instead and type <strong>{CONTACT.hello}</strong>.</li>
              <li>Google emails a code to {CONTACT.hello}. Cloudflare forwards it to your inbox: type it in and finish the sign-up.</li>
              <li>Go to <a href="https://myaccount.google.com/personal-info" target="_blank" rel="noreferrer">myaccount.google.com → Personal info</a>, press the photo circle, and upload the logo you downloaded.</li>
              <li>Repeat for {CONTACT.partnerships} and {CONTACT.support} if you like. The picture can take a day or so to start showing. Gmail shows it; Outlook and Apple Mail usually show your initials instead.</li>
            </ol>
          </details>
        </div>
      </section>

      <section className="adm-panel">
        <div className="adm-panel-head">
          <strong>Emails the site sends</strong>
          <small>Previews use your name and sample amounts. Tests go to your own inbox.</small>
        </div>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Email</th><th>Goes to</th><th>When</th><th /></tr></thead>
            <tbody>
              {EMAIL_CATALOG.map(entry => (
                <tr key={entry.key}>
                  <td><strong>{entry.label}</strong><span className="adm-sub">{entry.group}</span></td>
                  <td>{entry.to}</td>
                  <td className="adm-muted">{entry.when}</td>
                  <td>
                    <div className="adm-row-actions">
                      <a className="adm-btn adm-btn-sm adm-btn-ghost" href={`/admin/emails/preview/${entry.key}`} target="_blank" rel="noreferrer">Preview</a>
                      <ActionForm action={sendTestEmail}>
                        <input type="hidden" name="key" value={entry.key} />
                        <button className="adm-btn adm-btn-sm" type="submit">Send me a test</button>
                      </ActionForm>
                    </div>
                  </td>
                </tr>
              ))}
              {AUTH_EMAILS.map(entry => (
                <tr key={entry.key}>
                  <td><strong>{entry.subject}</strong><span className="adm-sub">Account emails (sent by Supabase)</span></td>
                  <td>Anyone</td>
                  <td className="adm-muted">{entry.when}</td>
                  <td>
                    <div className="adm-row-actions">
                      <a className="adm-btn adm-btn-sm adm-btn-ghost" href={`/admin/emails/preview/${entry.key}`} target="_blank" rel="noreferrer">Preview</a>
                      <CopyButton
                        text={entry.html}
                        label="Copy for Supabase"
                        done={`Copied. Paste it into Supabase → Authentication → Emails → "${entry.template}".`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="adm-muted adm-footnote">
          Supabase sends the account emails itself, so they only look like the rest once you paste them in. For each one, press <strong>Copy for Supabase</strong>.
          In Supabase, go to <strong>Authentication</strong> → <strong>Emails</strong> → <strong>Templates</strong> and open the matching template
          ({AUTH_EMAILS.map(entry => entry.template).join(", ")}). Replace everything in the message box with what you copied, set the subject to the name shown here, and save.
        </p>
      </section>

      <section className="adm-panel">
        <div className="adm-panel-head">
          <strong>Onboarding emails</strong>
          <ActionForm action={sendDueOnboardingEmails}>
            <button className="adm-btn adm-btn-sm adm-btn-primary" type="submit" disabled={!plan.ok || plan.due.length === 0}>
              Send due emails now
            </button>
          </ActionForm>
        </div>
        <div className="adm-panel-body">
          <p className="adm-muted" style={{ marginTop: 0 }}>
            Each creator gets each email at most once, at most one every 2 days, and only while that step is still undone.
            Only creators who joined in the last 30 days, confirmed their email and kept &quot;Tips and reminders&quot; on are included.
          </p>

          {!plan.ok ? (
            <p><span className="adm-pill amber">!</span> {plan.error}</p>
          ) : plan.due.length === 0 ? (
            <p className="adm-muted">Nobody is due one right now ({plan.checked} creator{plan.checked === 1 ? "" : "s"} checked).</p>
          ) : (
            <>
              <strong>Due now ({plan.due.length})</strong>
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead><tr><th>Creator</th><th>Email</th></tr></thead>
                  <tbody>
                    {plan.due.map(({ candidate, kind }) => (
                      <tr key={candidate.user_id}>
                        <td>{candidate.full_name || "No name"}<span className="adm-sub">{candidate.email}</span></td>
                        <td>{ONBOARDING_EMAILS[kind].label}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="adm-panel-head" style={{ borderTop: "1px solid var(--border)" }}>
          <strong>Recently sent</strong>
          <small>Welcome, follow-ups and &quot;store is live&quot;</small>
        </div>
        {log.missing ? (
          <div className="adm-empty">Run supabase/migrations/007_onboarding_emails.sql in Supabase to start keeping this list.</div>
        ) : log.rows.length === 0 ? (
          <div className="adm-empty">None yet.</div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Creator</th><th>Email</th><th className="num">Sent</th></tr></thead>
              <tbody>
                {log.rows.map(row => (
                  <tr key={`${row.profiles?.email}-${row.kind}`}>
                    <td>{row.profiles?.full_name || "No name"}<span className="adm-sub">{row.profiles?.email}</span></td>
                    <td>{kindLabel(row.kind)}</td>
                    <td className="num">{shortDate(row.sent_at, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
