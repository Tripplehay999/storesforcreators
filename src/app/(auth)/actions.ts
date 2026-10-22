"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  notice?: string;
  email?: string;
};

const NOT_CONFIGURED: AuthState = {
  error: "Creator accounts aren't connected yet. Add your Supabase keys to .env.local."
};

function safeNext(value: FormDataEntryValue | null) {
  const next = String(value || "");
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

  const headerList = await headers();
  return headerList.get("origin") ?? `https://${headerList.get("host")}`;
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      email,
      error: error.code === "email_not_confirmed"
        ? "Please confirm your email first — check your inbox for the link."
        : "That email and password don't match. Try again or reset your password."
    };
  }

  redirect(safeNext(formData.get("next")));
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const fullName = String(formData.get("full_name") || "").trim().slice(0, 200);
  const socialHandle = String(formData.get("social_handle") || "").trim().slice(0, 200);
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!fullName) return { email, error: "Please tell us your name." };
  if (password.length < 8) return { email, error: "Use a password with at least 8 characters." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, social_handle: socialHandle },
      emailRedirectTo: `${await siteUrl()}/auth/callback?next=/dashboard`
    }
  });

  if (error) {
    return {
      email,
      error: error.code === "user_already_exists"
        ? "An account with that email already exists. Try logging in."
        : error.message
    };
  }

  // Email confirmation disabled in Supabase → the user is signed in already.
  if (data.session) redirect("/dashboard");

  return {
    email,
    notice: `Almost there! We sent a confirmation link to ${email}. Open it to activate your creator account.`
  };
}

export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const email = String(formData.get("email") || "").trim();
  const supabase = await createClient();

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteUrl()}/auth/callback?next=/reset-password`
  });

  // Same message whether or not the account exists.
  return { email, notice: `If ${email} has a creator account, a reset link is on its way.` };
}

export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (password.length < 8) return { error: "Use a password with at least 8 characters." };
  if (password !== confirm) return { error: "Those passwords don't match." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: error.message };

  redirect("/dashboard?notice=password-updated");
}
