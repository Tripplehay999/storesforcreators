import Link from "next/link";
import ActionForm from "@/components/admin/ActionForm";
import { getStoreBalances, getUsers } from "@/lib/admin-data";
import { money, number } from "@/lib/format";
import { deleteStore, updateStore } from "../actions";

export default async function AdminStoresPage() {
  const [stores, users] = await Promise.all([getStoreBalances(), getUsers()]);
  const owners = new Map(users.map(user => [user.id, user]));

  return (
    <>
      <div className="adm-page-head">
        <div>
          <span className="adm-crumb">Admin</span>
          <h1>Stores</h1>
          <p>Revenue share, visibility, and lifetime totals for every storefront.</p>
        </div>
      </div>

      <section className="adm-panel">
        {stores.length === 0 ? (
          <p className="adm-empty">No stores yet.</p>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Store</th>
                  <th>Owner</th>
                  <th className="num">Products</th>
                  <th className="num">Orders</th>
                  <th className="num">Gross</th>
                  <th className="num">Owed</th>
                  <th>Share · Public</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {stores.map(store => {
                  const owner = store.ownerId ? owners.get(store.ownerId) : null;

                  return (
                    <tr key={store.slug} id={store.slug}>
                      <td>
                        {store.name}
                        {store.isDemo && <span className="adm-pill" style={{ marginLeft: 6 }}>demo</span>}
                        <span className="adm-sub adm-mono">/store/{store.slug}</span>
                      </td>
                      <td>
                        {owner ? (
                          <>
                            <Link className="adm-name-link" href={`/admin/users/${owner.id}`}>{owner.fullName || owner.email}</Link>
                            <span className="adm-sub">{owner.email}</span>
                          </>
                        ) : (
                          <span className="adm-muted">—</span>
                        )}
                      </td>
                      <td className="num">{number(store.productCount)}</td>
                      <td className="num">{number(store.orderCount)}</td>
                      <td className="num">{money(store.gross, 2)}</td>
                      <td className="num">{money(Math.max(0, store.balance), 2)}</td>
                      <td>
                        <ActionForm action={updateStore} className="adm-row-actions">
                          <input type="hidden" name="slug" value={store.slug} />
                          <input
                            className="adm-input adm-input-sm"
                            name="revenue_share"
                            type="number"
                            min={0}
                            max={100}
                            defaultValue={store.revenueShare}
                            aria-label="Creator revenue share %"
                          />
                          <span className="adm-muted">%</span>
                          <label className="adm-check">
                            <input type="checkbox" name="published" defaultChecked={store.published} />
                            <span className="adm-muted">Public</span>
                          </label>
                          <button className="adm-btn adm-btn-sm" type="submit">Save</button>
                        </ActionForm>
                      </td>
                      <td>
                        <div className="adm-row-actions">
                          <Link className="adm-btn adm-btn-sm adm-btn-ghost" href={`/store/${store.slug}`} target="_blank">View</Link>
                          <Link className="adm-btn adm-btn-sm adm-btn-ghost" href={`/dashboard?store=${store.slug}`}>Hub</Link>
                          <ActionForm
                            action={deleteStore}
                            confirm={`Delete ${store.name}? This removes all of its products, orders, and payouts.`}
                          >
                            <input type="hidden" name="slug" value={store.slug} />
                            <button className="adm-btn adm-btn-sm adm-btn-danger" type="submit">Delete</button>
                          </ActionForm>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
