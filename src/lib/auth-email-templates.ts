import { emailLayout } from "./email-templates";

// The account emails Supabase sends itself (confirm sign-up, login link, password reset…). They're
// built with the same layout as the site's own emails, then pasted into Supabase → Authentication →
// Emails → Templates. Admin → Emails has a "Copy" button for each one. supabase/templates/*.html hold
// the same HTML (regenerate them with `npm run email:templates` after changing anything here).
//
// {{ .SiteURL }}, {{ .TokenHash }}, {{ .Email }} and {{ .NewEmail }} are filled in by Supabase.

export type AuthEmail = {
  key: string;
  /** Supabase's name for the template. */
  template: string;
  file: string;
  subject: string;
  when: string;
  html: string;
};

const SAFE = "Didn't ask for this? You can ignore this email; nothing changes until the link is used.";

function link(type: string, next: string) {
  return `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=${type}&next=${encodeURIComponent(next)}`;
}

export const AUTH_EMAILS: AuthEmail[] = [
  {
    key: "confirm-signup",
    template: "Confirm signup",
    file: "confirm-signup.html",
    subject: "Confirm your email",
    when: "Right after someone signs up",
    html: emailLayout({
      preheader: "One tap and your creator hub is ready.",
      tag: "Welcome",
      heading: "One tap and",
      mark: "you're in.",
      body: "Welcome to Stores for Creators! Tap the button to confirm {{ .Email }} and open your creator hub. For your security, the link works only once.",
      cta: { label: "Confirm my email", url: link("email", "/dashboard?notice=welcome") },
      footnote: SAFE
    })
  },
  {
    key: "magic-link",
    template: "Magic link",
    file: "magic-link.html",
    subject: "Your login link",
    when: "When someone logs in with an email link",
    html: emailLayout({
      preheader: "Tap to log in. No password needed.",
      tag: "Log in",
      heading: "Your login link",
      mark: "is here.",
      body: "Tap the button to log in to your creator hub. No password needed. For your security, the link works only once.",
      cta: { label: "Log me in", url: link("email", "/dashboard") },
      footnote: SAFE
    })
  },
  {
    key: "reset-password",
    template: "Reset password",
    file: "reset-password.html",
    subject: "Reset your password",
    when: "When someone forgets their password",
    html: emailLayout({
      preheader: "Choose a new password for your account.",
      tag: "Password",
      heading: "Let's reset",
      mark: "your password.",
      body: "Someone (hopefully you) asked to reset the password for {{ .Email }}. Tap the button to choose a new one. For your security, the link works only once.",
      cta: { label: "Choose a new password", url: link("recovery", "/reset-password") },
      footnote: SAFE
    })
  },
  {
    key: "change-email",
    template: "Change email address",
    file: "change-email.html",
    subject: "Confirm your new email",
    when: "When someone changes their email address",
    html: emailLayout({
      preheader: "Confirm the new email address for your account.",
      tag: "Account",
      heading: "Confirm your",
      mark: "new email.",
      body: "Tap the button to change your account email from {{ .Email }} to {{ .NewEmail }}. If you didn't ask for this, ignore this email and your address stays the same.",
      cta: { label: "Confirm new email", url: link("email_change", "/dashboard/store") },
      footnote: SAFE
    })
  },
  {
    key: "invite",
    template: "Invite user",
    file: "invite.html",
    subject: "You're invited to Stores for Creators",
    when: "When an admin invites someone from Supabase",
    html: emailLayout({
      preheader: "Accept your invite and choose a password.",
      tag: "Invite",
      heading: "You're invited to",
      mark: "Stores for Creators.",
      body: "You've been invited to create your creator account. Tap the button to accept and choose a password. For your security, the link works only once.",
      cta: { label: "Accept invite", url: link("invite", "/reset-password") },
      footnote: SAFE
    })
  }
];

export function authEmail(key: string) {
  return AUTH_EMAILS.find(email => email.key === key);
}
