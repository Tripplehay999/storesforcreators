import Link from "next/link";
import { getAdjustments, getPayouts, getStoreBalance } from "@/lib/admin-data";
import { getOrderPage, getOrders, getViewedStore, requireSession } from "@/lib/data";
import { money, number, shortDate, TIME_ZONE } from "@/lib/format";
import type { Order } from "@/lib/types";

type Props = {
  searchParams: Promise<{ status?: string; page?: string; store?: string }>;
};

const PAGE_SIZE = 20;

const STATUS_FILTERS: [Order["status"] | "", string][] = [
  ["", "All orders"],
  ["completed", "Completed"],
  ["refunded", "Refunded"]
];

function timeOf(value: string) {
  return new Date(value).toLocaleString("en-US", {
    timeZone: TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short"
  });
}

// Lifetime earnings per product, from completed orders.
function topProducts(orders: Order[]) {
  const byProduct = new Map<string, { name: string; orders: number; earned: number }>();

  orders
    .filter(order => order.status === "completed")
    .forEach(order => {
      const key = order.productId ?? order.productName;
      const entry = byProduct.get(key) ?? { name: order.productName, orders: 0, earned: 0 };
      entry.orders += 1;
      entry.earned += order.creatorAmount;
      byProduct.set(key, entry);
    });

  return [...byProduct.values()].sort((a, b) => b.earned - a.earned).slice(0, 5);
}

export default async function EarningsPage({ searchParams }: Props) {
  const session = await requireSession();
  const params = await searchParams;
  const store = await getViewedStore(session, params.store);

  const heading = (
    <div className="hub-heading">
      <div>
        <span className="eyebrow">EARNINGS & PAYOUTS</span>
        <h1>Every sale, <em>every dollar.</em></h1>
      </div>
    </div>
  );

  if (!store) {
    return (
      <>
        {heading}
        <section className="editor-panel hub-callout">
          <h2>First, create your storefront.</h2>
          <p className="hub-empty">Your orders, earnings, and payouts will show up here once your store is live.</p>
          <Link className="btn btn-dark" href="/dashboard/store">Create my store ↗</Link>
        </section>
      </>
    );
  }

  const isOwnStore = store.slug === session.store?.slug;
  const status = params.status === "completed" || params.status === "refunded" ? params.status : undefined;
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);

  const [orderPage, allOrders, balance, payouts, adjustments] = await Promise.all([
    getOrderPage(store.slug, { status, page, pageSize: PAGE_SIZE }),
    getOrders(store.slug),
    getStoreBalance(store.slug),
    getPayouts({ store: store.slug }),
    getAdjustments(store.slug)
  ]);

  const pages = Math.max(1, Math.ceil(orderPage.total / PAGE_SIZE));
  const query = (next: Record<string, string | undefined>) => {
    const values = { store: isOwnStore ? undefined : store.slug, status, page: undefined, ...next };
    const search = new URLSearchParams(
      Object.entries(values).filter((entry): entry is [string, string] => Boolean(entry[1]))
    ).toString();
    return search ? `?${search}` : "?";
  };

  // Payouts and admin credits/deductions, newest first.
  const history = [
    ...payouts.map(payout => ({
      id: payout.id,
      date: payout.paidAt ?? payout.createdAt,
      title: payout.method ? `Payout · ${payout.method}` : "Payout",
      detail: payout.status === "paid" ? "PAID" : payout.status === "pending" ? "ON ITS WAY" : "CANCELLED",
      amount: -payout.amount,
      struck: payout.status === "cancelled"
    })),
    ...adjustments.map(adjustment => ({
      id: adjustment.id,
      date: adjustment.createdAt,
      title: adjustment.reason,
      detail: adjustment.amount > 0 ? "CREDIT" : "DEDUCTION",
      amount: adjustment.amount,
      struck: false
    }))
  ].sort((a, b) => b.date.localeCompare(a.date));

  const products = topProducts(allOrders);
  const exportHref = `/dashboard/export${isOwnStore ? "" : `?store=${store.slug}`}`;

  return (
    <>
      {!isOwnStore && (
        <p className="hub-flash hub-flash-admin">
          ✳ Viewing {store.name}&apos;s earnings as an admin.{" "}
          <Link href="/admin/stores">Back to admin panel →</Link>
        </p>
      )}

      {heading}

      <div className="dash-metrics hub-kpis">
        <div className="dash-earnings">
          <small>LIFETIME EARNINGS ✳</small>
          <strong>{money((balance?.earned ?? 0) + (balance?.adjustments ?? 0), 2)}</strong>
          <span>{number(balance?.orderCount ?? 0)} completed orders · your {store.revenueShare}% share</span>
        </div>
        <div className="dash-balance">
          <small>AVAILABLE BALANCE $</small>
          <strong>{money(balance?.balance ?? 0, 2)}</strong>
          <span>Ready for your next payout</span>
        </div>
        <div className="dash-orders">
          <small>PAID OUT</small>
          <strong>{money(balance?.paidOut ?? 0, 2)}</strong>
          <span>Sent to you so far</span>
        </div>
        <div className="dash-orders">
          <small>ON ITS WAY</small>
          <strong>{money(balance?.pendingPayouts ?? 0, 2)}</strong>
          <span>Scheduled payouts</span>
        </div>
      </div>

      <div className="hub-grid">
        <section className="editor-panel">
          <div className="preview-heading">
            <h2>Orders</h2>
            <a className="small-button" href={exportHref} download>Download CSV ↓</a>
          </div>

          <nav className="dash-tabs hub-filter" aria-label="Filter orders">
            {STATUS_FILTERS.map(([value, label]) => (
              <Link
                key={label}
                href={query({ status: value || undefined })}
                className={(status ?? "") === value ? "active" : ""}
              >
                {label}
              </Link>
            ))}
          </nav>

          {orderPage.orders.length === 0 ? (
            <p className="hub-empty">
              {page > 1
                ? <>Nothing on this page. <Link href={query({})}>Back to the first page →</Link></>
                : status
                  ? `No ${status} orders yet.`
                  : "No orders yet. When customers buy from your store, they'll appear here."}
            </p>
          ) : (
            <ul className="hub-list hub-orders">
              {orderPage.orders.map(order => (
                <li key={order.id}>
                  <details>
                    <summary>
                      <div>
                        <strong>{order.productName}</strong>
                        <small>
                          {shortDate(order.createdAt, true).toUpperCase()}
                          {order.status === "refunded" && " · REFUNDED"}
                        </small>
                      </div>
                      <span className={order.status === "refunded" ? "hub-refunded" : ""}>
                        +{money(order.creatorAmount, 2)}
                      </span>
                    </summary>

                    <dl className="hub-order-detail">
                      <dt>Sale price</dt>
                      <dd>{money(order.amount, 2)}</dd>
                      <dt>Platform share</dt>
                      <dd>−{money(order.amount - order.creatorAmount, 2)}</dd>
                      <dt>Your share</dt>
                      <dd><strong>{money(order.creatorAmount, 2)}</strong></dd>
                      <dt>Status</dt>
                      <dd>{order.status === "completed" ? "Completed" : "Refunded — not counted in your balance"}</dd>
                      <dt>Placed</dt>
                      <dd>{timeOf(order.createdAt)}</dd>
                      <dt>Order ID</dt>
                      <dd className="hub-mono">{order.id}</dd>
                    </dl>
                  </details>
                </li>
              ))}
            </ul>
          )}

          {pages > 1 && (
            <div className="hub-pager">
              {page > 1 ? <Link className="small-button" href={query({ page: String(page - 1) })}>← Newer</Link> : <span />}
              <small>PAGE {page} OF {pages} · {number(orderPage.total)} ORDERS</small>
              {page < pages ? <Link className="small-button" href={query({ page: String(page + 1) })}>Older →</Link> : <span />}
            </div>
          )}
        </section>

        <div className="hub-side">
          <section className="editor-panel">
            <div className="preview-heading">
              <h2>Money history</h2>
            </div>

            {history.length === 0 ? (
              <p className="hub-empty">No payouts or balance changes yet.</p>
            ) : (
              <ul className="hub-list">
                {history.map(item => (
                  <li key={item.id}>
                    <div>
                      <strong title={item.title}>{item.title}</strong>
                      <small>{shortDate(item.date, true).toUpperCase()} · {item.detail}</small>
                    </div>
                    <span className={item.struck ? "hub-refunded" : item.amount > 0 ? "hub-credit" : ""}>
                      {item.amount > 0 ? "+" : "−"}{money(Math.abs(item.amount), 2)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="editor-panel">
            <div className="preview-heading">
              <h2>Top products</h2>
              <span className="eyebrow">ALL TIME</span>
            </div>

            {products.length === 0 ? (
              <p className="hub-empty">Your best sellers will show up here after your first sale.</p>
            ) : (
              <ul className="hub-list">
                {products.map((product, index) => (
                  <li key={`${product.name}-${index}`}>
                    <div>
                      <strong>{product.name}</strong>
                      <small>{number(product.orders)} ORDER{product.orders === 1 ? "" : "S"}</small>
                    </div>
                    <span>{money(product.earned, 2)}</span>
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
