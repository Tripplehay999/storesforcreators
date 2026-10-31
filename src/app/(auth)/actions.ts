"use server";

import { redirect } from "next/navigation";
import { safeRedirectPath } from "@/lib/redirect";
import { siteUrl } from "@/lib/site";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  /** Set when an email was sent; the form swaps to a "check your inbox" screen. */
  sentTo?: string;
  sentKind?: "confirm" | "reset" | "magic";
  values?: Record<string, string>;
};

const NOT_CONFIGURED: AuthState = {
  error: "Creator accounts aren't connected yet. Add your Supabase keys to .env.local."
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(formData: FormData, name: string, max = 320) {
  return String(formData.get(name) || "").trim().slice(0, max);
}

/** Turns Supabase auth errors into plain language. */
function friendly(error: { code?: string; message: string; status?: number }) {
  switch (error.code) {
    case "invalid_credentials":
      return "That email and password don't match. Try again, or reset your password.";
    case "email_not_confirmed":
      return "Please confirm your email first. Check your inbox for the link, or sign up again to get a new one.";
    case "user_already_exists":
    case "email_exists":
      return "There's already an account with that email. Log in instead.";
    case "weak_password":
      return "Choose a stronger password: at least 8 characters, ideally with a mix of letters and numbers.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Wait a minute, then try again.";
    case "otp_disabled":
    case "signup_disabled":
      return "Email login isn't switched on for this site yet.";
    default:
      return error.status === 429 ? "Too many attempts. Wait a minute, then try again." : "Something went wrong. Please try again.";
  }
}

async function callbackUrl(next: string) {
  return `${await siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`;
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const email = text(formData, "email");
  const password = String(formData.get("password") || "");
  const values = { email };

  if (!EMAIL_PATTERN.test(email)) return { values, error: "Enter the email address you signed up with." };
  if (!password) return { values, error: "Enter your password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { values, error: friendly(error) };

  redirect(safeRedirectPath(formData.get("next")));
}

/** Passwordless login: emails a one-time link to an existing account. */
export async function sendLoginLink(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const email = text(formData, "email");
  const next = safeRedirectPath(formData.get("next"));

  if (!EMAIL_PATTERN.test(email)) return { values: { email }, error: "Enter the email address you signed up with." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: await callbackUrl(next) }
  });

  // Only rate limits are reported. Unknown emails (Supabase refuses them when shouldCreateUser is
  // false) get the same screen as real ones, so this can't be used to find out who has an account.
  if (error && (error.status === 429 || error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit")) {
    return { values: { email }, error: friendly(error) };
  }

  return { sentTo: email, sentKind: "magic" };
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const values = {
    full_name: text(formData, "full_name", 200),
    social_handle: text(formData, "social_handle", 200),
    email: text(formData, "email")
  };
  const password = String(formData.get("password") || "");

  if (!values.full_name) return { values, error: "Tell us your name." };
  if (!EMAIL_PATTERN.test(values.email)) return { values, error: "Enter a valid email address." };
  if (password.length < 8) return { values, error: "Use a password with at least 8 characters." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: values.email,
    password,
    options: {
      data: { full_name: values.full_name, social_handle: values.social_handle },
      emailRedirectTo: await callbackUrl("/dashboard?notice=welcome")
    }
  });

  if (error) return { values, error: friendly(error) };

  // Email confirmation turned off in Supabase: the user is already signed in.
  if (data.session) redirect("/dashboard?notice=welcome");

  return { sentTo: values.email, sentKind: "confirm" };
}

/** "Didn't get it?" on the check-your-inbox screen. */
export async function resendConfirmation(email: string): Promise<{ ok: boolean; message: string }> {
  if (!isSupabaseConfigured() || !EMAIL_PATTERN.test(email)) return { ok: false, message: "We couldn't resend that email." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: await callbackUrl("/dashboard?notice=welcome") }
  });

  if (error) return { ok: false, message: friendly(error) };
  return { ok: true, message: "Sent. It can take a minute to arrive; check your spam folder too." };
}

export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const email = text(formData, "email");
  if (!EMAIL_PATTERN.test(email)) return { values: { email }, error: "Enter the email address you signed up with." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: await callbackUrl("/reset-password") });

  if (error && (error.status === 429 || error.code === "over_email_send_rate_limit")) {
    return { values: { email }, error: friendly(error) };
  }

  // Same screen whether or not the account exists.
  return { sentTo: email, sentKind: "reset" };
}

export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (password.length < 8) return { error: "Use a password with at least 8 characters." };
  if (password !== confirm) return { error: "Those passwords don't match." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return {
      error: error.code === "same_password"
        ? "That's your current password. Choose a new one."
        : error.status === 401 || error.code === "session_not_found"
          ? "Your reset link has expired. Request a new one from the login page."
          : friendly(error)
    };
  }

  redirect("/dashboard?notice=password-updated");
}
