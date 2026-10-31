import Link from "next/link";
import type { Adjustment, Payout, StoreBalance } from "@/lib/admin-data";
import { money, number, shortDate } from "@/lib/format";
import type { Order, Store } from "@/lib/types";
import Icon from "./Icon";
import { AdminBanner, Empty, OrderRows, PageHeader, StatCard } from "./ui";

export type EarningsProps = {
  store: Store;
  isOwnStore: boolean;
  status?: Order["status"];
  page: number;
  pageSize: number;
  orders: Order[];
  total: number;
  balance: StoreBalance | null;
  payouts: Payout[];
  adjustments: Adjustment[];
};

const FILTERS: [Order["status"] | undefined, string][] = [
  [undefined, "All"],
  ["completed", "Completed"],
  ["refunded", "Refunded"]
];

export default function EarningsView({
  store, isOwnStore, status, page, pageSize, orders, total, balance, payouts, adjustments
}: EarningsProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (next: { status?: string; page?: number }) => {
    const values = { store: isOwnStore ? undefined : store.slug, status, ...next };
    const search = new URLSearchParams(
      Object.entries(values)
        .filter(([, value]) => value !== undefined && value !== "" && !(typeof value === "number" && value <= 1))
        .map(([key, value]) => [key, String(value)])
    ).toString();
    return `/dashboard/earnings${search ? `?${search}` : ""}`;
  };

  // Payouts and admin credits/deductions, newest first.
  const history = [
    ...payouts.map(payout => ({
      id: payout.id,
      date: payout.paidAt ?? payout.createdAt,
      title: payout.method ? `Payout via ${payout.method}` : "Payout",
      badge: payout.status === "paid"
        ? <span className="badge badge-pos">Paid</span>
        : payout.status === "pending"
          ? <span className="badge badge-warn">Pending</span>
          : <span className="badge badge-muted">Cancelled</span>,
      amount: -payout.amount,
      void: payout.status === "cancelled"
    })),
    ...adjustments.map(adjustment => ({
      id: adjustment.id,
      date: adjustment.createdAt,
      title: adjustment.reason,
      badge: <span className="badge badge-muted">{adjustment.amount > 0 ? "Credit" : "Deduction"}</span>,
      amount: adjustment.amount,
      void: false
    }))
  ].sort((a, b) => b.date.localeCompare(a.date));

  const exportHref = `/dashboard/export${isOwnStore ? "" : `?store=${encodeURIComponent(store.slug)}`}`;
  const lifetime = (balance?.earned ?? 0) + (balance?.adjustments ?? 0);

  return (
    <>
      {!isOwnStore && <AdminBanner storeName={store.name} back="/admin/stores" />}

      <PageHeader title="Earnings" description="Every sale, payout and balance change on your store.">
        <a className="btn btn-secondary" href={exportHref} download>
          <Icon name="download" size={16} /> Export CSV
        </a>
      </PageHeader>

      <div className="stats">
        <StatCard label="Available balance" value={money(balance?.balance ?? 0, 2)} hint="Ready for your next payout" />
        <StatCard label="On its way" value={money(balance?.pendingPayouts ?? 0, 2)} hint="Scheduled payouts" />
        <StatCard label="Paid out" value={money(balance?.paidOut ?? 0, 2)} hint="Sent to you so far" />
        <StatCard
          label="Lifetime earnings"
          value={money(lifetime, 2)}
          hint={`${number(balance?.orderCount ?? 0)} orders · ${store.revenueShare}% share`}
        />
      </div>

      <div className="grid-main">
        <section className="card card-flush">
          <div className="card-head">
            <h2>Orders</h2>
            <nav className="segmented segmented-sm" aria-label="Filter orders">
              {FILTERS.map(([value, label]) => (
                <Link
                  key={label}
                  href={href({ status: value ?? "", page: 1 })}
                  className={status === value ? "active" : ""}
                  aria-current={status === value ? "page" : undefined}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {orders.length === 0 ? (
            page > 1 ? (
              <Empty title="Nothing on this page">
                <Link className="link" href={href({ page: 1 })}>Go to the first page</Link>
              </Empty>
            ) : (
              <Empty title={status ? `No ${status} orders` : "No orders yet"}>
                {status ? "Try another filter." : "When customers buy from your store, every sale is listed here."}
              </Empty>
            )
          ) : (
            <OrderRows orders={orders} />
          )}

          {pages > 1 && (
            <div className="pager">
              <span className="muted">
                {number((page - 1) * pageSize + 1)}–{number(Math.min(page * pageSize, total))} of {number(total)}
              </span>
              <div>
                {page > 1
                  ? <Link className="btn btn-secondary btn-sm" href={href({ page: page - 1 })}><Icon name="left" size={14} /> Newer</Link>
                  : <span className="btn btn-secondary btn-sm is-disabled"><Icon name="left" size={14} /> Newer</span>}
                {page < pages
                  ? <Link className="btn btn-secondary btn-sm" href={href({ page: page + 1 })}>Older <Icon name="right" size={14} /></Link>
                  : <span className="btn btn-secondary btn-sm is-disabled">Older <Icon name="right" size={14} /></span>}
              </div>
            </div>
          )}
        </section>

        <section className="card card-flush">
          <div className="card-head">
            <h2>Payouts &amp; adjustments</h2>
          </div>

          {history.length === 0 ? (
            <Empty title="No payouts yet">
              Payouts are sent from your available balance. Each one, and any manual credit or
              deduction with its reason, is recorded here.
            </Empty>
          ) : (
            <ul className="rows">
              {history.map(item => (
                <li key={item.id}>
                  <div className="rows-main">
                    <span className="rows-title" title={item.title}>{item.title}</span>
                    <span className="rows-meta">{shortDate(item.date, true)} {item.badge}</span>
                  </div>
                  <span className={`num rows-amount${item.void ? " is-void" : item.amount > 0 ? " is-pos" : ""}`}>
                    {item.amount > 0 ? "+" : "−"}{money(Math.abs(item.amount), 2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
