import type { Metadata } from "next";
import { cookies } from "next/headers";
import HubShell from "@/components/hub/HubShell";
import { requireSession } from "@/lib/data";
import { parseTheme, THEME_COOKIE } from "@/lib/theme";

export const metadata: Metadata = { title: "Creator hub | Stores for Creators" };

// Always per-user; never prerender (even when built without Supabase keys).
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [{ profile, store }, cookieStore] = await Promise.all([requireSession(), cookies()]);
  const theme = parseTheme(cookieStore.get(THEME_COOKIE)?.value);

  return <HubShell profile={profile} store={store} theme={theme}>{children}</HubShell>;
}
