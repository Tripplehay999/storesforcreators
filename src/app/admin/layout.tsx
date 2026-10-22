import type { Metadata } from "next";
import AdminNav from "@/components/admin/AdminNav";
import ModeSwitch from "@/components/ModeSwitch";
import { getCounts } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/data";
import "./admin.css";

export const metadata: Metadata = { title: "Admin · BTG Control" };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();
  const counts = await getCounts();

  return (
    <div className="adm">
      <aside className="adm-sidebar">
        <div className="adm-logo">
          <span className="adm-logo-mark">BTG</span>
          <div>
            <strong>Control</strong>
            <small>Admin panel</small>
          </div>
        </div>

        <ModeSwitch current="admin" />

        <AdminNav badges={{ applications: counts.newApplications, payouts: counts.pendingPayouts }} />

        <div className="adm-sidebar-foot">
          <div className="adm-me">
            <span className="adm-avatar">{(profile.fullName || profile.email).charAt(0).toUpperCase()}</span>
            <div>
              <strong>{profile.fullName || "Admin"}</strong>
              <small>{profile.email}</small>
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button className="adm-btn adm-btn-ghost adm-btn-block" type="submit">Log out</button>
          </form>
        </div>
      </aside>

      <main className="adm-main">{children}</main>
    </div>
  );
}
