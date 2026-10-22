import Link from "next/link";
import ActionForm from "@/components/admin/ActionForm";
import { getStoreBalances, getUsers } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/data";
import { money, shortDate } from "@/lib/format";
import { setUserRole } from "../actions";

type Props = { searchParams: Promise<{ q?: string; role?: string }> };

export default async function AdminUsersPage({ searchParams }: Props) {
  const { profile: me } = await requireAdmin();
  const { q = "", role } = await searchParams;
  const [allUsers, balances] = await Promise.all([getUsers(q.trim() || undefined), getStoreBalances()]);
  const balanceOf = new Map(balances.map(item => [item.slug, item.balance]));
  const users = allUsers.filter(user =>
    !role || (role === "suspended" ? user.suspended : user.role === role)
  );

  const tab = (value?: string) => {
    const params = new URLSearchParams({ ...(q ? { q } : {}), ...(value ? { role: value } : {}) });
    return `/admin/users${params.size ? `?${params}` : ""}`;
  };

  return (
    <>
      <div className="adm-page-head">
        <div>
          <span className="adm-crumb">Admin</span>
          <h1>Users</h1>
          <p>Everyone with a creator account. Promote trusted people to admin.</p>
        </div>

        <form className="adm-toolbar" action="/admin/users">
          {role && <input type="hidden" name="role" value={role} />}
          <input className="adm-input" name="q" defaultValue={q} placeholder="Search name or email" />
          <button className="adm-btn" type="submit">Search</button>
          <a className="adm-btn adm-btn-ghost" href="/admin/export/users" download>Export CSV</a>
        </form>
      </div>

      <div className="adm-toolbar" style={{ marginBottom: 14 }}>
        <nav className="adm-tabs" aria-label="Filter by role">
          <Link href={tab()} className={!role ? "active" : ""}>All</Link>
          <Link href={tab("creator")} className={role === "creator" ? "active" : ""}>Creators</Link>
          <Link href={tab("admin")} className={role === "admin" ? "active" : ""}>Admins</Link>
          <Link href={tab("suspended")} className={role === "suspended" ? "active" : ""}>Suspended</Link>
        </nav>
      </div>

      <section className="adm-panel">
        {users.length === 0 ? (
          <p className="adm-empty">No users match.</p>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr><th>User</th><th>Store</th><th className="num">Balance</th><th>Joined</th><th>Status</th><th>Role</th><th></th></tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>
                      <Link className="adm-name-link" href={`/admin/users/${user.id}`}>
                        {user.fullName || user.email}
                      </Link>
                      {user.id === me.id && <span className="adm-pill blue" style={{ marginLeft: 6 }}>you</span>}
                      <span className="adm-sub">
                        {user.email}
                        {user.socialHandle && ` · ${user.socialHandle}`}
                      </span>
                    </td>
                    <td>
                      {user.store ? user.store.name : <span className="adm-muted">No store</span>}
                    </td>
                    <td className="num">
                      {user.store ? money(balanceOf.get(user.store.slug) ?? 0, 2) : <span className="adm-muted">—</span>}
                    </td>
                    <td className="adm-mono">{shortDate(user.createdAt, true)}</td>
                    <td>
                      <span className={`adm-pill ${user.suspended ? "red" : "green"}`}>
                        {user.suspended ? "suspended" : "active"}
                      </span>
                    </td>
                    <td>
                      {user.id === me.id ? (
                        <span className="adm-pill blue">admin</span>
                      ) : (
                        <ActionForm action={setUserRole} autoSubmit>
                          <input type="hidden" name="id" value={user.id} />
                          <select className="adm-select adm-select-sm" name="role" defaultValue={user.role} aria-label={`Role for ${user.email}`}>
                            <option value="creator">Creator</option>
                            <option value="admin">Admin</option>
                          </select>
                        </ActionForm>
                      )}
                    </td>
                    <td>
                      <div className="adm-row-actions">
                        <Link className="adm-btn adm-btn-sm" href={`/admin/users/${user.id}`}>Manage</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
