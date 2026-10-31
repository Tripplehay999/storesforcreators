import type { Metadata } from "next";
import HubShell from "@/components/hub/HubShell";
import { requireSession } from "@/lib/data";

export const metadata: Metadata = { title: "Creator hub | Stores for Creators" };

// Always per-user; never prerender (even when built without Supabase keys).
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, store } = await requireSession();

  return <HubShell profile={profile} store={store}>{children}</HubShell>;
}
