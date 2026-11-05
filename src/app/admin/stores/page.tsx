import Link from "next/link";
import ActionForm from "@/components/admin/ActionForm";
import { getStoreBalances, getUsers } from "@/lib/admin-data";
import { CHECKOUT_MODES, getCheckoutModes, stripeTestMode } from "@/lib/checkout";
import { emailConfigured } from "@/lib/email";
import { money, number } from "@/lib/format";
import { deleteStore, setCheckoutMode, updateStore } from "../actions";
import { adminOnly } from "@/lib/data";
import { storePath } from "@/lib/store-links";

/** Plain-language status of the pieces checkout needs. Never shows keys or setting names. */
function CheckoutSetup({ switchReady }: { switchReady: boolean }) {
  const hasKey = Boolean(process.env.STRIPE_SECRET_KEY);
  const hasWebhook = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
  const test = stripeTestMode();

  const rows = [
    {
      label: "Card payments (Stripe)",
      ok: hasKey,
      text: hasKey ? (test ? "Connected · test mode (no real money moves)" : "Connected · live mode (real payments)") : "Not connected yet"
    },
    {
      label: "Payment confirmations",
      ok: hasWebhook,
      text: hasWebhook ? "Connected: paid orders are recorded automatically" : "Not connected yet: orders won't be recorded"
    },
    {
      label: "Receipts & sale emails",
      ok: emailConfigured(),
      text: emailConfigured() ? "Connected" : "Not connected yet: buyers won't get a receipt or download email"
    },
    {
      label: "Per-store switch",
      ok: switchReady,
      text: switchReady ? "Ready" : "Not available yet"
    }
  ];

  return (
    <section className="adm-panel" style={{ marginBottom: 16 }}>
      <div className="adm-panel-head">
        <strong>Checkout</strong>
        <small>Open buying one store at a time: Off → Testing → On.</small>
      </div>
      <div className="adm-panel-body">
        <dl className="adm-dl">
          {rows.map(row => (
            <div key={row.label} style={{ display: "contents" }}>
              <dt>{row.label}</dt>
              <dd><span className={`adm-pill ${row.ok ? "green" : "amber"}`}>{row.ok ? "✓" : "!"}</span> {row.text}</dd>
            </div>
          ))}
        </dl>
        <p className="adm-muted" style={{ marginTop: 12, fontSize: 12 }}>
          {CHECKOUT_MODES.map(mode => `${mode.label}: ${mode.hint}`).join("  ·  ")}
          {test && "  Test purchases use the card 4242 4242 4242 4242 with any future date and any CVC."}
        </p>
      </div>
    </section>
  );
}

export default async function AdminStoresPage() {
  await adminOnly();
  const [stores, users, checkout] = await Promise.all([getStoreBalances(), getUsers(), getCheckoutModes()]);
  const owners = new Map(users.map(user => [user.id, user]));

  return (
    <>
      <div className="adm-page-head">
        <div>
          <span className="adm-crumb">Admin</span>
          <h1>Stores</h1>
          <p>Revenue share, visibility, checkout and lifetime totals for every storefront.</p>
        </div>
      </div>

      <CheckoutSetup switchReady={checkout.ready} />

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
                  <th>Checkout</th>
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
                        <span className="adm-sub adm-mono">{storePath(store.slug)}</span>
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
                        {store.isDemo ? (
                          <span className="adm-muted">Example store</span>
                        ) : checkout.ready ? (
                          <ActionForm action={setCheckoutMode} className="adm-row-actions">
                            <input type="hidden" name="slug" value={store.slug} />
                            <select
                              className="adm-select adm-select-sm"
                              name="mode"
                              defaultValue={checkout.modes.get(store.slug) ?? "off"}
                              aria-label={`Checkout for ${store.name}`}
                            >
                              {CHECKOUT_MODES.map(mode => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
                            </select>
                            <button className="adm-btn adm-btn-sm" type="submit">Save</button>
                          </ActionForm>
                        ) : (
                          <span className="adm-muted">Off</span>
                        )}
                      </td>
                      <td>
                        <div className="adm-row-actions">
                          <Link className="adm-btn adm-btn-sm adm-btn-ghost" href={storePath(store.slug)} target="_blank">View</Link>
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
