import Link from "next/link";
import { getAllOrders, getCounts, getOrdersSince, getStoreBalances } from "@/lib/admin-data";
import { money, number, shortDate } from "@/lib/format";

const DAYS = 30;

export default async function AdminOverviewPage() {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (DAYS - 1));

  const [balances, counts, recentOrders, windowOrders] = await Promise.all([
    getStoreBalances(),
    getCounts(),
    getAllOrders({ limit: 8 }),
    getOrdersSince(since)
  ]);

  const totals = balances.reduce(
    (sum, store) => ({
      gross: sum.gross + store.gross,
      earned: sum.earned + store.earned,
      paidOut: sum.paidOut + store.paidOut,
      owed: sum.owed + Math.max(0, store.balance),
      pending: sum.pending + store.pendingPayouts,
      orders: sum.orders + store.orderCount
    }),
    { gross: 0, earned: 0, paidOut: 0, owed: 0, pending: 0, orders: 0 }
  );

  const completed = windowOrders.filter(order => order.status === "completed");
  const days = Array.from({ length: DAYS }, (_, index) => {
    const day = new Date(since);
    day.setDate(since.getDate() + index);
    return { day, gross: 0 };
  });

  completed.forEach(order => {
    const index = Math.floor((new Date(order.createdAt).getTime() - since.getTime()) / 86400000);
    if (days[index]) days[index].gross += order.amount;
  });

  const windowGross = days.reduce((sum, day) => sum + day.gross, 0);
  const maxDay = Math.max(1, ...days.map(day => day.gross));
  const topStores = [...balances].sort((a, b) => b.gross - a.gross).slice(0, 6);
  const storeName = new Map(balances.map(store => [store.slug, store.name]));

  return (
    <>
      <div className="adm-page-head">
        <div>
          <span className="adm-crumb">Admin</span>
          <h1>Overview</h1>
          <p>Platform totals across every store.</p>
        </div>
        <div className="adm-toolbar">
          <Link className="adm-btn" href="/admin/orders">Record order</Link>
          <Link className="adm-btn adm-btn-primary" href="/admin/payouts">Pay creators</Link>
        </div>
      </div>

      <div className="adm-kpis">
        <div className="adm-kpi">
          <small>Gross sales</small>
          <strong>{money(totals.gross, 2)}</strong>
          <span>{number(totals.orders)} completed orders</span>
        </div>
        <div className="adm-kpi">
          <small>BTG revenue</small>
          <strong>{money(totals.gross - totals.earned, 2)}</strong>
          <span>Gross minus creator shares</span>
        </div>
        <div className="adm-kpi">
          <small>Creator earnings</small>
          <strong>{money(totals.earned, 2)}</strong>
          <span>{money(totals.paidOut, 2)} paid out</span>
        </div>
        <div className="adm-kpi">
          <small>Owed to creators</small>
          <strong>{money(totals.owed, 2)}</strong>
          <span>{money(totals.pending, 2)} in pending payouts</span>
        </div>
        <div className="adm-kpi">
          <small>Users</small>
          <strong>{number(counts.users)}</strong>
          <span>{counts.admins} admin{counts.admins === 1 ? "" : "s"} · {balances.length} stores</span>
        </div>
        <div className="adm-kpi">
          <small>New applications</small>
          <strong>{number(counts.newApplications)}</strong>
          <span><Link href="/admin/applications">Review →</Link></span>
        </div>
      </div>

      <div className="adm-grid-2">
        <section className="adm-panel">
          <div className="adm-panel-head">
            <h2>Gross sales · last {DAYS} days</h2>
            <small className="adm-mono">{money(windowGross, 2)}</small>
          </div>
          <div className="adm-chart">
            {days.map(({ day, gross }) => (
              <div className="adm-chart-bar" key={day.toISOString()} title={`${shortDate(day)} · ${money(gross, 2)}`}>
                <span style={{ height: `${(gross / maxDay) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="adm-chart-axis">
            <span>{shortDate(days[0].day)}</span>
            <span>{shortDate(days[days.length - 1].day)}</span>
          </div>
        </section>

        <section className="adm-panel">
          <div className="adm-panel-head">
            <h2>Top stores</h2>
            <Link className="adm-btn adm-btn-sm" href="/admin/stores">All stores</Link>
          </div>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr><th>Store</th><th className="num">Gross</th><th className="num">Owed</th></tr>
              </thead>
              <tbody>
                {topStores.map(store => (
                  <tr key={store.slug}>
                    <td>
                      {store.name}
                      {store.isDemo && <span className="adm-pill" style={{ marginLeft: 6 }}>demo</span>}
                    </td>
                    <td className="num">{money(store.gross, 2)}</td>
                    <td className="num">{money(Math.max(0, store.balance), 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="adm-panel">
        <div className="adm-panel-head">
          <h2>Recent orders</h2>
          <Link className="adm-btn adm-btn-sm" href="/admin/orders">All orders</Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="adm-empty">No orders yet.</p>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr><th>Date</th><th>Product</th><th>Store</th><th>Status</th><th className="num">Amount</th><th className="num">Creator</th></tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id}>
                    <td className="adm-mono">{shortDate(order.createdAt)}</td>
                    <td>{order.productName}</td>
                    <td className="adm-muted">{storeName.get(order.storeSlug) ?? order.storeSlug}</td>
                    <td>
                      <span className={`adm-pill ${order.status === "completed" ? "green" : "red"}`}>{order.status}</span>
                    </td>
                    <td className="num">{money(order.amount, 2)}</td>
                    <td className="num">{money(order.creatorAmount, 2)}</td>
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
