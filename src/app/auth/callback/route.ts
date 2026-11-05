import type { EmailOtpType, User } from "@supabase/supabase-js";
import { NextResponse, after, type NextRequest } from "next/server";
import { WELCOME_PATH, sendWelcome } from "@/lib/onboarding";
import { safeRedirectPath } from "@/lib/redirect";
import { siteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

const OTP_TYPES: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

// Landing point for email confirmation, login-link and password-reset emails.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const typeParam = searchParams.get("type") as EmailOtpType | null;
  const type = typeParam && OTP_TYPES.includes(typeParam) ? typeParam : null;
  const next = safeRedirectPath(searchParams.get("next"));

  // Supabase sends people back with ?error=… when a link has expired or was already used.
  if (searchParams.get("error") || (!code && !(tokenHash && type))) {
    return NextResponse.redirect(new URL("/login?error=link", origin));
  }

  const supabase = await createClient();
  const { data, error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: type! });

  if (error) {
    return NextResponse.redirect(new URL("/login?error=link", origin));
  }

  // A confirmed sign-up: send the welcome email (once per person, after the redirect has gone out).
  if (next === WELCOME_PATH && data.user) {
    const user: User = data.user;
    const site = await siteUrl();
    after(() => sendWelcome({
      id: user.id,
      email: user.email ?? "",
      name: String(user.user_metadata?.full_name ?? "")
    }, site).catch(err => console.error("[welcome] couldn't send:", err)));
  }

  return NextResponse.redirect(new URL(type === "recovery" ? "/reset-password" : next, origin));
}
