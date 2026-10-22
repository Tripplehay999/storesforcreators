import Link from "next/link";
import ActionForm from "@/components/admin/ActionForm";
import { getPayouts, getStoreBalances } from "@/lib/admin-data";
import { money, shortDate } from "@/lib/format";
import { createPayout, setPayoutStatus } from "../actions";

type Props = { searchParams: Promise<{ status?: string }> };

const STATUS_PILL = { pending: "amber", paid: "green", cancelled: "" } as const;

export default async function AdminPayoutsPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const [stores, payouts] = await Promise.all([getStoreBalances(), getPayouts({ status: status || undefined })]);

  const storeName = new Map(stores.map(store => [store.slug, store.name]));
  const owing = stores.filter(store => store.balance > 0).sort((a, b) => b.balance - a.balance);
  const totalOwed = owing.reduce((sum, store) => sum + store.balance, 0);
  const totalPending = stores.reduce((sum, store) => sum + store.pendingPayouts, 0);
  const totalPaid = stores.reduce((sum, store) => sum + store.paidOut, 0);

  const tab = (value?: string) => `/admin/payouts${value ? `?status=${value}` : ""}`;

  return (
    <>
      <div className="adm-page-head">
        <div>
          <span className="adm-crumb">Admin</span>
          <h1>Payouts</h1>
          <p>Balance = creator earnings from completed orders + adjustments − paid − pending payouts.</p>
        </div>
          <a className="adm-btn adm-btn-ghost" href="/admin/export/payouts" download>Export CSV</a>
      </div>

      <div className="adm-kpis">
        <div className="adm-kpi">
          <small>Owed to creators</small>
          <strong>{money(totalOwed, 2)}</strong>
          <span>{owing.length} store{owing.length === 1 ? "" : "s"} with a balance</span>
        </div>
        <div className="adm-kpi">
          <small>Pending payouts</small>
          <strong>{money(totalPending, 2)}</strong>
          <span>Scheduled, not yet sent</span>
        </div>
        <div className="adm-kpi">
          <small>Paid out (all time)</small>
          <strong>{money(totalPaid, 2)}</strong>
          <span>Across every store</span>
        </div>
      </div>

      <section className="adm-panel">
        <div className="adm-panel-head">
          <h2>Balances</h2>
          <small>Pay a creator from their outstanding balance</small>
        </div>

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Store</th>
                <th className="num">Earned</th>
                <th className="num">Paid</th>
                <th className="num">Pending</th>
                <th className="num">Balance</th>
                <th>New payout</th>
              </tr>
            </thead>
            <tbody>
              {stores.map(store => (
                <tr key={store.slug}>
                  <td>
                    {store.name}
                    <span className="adm-sub">{store.revenueShare}% share</span>
                  </td>
                  <td className="num">{money(store.earned, 2)}</td>
                  <td className="num">{money(store.paidOut, 2)}</td>
                  <td className="num">{money(store.pendingPayouts, 2)}</td>
                  <td className="num" style={{ color: store.balance > 0 ? "var(--green)" : undefined }}>
                    {money(store.balance, 2)}
                  </td>
                  <td>
                    <ActionForm action={createPayout} className="adm-row-actions" confirm={`Create a payout for ${store.name}?`}>
                      <input type="hidden" name="store" value={store.slug} />
                      <input
                        className="adm-input adm-input-sm"
                        style={{ width: 90 }}
                        name="amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        defaultValue={store.balance > 0 ? store.balance.toFixed(2) : ""}
                        aria-label="Payout amount"
                      />
                      <select className="adm-select adm-select-sm" name="method" aria-label="Payout method" defaultValue="Bank transfer">
                        <option>Bank transfer</option>
                        <option>PayPal</option>
                        <option>Stripe</option>
                        <option>Other</option>
                      </select>
                      <label className="adm-check">
                        <input type="checkbox" name="paid" />
                        <span className="adm-muted">Already paid</span>
                      </label>
                      <button className="adm-btn adm-btn-sm adm-btn-primary" type="submit">Create</button>
                    </ActionForm>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="adm-panel">
        <div className="adm-panel-head">
          <h2>Payout history</h2>
          <nav className="adm-tabs" aria-label="Filter by status">
            <Link href={tab()} className={!status ? "active" : ""}>All</Link>
            <Link href={tab("pending")} className={status === "pending" ? "active" : ""}>Pending</Link>
            <Link href={tab("paid")} className={status === "paid" ? "active" : ""}>Paid</Link>
            <Link href={tab("cancelled")} className={status === "cancelled" ? "active" : ""}>Cancelled</Link>
          </nav>
        </div>

        {payouts.length === 0 ? (
          <p className="adm-empty">No payouts yet.</p>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr><th>Created</th><th>Store</th><th>Method</th><th className="num">Amount</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {payouts.map(payout => (
                  <tr key={payout.id}>
                    <td className="adm-mono">{shortDate(payout.createdAt, true)}</td>
                    <td>{storeName.get(payout.storeSlug) ?? payout.storeSlug}</td>
                    <td>
                      {payout.method || "—"}
                      {payout.reference && <span className="adm-sub adm-mono">{payout.reference}</span>}
                    </td>
                    <td className="num">{money(payout.amount, 2)}</td>
                    <td>
                      <span className={`adm-pill ${STATUS_PILL[payout.status]}`}>{payout.status}</span>
                      {payout.paidAt && <span className="adm-sub">{shortDate(payout.paidAt, true)}</span>}
                    </td>
                    <td>
                      {payout.status === "pending" && (
                        <div className="adm-row-actions">
                          <ActionForm action={setPayoutStatus}>
                            <input type="hidden" name="id" value={payout.id} />
                            <input type="hidden" name="status" value="paid" />
                            <input className="adm-input adm-input-sm" style={{ width: 130 }} name="reference" placeholder="Reference" />
                            <button className="adm-btn adm-btn-sm adm-btn-primary" type="submit">Mark paid</button>
                          </ActionForm>
                          <ActionForm action={setPayoutStatus} confirm="Cancel this payout?">
                            <input type="hidden" name="id" value={payout.id} />
                            <input type="hidden" name="status" value="cancelled" />
                            <button className="adm-btn adm-btn-sm adm-btn-danger" type="submit">Cancel</button>
                          </ActionForm>
                        </div>
                      )}
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
