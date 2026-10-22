import type { Metadata } from "next";
import Brand from "@/components/Brand";
import HubNav from "@/components/HubNav";
import ModeSwitch from "@/components/ModeSwitch";
import { requireSession } from "@/lib/data";

export const metadata: Metadata = { title: "Creator hub | Browne's Talent Group" };

// Always per-user; never prerender (even when built without Supabase keys).
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, store } = await requireSession();
  const initial = (profile.fullName || profile.email).trim().charAt(0).toUpperCase();

  return (
    <div className="hub">
      <div className="dash-top hub-ribbon">
        <span>✳ {store ? store.name.toUpperCase() : "BROWNE'S TALENT GROUP"} · CREATOR HUB</span>
        {profile.role === "admin" && <span className="sample-badge">ADMIN ACCOUNT</span>}
      </div>

      <header className="hub-header">
        <div className="container hub-header-inner">
          <Brand />

          <HubNav storeSlug={store?.slug ?? null} />

          <div className="hub-user">
            {profile.role === "admin" && <ModeSwitch current="creator" />}
            <span className="hub-avatar" aria-hidden="true">{initial}</span>
            <div>
              <strong>{profile.fullName || "Creator"}</strong>
              <small>{profile.email}</small>
            </div>
            <form action="/auth/signout" method="post">
              <button className="small-button" type="submit">Log out</button>
            </form>
          </div>
        </div>
      </header>

      <main className="container hub-main">{children}</main>
    </div>
  );
}
