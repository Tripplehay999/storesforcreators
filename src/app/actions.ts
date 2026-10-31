"use server";

import { redirect } from "next/navigation";
import { adminEmails } from "@/lib/email";
import { applicationReceivedEmail, newApplicationEmail } from "@/lib/email-templates";
import { sendLater } from "@/lib/notify";
import { siteUrl } from "@/lib/site";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type ApplicationState = {
  status: "idle" | "sent" | "error";
  message: string;
};

/**
 * "Become a partner" form. Visitors who aren't signed in also choose a
 * password, so submitting creates their creator account and logs them in.
 */
export async function submitApplication(
  _prev: ApplicationState,
  formData: FormData
): Promise<ApplicationState> {
  const field = (name: string, max: number) => String(formData.get(name) || "").trim().slice(0, max);

  // Honeypot: a field people never see. Bots that fill it get a normal-looking reply and nothing is saved.
  if (field("website", 200)) {
    return { status: "sent", message: "Application received. We'll be in touch by email." };
  }

  const application = {
    name: field("name", 200),
    email: field("email", 320),
    social_profile: field("social", 200),
    followers: field("followers", 50),
    niche: field("niche", 200),
    message: field("message", 4000)
  };

  if (!application.name || !application.email.includes("@") || !application.social_profile || !application.followers) {
    return { status: "error", message: "Please fill in your name, email, profile, and follower range." };
  }

  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Applications aren't connected yet. Copy your details instead." };
  }

  const supabase = await createClient();
  let { data: { user } } = await supabase.auth.getUser();
  let signedIn = Boolean(user);
  const isNewAccount = !user;

  if (!user) {
    const password = String(formData.get("password") || "");

    if (password.length < 8) {
      return { status: "error", message: "Choose a password with at least 8 characters." };
    }

    const { data, error } = await supabase.auth.signUp({
      email: application.email,
      password,
      options: {
        data: { full_name: application.name, social_handle: application.social_profile },
        emailRedirectTo: `${await siteUrl()}/auth/callback?next=${encodeURIComponent("/dashboard?notice=welcome")}`
      }
    });

    if (error) {
      return {
        status: "error",
        message: error.code === "user_already_exists"
          ? "You already have an account with this email — log in first, then apply."
          : error.message
      };
    }

    user = data.user;
    signedIn = Boolean(data.session);
  }

  const { error } = await supabase
    .from("applications")
    .insert({ ...application, user_id: signedIn ? user?.id ?? null : null });

  if (error) {
    return { status: "error", message: "We couldn't send your application. Copy your details instead." };
  }

  const site = await siteUrl();
  sendLater({ to: application.email, ...applicationReceivedEmail({ name: application.name, siteUrl: site }) });
  const admins = adminEmails();
  if (admins.length) {
    sendLater({
      to: admins,
      ...newApplicationEmail({
        name: application.name,
        email: application.email,
        social: application.social_profile,
        followers: application.followers,
        niche: application.niche,
        message: application.message,
        adminUrl: `${site}/admin/applications`
      })
    });
  }

  // Brand-new account with an active session → straight into the creator hub.
  if (isNewAccount && signedIn) redirect("/dashboard?notice=welcome");

  if (!isNewAccount) {
    return { status: "sent", message: "Application received. We'll be in touch by email." };
  }

  return {
    status: "sent",
    message: `Application received! Confirm your email (${application.email}) to activate your account.`
  };
}
