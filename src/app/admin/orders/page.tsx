import Link from "next/link";
import ActionForm from "@/components/admin/ActionForm";
import { getAllOrders, getStoreBalances } from "@/lib/admin-data";
import { getProducts } from "@/lib/data";
import { money, shortDate } from "@/lib/format";
import { deleteOrder, recordOrder, setOrderStatus } from "../actions";

type Props = { searchParams: Promise<{ store?: string; status?: string }> };

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { store, status } = await searchParams;
  const [orders, stores, products] = await Promise.all([
    getAllOrders({ store: store || undefined, status: status || undefined }),
    getStoreBalances(),
    getProducts()
  ]);

  const storeName = new Map(stores.map(item => [item.slug, item.name]));
  const total = orders.filter(order => order.status === "completed").reduce((sum, order) => sum + order.amount, 0);

  const statusTab = (value?: string) => {
    const params = new URLSearchParams({ ...(store ? { store } : {}), ...(value ? { status: value } : {}) });
    return `/admin/orders${params.size ? `?${params}` : ""}`;
  };

  return (
    <>
      <div className="adm-page-head">
        <div>
          <span className="adm-crumb">Admin</span>
          <h1>Orders</h1>
          <p>{orders.length} orders shown · {money(total, 2)} completed gross</p>
        </div>

        <form className="adm-toolbar" action="/admin/orders">
          {status && <input type="hidden" name="status" value={status} />}
          <select className="adm-select" name="store" defaultValue={store ?? ""} aria-label="Filter by store">
            <option value="">All stores</option>
            {stores.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}
          </select>
          <button className="adm-btn" type="submit">Filter</button>
          <a className="adm-btn adm-btn-ghost" href="/admin/export/orders" download>Export CSV</a>
        </form>
      </div>

      <div className="adm-grid-2">
        <section className="adm-panel">
          <div className="adm-panel-head">
            <nav className="adm-tabs" aria-label="Filter by status">
              <Link href={statusTab()} className={!status ? "active" : ""}>All</Link>
              <Link href={statusTab("completed")} className={status === "completed" ? "active" : ""}>Completed</Link>
              <Link href={statusTab("refunded")} className={status === "refunded" ? "active" : ""}>Refunded</Link>
            </nav>
          </div>

          {orders.length === 0 ? (
            <p className="adm-empty">No orders.</p>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr><th>Date</th><th>Product</th><th className="num">Amount</th><th className="num">Creator</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td className="adm-mono">{shortDate(order.createdAt, true)}</td>
                      <td>
                        {order.productName}
                        <span className="adm-sub">
                          {storeName.get(order.storeSlug) ?? order.storeSlug}
                          {order.customerEmail && ` · ${order.customerEmail}`}
                        </span>
                      </td>
                      <td className="num">{money(order.amount, 2)}</td>
                      <td className="num">{money(order.creatorAmount, 2)}</td>
                      <td>
                        <span className={`adm-pill ${order.status === "completed" ? "green" : "red"}`}>{order.status}</span>
                      </td>
                      <td>
                        <div className="adm-row-actions">
                          <ActionForm action={setOrderStatus}>
                            <input type="hidden" name="id" value={order.id} />
                            <input type="hidden" name="status" value={order.status === "completed" ? "refunded" : "completed"} />
                            <button className="adm-btn adm-btn-sm" type="submit">
                              {order.status === "completed" ? "Refund" : "Restore"}
                            </button>
                          </ActionForm>
                          <ActionForm action={deleteOrder} confirm="Delete this order permanently?">
                            <input type="hidden" name="id" value={order.id} />
                            <button className="adm-btn adm-btn-sm adm-btn-danger" type="submit">Delete</button>
                          </ActionForm>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="adm-panel">
          <div className="adm-panel-head">
            <h2>Record an order</h2>
          </div>
          <div className="adm-panel-body">
            <p className="adm-muted" style={{ marginBottom: 14, fontSize: 13 }}>
              Log a sale manually until checkout is connected. The creator&apos;s share is calculated from the store&apos;s revenue share.
            </p>
            <ActionForm action={recordOrder} className="adm-form">
              <label className="full">
                Product
                <select className="adm-select" name="product" required defaultValue="">
                  <option value="" disabled>Choose a product</option>
                  {stores.map(item => (
                    <optgroup key={item.slug} label={`${item.name} (${item.revenueShare}%)`}>
                      {products.filter(product => product.store === item.slug).map(product => (
                        <option key={product.id} value={product.id}>{product.name}</option>
                      ))}
                    </optgroup>
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
              <div className="full">
                <button className="adm-btn adm-btn-primary" type="submit">Record order</button>
              </div>
            </ActionForm>
          </div>
        </section>
      </div>
    </>
  );
}
