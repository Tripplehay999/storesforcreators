import { NextResponse } from "next/server";
import { authEmail } from "@/lib/auth-email-templates";
import { getSession } from "@/lib/data";
import { catalogEntry } from "@/lib/email-catalog";
import { siteUrl } from "@/lib/site";

// Admin → Emails → Preview: shows one email exactly as it's sent, filled in with sample details.
export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const session = await getSession();

  if (!session || session.profile.role !== "admin" || session.profile.suspended) {
    return new NextResponse("Not found", { status: 404 });
  }

  const key = (await params).key;
  const { profile } = session;
  const site = await siteUrl();
  let html: string;

  const entry = catalogEntry(key);
  const account = entry ? undefined : authEmail(key);

  if (entry) {
    html = entry.sample({ id: profile.id, email: profile.email, name: profile.fullName || "there" }, site).html;
  } else if (account) {
    // What Supabase puts in when it sends one. The button goes nowhere useful in a preview.
    html = account.html
      .replaceAll("{{ .SiteURL }}", site)
      .replaceAll("{{ .TokenHash }}", "preview")
      .replaceAll("{{ .Email }}", profile.email)
      .replaceAll("{{ .NewEmail }}", `new-${profile.email}`);
  } else {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex"
    }
  });
}
