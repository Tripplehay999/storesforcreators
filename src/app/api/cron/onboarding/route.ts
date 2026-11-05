import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { runOnboarding } from "@/lib/onboarding";
import { siteUrl } from "@/lib/site";

// Vercel runs this once a day (see vercel.json) and sends "Authorization: Bearer <CRON_SECRET>".
// Anyone else gets a 401, so the run can't be triggered from outside.

export const maxDuration = 300;

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET isn't set, so the daily run is off." }, { status: 503 });
  }
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runOnboarding(await siteUrl());
  console.info("[onboarding] daily run:", JSON.stringify(result));
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}
