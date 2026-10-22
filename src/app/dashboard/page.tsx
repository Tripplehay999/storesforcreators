import Link from "next/link";
import OrderBars from "@/components/OrderBars";
import { getAdjustments, getPayouts, getStoreBalances, type Adjustment } from "@/lib/admin-data";
import { getOrders, getProducts, getViewedStore, requireSession } from "@/lib/data";
import { money, number, shortDate } from "@/lib/format";
import type { Order } from "@/lib/types";

type Props = {
  searchParams: Promise<{ period?: string; store?: string; notice?: string }>;
};

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

// Earnings for the period = creator share of completed orders + manual credits/deductions.
function summarize(orders: Order[], adjustments: Adjustment[], period: "weeks" | "months", now: Date) {
  const completed = orders.filter(order => order.status === "completed");
  const year = now.getFullYear();
  const month = now.getMonth();

  if (period === "weeks") {
    const days = new Date(year, month + 1, 0).getDate();
    const counts = Array<number>(Math.ceil(days / 7)).fill(0);
    let earnings = 0;

    completed.forEach(order => {
      const date = new Date(order.createdAt);

      if (date.getFullYear() === year && date.getMonth() === month) {
        counts[Math.floor((date.getDate() - 1) / 7)] += 1;
        earnings += order.creatorAmount;
      }
    });

    adjustments.forEach(adjustment => {
      const date = new Date(adjustment.createdAt);
      if (date.getFullYear() === year && date.getMonth() === month) earnings += adjustment.amount;
    });

    return {
      labels: counts.map((_, index) => `W${index + 1}`),
      orders: counts,
      earnings,
      title: "Weekly orders",
      note: `${MONTHS[month]} ${year} · BY WEEK`
    };
  }

  const counts = [0, 0, 0, 0];
  let earnings = 0;

  completed.forEach(order => {
    const date = new Date(order.createdAt);
    const index = 3 - ((year - date.getFullYear()) * 12 + month - date.getMonth());

    if (index >= 0 && index <= 3) {
      counts[index] += 1;
      earnings += order.creatorAmount;
    }
  });

  adjustments.forEach(adjustment => {
    const date = new Date(adjustment.createdAt);
    const index = 3 - ((year - date.getFullYear()) * 12 + month - date.getMonth());
    if (index >= 0 && index <= 3) earnings += adjustment.amount;
  });

  return {
    labels: counts.map((_, index) => MONTHS[(month - 3 + index + 12) % 12]),
    orders: counts,
    earnings,
    title: "Monthly orders",
    note: "LAST 4 MONTHS"
  };
}

export default async function DashboardPage({ searchParams }: Props) {
  const session = await requireSession();
  const params = await searchParams;
  const firstName = session.profile.fullName.split(" ")[0] || "creator";
  const period = params.period === "months" ? "months" : "weeks";

  const store = await getViewedStore(session, params.store);
  const isOwnStore = store !== null && store.slug === session.store?.slug;

  if (!store) {
    return (
      <section className="hub-onboarding">
        <span className="eyebrow">WELCOME TO YOUR CREATOR HUB</span>
        <h1>Hi {firstName}, let&apos;s build <em>your store.</em></h1>
        <p>Three steps between you and a beautifully branded storefront.</p>

        <ol className="process-steps hub-steps">
          {[
            ["01", "Create your storefront.", "Pick your store URL, name, colours, and headline."],
            ["02", "Add your products.", "Use the product studio to set up photos, pricing, features, and FAQs."],
            ["03", "Share it with your community.", "Your orders and earnings will show up right here."]
          ].map(([step, title, body]) => (
            <li className="process-step" key={step}>
              <span>{step}</span>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
              <b>↗</b>
            </li>
          ))}
        </ol>

        <Link className="btn btn-dark" href="/dashboard/store">Create my store ↗</Link>
      </section>
    );
  }

  const now = new Date();
  const [orders, products, payouts, balances, adjustments] = await Promise.all([
    getOrders(store.slug, new Date(now.getFullYear(), now.getMonth() - 3, 1)),
    getProducts(store.slug),
    getPayouts({ store: store.slug }),
    getStoreBalances(),
    getAdjustments(store.slug)
  ]);
  const balance = balances.find(item => item.slug === store.slug);

  const data = summarize(orders, adjustments, period, now);
  const totalOrders = data.orders.reduce((sum, value) => sum + value, 0);
  const query = (next: Record<string, string>) =>
    "?" + new URLSearchParams({ ...(isOwnStore ? {} : { store: store.slug }), period, ...next }).toString();

  return (
    <>
      {!isOwnStore && (
        <p className="hub-flash hub-flash-admin">
          ✳ Viewing {store.name}&apos;s creator hub as an admin.{" "}
          <Link href="/admin/stores">Back to admin panel →</Link>
        </p>
      )}

      <div className="hub-heading">
        <div>
          <span className="eyebrow">{isOwnStore ? "YOUR STORE / OVERVIEW" : `${store.name.toUpperCase()} / OVERVIEW`}</span>
          <h1>
            {isOwnStore ? <>Welcome back, {firstName}. </> : <>{store.name}. </>}
            <em>Your momentum.</em>
          </h1>
        </div>
      </div>

      {params.notice === "welcome" && (
        <p className="hub-flash">✳ Welcome to your creator hub! Your application is in — start by setting up your store.</p>
      )}

      {params.notice === "password-updated" && (
        <p className="hub-flash">✳ Your password has been updated.</p>
      )}

      <div className="hub-grid">
        <div className="dashboard-mock">
          <div className="dash-greeting">
            <div>
              <small>{store.name.toUpperCase()}</small>
              <h3>Your money, <em>your momentum.</em></h3>
              <p>Every order, every milestone, beautifully organized.</p>
            </div>
          </div>

          <div className="dash-tabs">
            <Link href={query({ period: "weeks" })} className={period === "weeks" ? "active" : ""}>
              This month · by week
            </Link>
            <Link href={query({ period: "months" })} className={period === "months" ? "active" : ""}>
              Last 4 months
            </Link>
          </div>

          <div className="dash-metrics hub-metrics">
            <div className="dash-earnings">
              <small>YOUR CREATOR EARNINGS ✳</small>
              <strong>{money(data.earnings, 2)}</strong>
              <span>{period === "weeks" ? "This month" : "Last 4 months"} · your {store.revenueShare}% share</span>
            </div>

            <div className="dash-balance">
              <small>AVAILABLE BALANCE $</small>
              <strong>{money(Math.max(0, balance?.balance ?? 0), 2)}</strong>
              <span>
                {money(balance?.paidOut ?? 0, 2)} paid out
                {(balance?.pendingPayouts ?? 0) > 0 && ` · ${money(balance!.pendingPayouts, 2)} pending`}
              </span>
            </div>

            <div className="dash-orders">
              <small>PRODUCT ORDERS ↗</small>
              <strong>{number(totalOrders)}</strong>
              <span>Completed orders</span>
            </div>
          </div>

          <div className="dash-chart">
            <div className="dash-chart-heading">
              <div>
                <strong>{data.title}</strong>
                <small>{data.note}</small>
              </div>
              <span>LIVE DATA</span>
            </div>

            <OrderBars labels={data.labels} orders={data.orders} />

            <small className="dash-chart-caption">
              {totalOrders === 0
                ? "No orders yet in this period — share your store to get started."
                : "Refunded orders are excluded."}
            </small>
          </div>

          <div className="dash-footer">
            <span>✳ /store/{store.slug}</span>
            <span>CREATOR SHARE <strong>{store.revenueShare}%</strong></span>
          </div>
        </div>

        <div className="hub-side">
          <section className="editor-panel">
            <div className="preview-heading">
              <h2>Recent orders</h2>
              <span className="eyebrow">{orders.length} TOTAL</span>
            </div>

            {orders.length === 0 ? (
              <p className="hub-empty">No orders yet. When customers buy from your store, they&apos;ll appear here.</p>
            ) : (
              <ul className="hub-list">
                {orders.slice(0, 6).map(order => (
                  <li key={order.id}>
                    <div>
                      <strong>{order.productName}</strong>
                      <small>
                        {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        {order.status === "refunded" && " · REFUNDED"}
                      </small>
                    </div>
                    <span className={order.status === "refunded" ? "hub-refunded" : ""}>
                      +{money(order.creatorAmount, 2)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="editor-panel">
            <div className="preview-heading">
              <h2>Your products</h2>
              <Link className="small-button" href="/dashboard/products">Open studio ↗</Link>
            </div>

            {products.length === 0 ? (
              <p className="hub-empty">No products yet. Add your first one in the product studio.</p>
            ) : (
              <ul className="hub-list">
                {products.slice(0, 5).map(product => (
                  <li key={product.id}>
                    <div>
                      <strong>{product.name}</strong>
                      <small>{product.category}</small>
                    </div>
                    <Link href={`/dashboard/products?product=${product.id}`}>Edit ↗</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="editor-panel">
            <div className="preview-heading">
              <h2>Payouts</h2>
              <span className="eyebrow">{money(Math.max(0, balance?.balance ?? 0), 2)} AVAILABLE</span>
            </div>

            <p className="hub-empty">
              {money(balance?.paidOut ?? 0, 2)} paid to you so far
              {(balance?.pendingPayouts ?? 0) > 0 && ` · ${money(balance!.pendingPayouts, 2)} on its way`}.
            </p>

            {payouts.length > 0 && (
              <ul className="hub-list">
                {payouts.filter(payout => payout.status !== "cancelled").slice(0, 4).map(payout => (
                  <li key={payout.id}>
                    <div>
                      <strong>{payout.method || "Payout"}</strong>
                      <small>{shortDate(payout.paidAt ?? payout.createdAt, true).toUpperCase()} · {payout.status.toUpperCase()}</small>
                    </div>
                    <span>{money(payout.amount, 2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
