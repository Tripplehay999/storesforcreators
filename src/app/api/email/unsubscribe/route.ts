import { NextResponse, type NextRequest } from "next/server";
import { LIST_COLUMNS, verifyPreferencesToken, type EmailList } from "@/lib/email-links";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/admin";

// One-click unsubscribe (RFC 8058). Gmail and Yahoo show an "Unsubscribe" button next to the sender
// and POST here when it's pressed. The link in the email footer opens this address in a browser
// (a GET), which goes to the email settings page with a confirm button instead of unsubscribing
// straight away, because email security scanners open every link in an email.

function parse(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t");
  const list = request.nextUrl.searchParams.get("list");
  return { token, list: list === "sales" || list === "tips" ? (list as EmailList) : null };
}

export async function GET(request: NextRequest) {
  const { token, list } = parse(request);
  const url = new URL("/email-preferences", request.nextUrl.origin);
  if (token) url.searchParams.set("t", token);
  if (list) url.searchParams.set("unsubscribe", list);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: NextRequest) {
  const { token, list } = parse(request);
  const userId = verifyPreferencesToken(token);

  if (!userId || !list) return NextResponse.json({ error: "This unsubscribe link isn't valid." }, { status: 400 });
  if (!hasServiceRole()) return NextResponse.json({ error: "Unsubscribing isn't available right now." }, { status: 503 });

  const { error } = await createServiceClient()
    .from("profiles")
    .update({ [LIST_COLUMNS[list]]: false })
    .eq("id", userId);

  if (error) {
    console.error("[unsubscribe] couldn't update preferences:", error.message);
    return NextResponse.json({ error: "We couldn't unsubscribe you. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ unsubscribed: list });
}
