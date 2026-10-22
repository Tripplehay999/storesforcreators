import Link from "next/link";
import { notFound } from "next/navigation";
import ActionForm from "@/components/admin/ActionForm";
import {
  getAdjustments,
  getAllOrders,
  getApplicationsByEmail,
  getNotes,
  getPayouts,
  getStoreBalances,
  getUser
} from "@/lib/admin-data";
import { getProducts, requireAdmin } from "@/lib/data";
import { money, number, shortDate } from "@/lib/format";
import { hasServiceRole } from "@/lib/supabase/admin";
import {
  addAdjustment,
  addNote,
  confirmUserEmail,
  createPayout,
  recordOrder,
  deleteAdjustment,
  deleteNote,
  deleteUser,
  sendPasswordReset,
  setOrderStatus,
  setPayoutStatus,
  setUserRole,
  setUserSuspended,
  updateStore,
  updateUserProfile
} from "../../actions";

type Props = { params: Promise<{ id: string }> };

const PAYOUT_PILL = { pending: "amber", paid: "green", cancelled: "" } as const;

export default async function AdminUserPage({ params }: Props) {
  const { id } = await params;
  const { profile: me } = await requireAdmin();
  const user = await getUser(id);

  if (!user) notFound();

  const isMe = user.id === me.id;
  const slug = user.store?.slug;

  const [balances, orders, payouts, adjustments, notes, applications, products] = await Promise.all([
    getStoreBalances(),
    slug ? getAllOrders({ store: slug, limit: 100 }) : Promise.resolve([]),
    slug ? getPayouts({ store: slug }) : Promise.resolve([]),
    slug ? getAdjustments(slug) : Promise.resolve([]),
    getNotes(user.id),
    getApplicationsByEmail(user.email),
    slug ? getProducts(slug) : Promise.resolve([])
  ]);

  const balance = balances.find(item => item.slug === slug);

  const activity = [
    ...orders.map(order => ({
      at: order.createdAt,
      kind: order.status === "completed" ? "Order" : "Refund",
      label: order.productName,
      amount: order.status === "completed" ? order.creatorAmount : 0,
      tone: order.status === "completed" ? "green" : "red"
    })),
    ...payouts.filter(payout => payout.status !== "cancelled").map(payout => ({
      at: payout.paidAt ?? payout.createdAt,
      kind: payout.status === "paid" ? "Payout" : "Payout (pending)",
      label: payout.method || "Payout",
      amount: -payout.amount,
      tone: "amber"
    })),
    ...adjustments.map(adjustment => ({
      at: adjustment.createdAt,
      kind: adjustment.amount > 0 ? "Credit" : "Deduction",
      label: adjustment.reason,
      amount: adjustment.amount,
      tone: "blue"
    }))
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 15);

  return (
    <>
      <div className="adm-page-head">
        <div>
          <Link className="adm-crumb" href="/admin/users">← Users</Link>
          <h1>
            {user.fullName || user.email}{" "}
            <span className={`adm-pill ${user.role === "admin" ? "blue" : ""}`}>{user.role}</span>{" "}
            {user.suspended && <span className="adm-pill red">suspended</span>}
          </h1>
          <p>
            {user.email} · joined {shortDate(user.createdAt, true)}
            {user.socialHandle && ` · ${user.socialHandle}`}
          </p>
        </div>

        <div className="adm-toolbar">
          <ActionForm action={sendPasswordReset} confirm={`Email a password reset link to ${user.email}?`}>
            <input type="hidden" name="email" value={user.email} />
            <button className="adm-btn" type="submit">Send password reset</button>
          </ActionForm>

          {hasServiceRole() && (
            <ActionForm action={confirmUserEmail}>
              <input type="hidden" name="id" value={user.id} />
              <button className="adm-btn" type="submit">Confirm email</button>
            </ActionForm>
          )}

          {!isMe && (
            <ActionForm
              action={setUserSuspended}
              confirm={user.suspended ? `Reactivate ${user.email}?` : `Suspend ${user.email}? They'll be locked out of their creator hub.`}
            >
              <input type="hidden" name="id" value={user.id} />
              <input type="hidden" name="suspended" value={String(!user.suspended)} />
              <button className={`adm-btn ${user.suspended ? "" : "adm-btn-danger"}`} type="submit">
                {user.suspended ? "Reactivate" : "Suspend"}
              </button>
            </ActionForm>
          )}

          {!isMe && hasServiceRole() && (
            <ActionForm
              action={deleteUser}
              confirm={`Permanently delete ${user.email}? Their login is removed; their store stays but becomes ownerless.`}
            >
              <input type="hidden" name="id" value={user.id} />
              <button className="adm-btn adm-btn-danger" type="submit">Delete account</button>
            </ActionForm>
          )}
        </div>
      </div>

      {balance ? (
        <div className="adm-kpis">
          <div className="adm-kpi">
            <small>Available balance</small>
            <strong style={{ color: balance.balance > 0 ? "var(--green)" : undefined }}>{money(balance.balance, 2)}</strong>
            <span>Earned + adjustments − payouts</span>
          </div>
          <div className="adm-kpi">
            <small>Lifetime earnings</small>
            <strong>{money(balance.earned, 2)}</strong>
            <span>{balance.revenueShare}% of {money(balance.gross, 2)} gross</span>
          </div>
          <div className="adm-kpi">
            <small>Paid out</small>
            <strong>{money(balance.paidOut, 2)}</strong>
            <span>{money(balance.pendingPayouts, 2)} pending</span>
          </div>
          <div className="adm-kpi">
            <small>Adjustments</small>
            <strong>{money(balance.adjustments, 2)}</strong>
            <span>{adjustments.length} manual entr{adjustments.length === 1 ? "y" : "ies"}</span>
          </div>
          <div className="adm-kpi">
            <small>Orders</small>
            <strong>{number(balance.orderCount)}</strong>
            <span>{number(balance.productCount)} products</span>
          </div>
        </div>
      ) : (
        <section className="adm-panel" style={{ marginBottom: 16 }}>
          <p className="adm-empty">This user hasn&apos;t created a store yet, so there&apos;s no balance to show.</p>
        </section>
      )}

      <div className="adm-grid-2">
        <div>
          <section className="adm-panel">
            <div className="adm-panel-head"><h2>Account</h2></div>
            <div className="adm-panel-body">
              <ActionForm action={updateUserProfile} className="adm-form">
                <input type="hidden" name="id" value={user.id} />
                <label>
                  Full name
                  <input className="adm-input" name="full_name" defaultValue={user.fullName} />
                </label>
                <label>
                  Social handle
                  <input className="adm-input" name="social_handle" defaultValue={user.socialHandle} />
                </label>
                <label className="full">
                  Email
                  <input className="adm-input" value={user.email} disabled />
                </label>
                <div className="full"><button className="adm-btn adm-btn-primary" type="submit">Save profile</button></div>
              </ActionForm>

              {!isMe && (
                <ActionForm action={setUserRole} className="adm-form" autoSubmit>
                  <input type="hidden" name="id" value={user.id} />
                  <label className="full" style={{ marginTop: 14 }}>
                    Role
                    <select className="adm-select" name="role" defaultValue={user.role}>
                      <option value="creator">Creator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                </ActionForm>
              )}
            </div>
          </section>

          <section className="adm-panel">
            <div className="adm-panel-head">
              <h2>Store</h2>
              {user.store && (
                <div className="adm-toolbar">
                  <Link className="adm-btn adm-btn-sm adm-btn-ghost" href={`/store/${user.store.slug}`} target="_blank">View</Link>
                  <Link className="adm-btn adm-btn-sm adm-btn-ghost" href={`/dashboard?store=${user.store.slug}`}>Hub</Link>
                  <Link className="adm-btn adm-btn-sm" href={`/dashboard/products?store=${user.store.slug}`}>Products</Link>
                </div>
              )}
            </div>

            {balance ? (
              <div className="adm-panel-body">
                <ActionForm action={updateStore} className="adm-form">
                  <input type="hidden" name="slug" value={balance.slug} />
                  <label className="full">
                    Store name
                    <input className="adm-input" name="name" defaultValue={balance.name} />
                  </label>
                  <label>
                    Creator revenue share (%)
                    <input className="adm-input" name="revenue_share" type="number" min={0} max={100} defaultValue={balance.revenueShare} />
                  </label>
                  <label className="adm-check" style={{ alignSelf: "end", paddingBottom: 8 }}>
                    <input type="checkbox" name="published" defaultChecked={balance.published} />
                    Store is public
                  </label>
                  <p className="full adm-muted adm-mono">/store/{balance.slug}</p>
                  <div className="full"><button className="adm-btn adm-btn-primary" type="submit">Save store</button></div>
                </ActionForm>
              </div>
            ) : (
              <p className="adm-empty">No store yet.</p>
            )}
          </section>
        </div>

        <div>
          {balance && (
            <>
              <section className="adm-panel">
                <div className="adm-panel-head">
                  <h2>Record an order</h2>
                  <small>Creator gets {balance.revenueShare}%</small>
                </div>
                <div className="adm-panel-body">
                  {products.length === 0 ? (
                    <p className="adm-muted">This store has no products yet.</p>
                  ) : (
                    <ActionForm action={recordOrder} className="adm-form">
                      <label className="full">
                        Product
                        <select className="adm-select" name="product" required>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>{product.name}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Order total (USD)
                        <input className="adm-input" name="amount" type="number" min="0.01" step="0.01" required />
                      </label>
                      <label>
                        Customer email
                        <input className="adm-input" name="customer_email" type="email" placeholder="Optional" />
                      </label>
                      <div className="full"><button className="adm-btn adm-btn-primary" type="submit">Record order</button></div>
                    </ActionForm>
                  )}
                </div>
              </section>

              <section className="adm-panel">
                <div className="adm-panel-head">
                  <h2>Pay this creator</h2>
                  <small>Balance {money(balance.balance, 2)}</small>
                </div>
                <div className="adm-panel-body">
                  <ActionForm action={createPayout} className="adm-form" confirm="Create this payout?">
                    <input type="hidden" name="store" value={balance.slug} />
                    <label>
                      Amount (USD)
                      <input
                        className="adm-input"
                        name="amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        defaultValue={balance.balance > 0 ? balance.balance.toFixed(2) : ""}
                      />
                    </label>
                    <label>
                      Method
                      <select className="adm-select" name="method" defaultValue="Bank transfer">
                        <option>Bank transfer</option>
                        <option>PayPal</option>
                        <option>Stripe</option>
                        <option>Other</option>
                      </select>
                    </label>
                    <label>
                      Reference
                      <input className="adm-input" name="reference" placeholder="Transaction ID" />
                    </label>
                    <label>
                      Note
                      <input className="adm-input" name="note" placeholder="Optional" />
                    </label>
                    <label className="adm-check full">
                      <input type="checkbox" name="paid" />
                      Already sent — record as paid
                    </label>
                    <div className="full"><button className="adm-btn adm-btn-primary" type="submit">Create payout</button></div>
                  </ActionForm>
                </div>
              </section>

              <section className="adm-panel">
                <div className="adm-panel-head">
                  <h2>Adjust balance</h2>
                  <small>Bonuses, fees, chargebacks</small>
                </div>
                <div className="adm-panel-body">
                  <ActionForm action={addAdjustment} className="adm-form">
                    <input type="hidden" name="store" value={balance.slug} />
                    <label>
                      Type
                      <select className="adm-select" name="direction" defaultValue="credit">
                        <option value="credit">Credit (+)</option>
                        <option value="debit">Deduction (−)</option>
                      </select>
                    </label>
                    <label>
                      Amount (USD)
                      <input className="adm-input" name="amount" type="number" min="0.01" step="0.01" required />
                    </label>
                    <label className="full">
                      Reason
                      <input className="adm-input" name="reason" required maxLength={300} placeholder="e.g. Launch bonus, chargeback on order #123" />
                    </label>
                    <div className="full"><button className="adm-btn" type="submit">Add adjustment</button></div>
                  </ActionForm>
                </div>
              </section>
            </>
          )}

          <section className="adm-panel">
            <div className="adm-panel-head">
              <h2>Internal notes</h2>
              <small>Only admins can see these</small>
            </div>
            <div className="adm-panel-body">
              <ActionForm action={addNote} className="adm-form">
                <input type="hidden" name="user_id" value={user.id} />
                <label className="full">
                  <textarea className="adm-input" name="body" rows={3} placeholder="Add a note about this creator…" required />
                </label>
                <div className="full"><button className="adm-btn" type="submit">Add note</button></div>
              </ActionForm>

              {notes.map(note => (
                <div className="adm-note" key={note.id}>
                  <p>{note.body}</p>
                  <div className="adm-note-meta">
                    <span>{note.authorName} · {shortDate(note.createdAt, true)}</span>
                    <ActionForm action={deleteNote} confirm="Delete this note?">
                      <input type="hidden" name="id" value={note.id} />
                      <button className="adm-link-btn" type="submit">Delete</button>
                    </ActionForm>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {balance && (
        <>
          <section className="adm-panel">
            <div className="adm-panel-head"><h2>Activity</h2><small>Latest balance movements</small></div>
            {activity.length === 0 ? (
              <p className="adm-empty">No activity yet.</p>
            ) : (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead><tr><th>Date</th><th>Type</th><th>Detail</th><th className="num">Balance effect</th></tr></thead>
                  <tbody>
                    {activity.map((item, index) => (
                      <tr key={index}>
                        <td className="adm-mono">{shortDate(item.at, true)}</td>
                        <td><span className={`adm-pill ${item.tone}`}>{item.kind}</span></td>
                        <td>{item.label}</td>
                        <td className="num" style={{ color: item.amount > 0 ? "var(--green)" : item.amount < 0 ? "var(--red)" : undefined }}>
                          {item.amount > 0 ? "+" : ""}{money(item.amount, 2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="adm-grid-2">
            <section className="adm-panel">
              <div className="adm-panel-head"><h2>Payouts</h2><small>{payouts.length} total</small></div>
              {payouts.length === 0 ? (
                <p className="adm-empty">No payouts yet.</p>
              ) : (
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead><tr><th>Date</th><th>Method</th><th className="num">Amount</th><th>Status</th><th></th></tr></thead>
                    <tbody>
                      {payouts.map(payout => (
                        <tr key={payout.id}>
                          <td className="adm-mono">{shortDate(payout.createdAt, true)}</td>
                          <td>
                            {payout.method || "—"}
                            {payout.reference && <span className="adm-sub adm-mono">{payout.reference}</span>}
                          </td>
                          <td className="num">{money(payout.amount, 2)}</td>
                          <td><span className={`adm-pill ${PAYOUT_PILL[payout.status]}`}>{payout.status}</span></td>
                          <td>
                            {payout.status === "pending" && (
                              <div className="adm-row-actions">
                                <ActionForm action={setPayoutStatus}>
                                  <input type="hidden" name="id" value={payout.id} />
                                  <input type="hidden" name="status" value="paid" />
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

            <section className="adm-panel">
              <div className="adm-panel-head"><h2>Adjustments</h2><small>{adjustments.length} total</small></div>
              {adjustments.length === 0 ? (
                <p className="adm-empty">No manual adjustments.</p>
              ) : (
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead><tr><th>Date</th><th>Reason</th><th className="num">Amount</th><th></th></tr></thead>
                    <tbody>
                      {adjustments.map(adjustment => (
                        <tr key={adjustment.id}>
                          <td className="adm-mono">{shortDate(adjustment.createdAt, true)}</td>
                          <td>{adjustment.reason}</td>
                          <td className="num" style={{ color: adjustment.amount > 0 ? "var(--green)" : "var(--red)" }}>
                            {adjustment.amount > 0 ? "+" : ""}{money(adjustment.amount, 2)}
                          </td>
                          <td>
                            <ActionForm action={deleteAdjustment} confirm="Remove this adjustment?" className="adm-row-actions">
                              <input type="hidden" name="id" value={adjustment.id} />
                              <button className="adm-btn adm-btn-sm adm-btn-danger" type="submit">Remove</button>
                            </ActionForm>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <section className="adm-panel">
            <div className="adm-panel-head">
              <h2>Orders</h2>
              <Link className="adm-btn adm-btn-sm" href={`/admin/orders?store=${balance.slug}`}>Open in Orders</Link>
            </div>
            {orders.length === 0 ? (
              <p className="adm-empty">No orders yet.</p>
            ) : (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead><tr><th>Date</th><th>Product</th><th className="num">Amount</th><th className="num">Creator</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {orders.slice(0, 25).map(order => (
                      <tr key={order.id}>
                        <td className="adm-mono">{shortDate(order.createdAt, true)}</td>
                        <td>
                          {order.productName}
                          {order.customerEmail && <span className="adm-sub">{order.customerEmail}</span>}
                        </td>
                        <td className="num">{money(order.amount, 2)}</td>
                        <td className="num">{money(order.creatorAmount, 2)}</td>
                        <td><span className={`adm-pill ${order.status === "completed" ? "green" : "red"}`}>{order.status}</span></td>
                        <td>
                          <ActionForm action={setOrderStatus} className="adm-row-actions">
                            <input type="hidden" name="id" value={order.id} />
                            <input type="hidden" name="status" value={order.status === "completed" ? "refunded" : "completed"} />
                            <button className="adm-btn adm-btn-sm" type="submit">{order.status === "completed" ? "Refund" : "Restore"}</button>
                          </ActionForm>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {applications.length > 0 && (
        <section className="adm-panel">
          <div className="adm-panel-head">
            <h2>Applications</h2>
            <Link className="adm-btn adm-btn-sm" href="/admin/applications">All applications</Link>
          </div>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Date</th><th>Followers</th><th>Niche</th><th>Status</th></tr></thead>
              <tbody>
                {applications.map(application => (
                  <tr key={application.id}>
                    <td className="adm-mono">{shortDate(application.createdAt, true)}</td>
                    <td>{application.followers}</td>
                    <td className="adm-muted">{application.niche || "—"}</td>
                    <td><span className="adm-pill">{application.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
