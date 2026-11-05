import Link from "next/link";
import type { StoreBalance } from "@/lib/admin-data";
import type { Recommendations } from "@/lib/ai";
import { money, number } from "@/lib/format";
import { greeting } from "@/lib/greeting";
import { change, RANGES, type Range, type RangeSummary } from "@/lib/stats";
import type { Order, Product, Store } from "@/lib/types";
import BarChart from "./BarChart";
import Icon from "./Icon";
import IdeasCard from "./IdeasCard";
import { AdminBanner, Empty, OrderRows, PageHeader, StatCard } from "./ui";
import { storePath } from "@/lib/store-links";

export type OverviewProps = {
  store: Store;
  firstName: string;
  isOwnStore: boolean;
  range: Range;
  summary: RangeSummary;
  balance: StoreBalance | null;
  recentOrders: Order[];
  products: Product[];
  now?: Date;
  /** AI ideas: the card only appears once the feature is available. */
  ai: { enabled: boolean; initial: { payload: Recommendations; createdAt: string } | null };
};

const CHART_METRICS = [
  { key: "earnings", label: "Your earnings", unit: "earned", kind: "money" as const },
  { key: "orders", label: "Orders", unit: "orders", kind: "count" as const }
];

function Checklist({ store, products, balance, storeQuery }: {
  store: Store;
  products: Product[];
  balance: StoreBalance | null;
  storeQuery: string;
}) {
  const steps = [
    { done: true, label: "Create your store", href: "/dashboard/store" },
    { done: Boolean(store.image), label: "Add a portrait photo", href: "/dashboard/store" },
    { done: Boolean(store.bio), label: "Write a short bio", href: "/dashboard/store" },
    { done: products.length > 0, label: "Add your first product", href: `/dashboard/products${storeQuery}` },
    { done: store.published, label: "Make your store public", href: "/dashboard/store" },
    { done: (balance?.orderCount ?? 0) > 0, label: "Make your first sale", href: storePath(store.slug) }
  ];
  const done = steps.filter(step => step.done).length;

  if (done === steps.length) return null;

  return (
    <section className="card">
      <div className="card-head">
        <h2>Finish setting up</h2>
        <span className="muted">{done} of {steps.length}</span>
      </div>
      <div className="progress" aria-hidden="true"><span style={{ width: `${(done / steps.length) * 100}%` }} /></div>
      <ul className="checklist">
        {steps.map(step => (
          <li key={step.label} className={step.done ? "done" : ""}>
            <span className="check" aria-hidden="true">{step.done && <Icon name="check" size={12} />}</span>
            {step.done ? (
              <span>{step.label}</span>
            ) : (
              <Link href={step.href}>{step.label}<Icon name="right" size={14} /></Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function OverviewView({
  store, firstName, isOwnStore, range, summary, balance, recentOrders, products, now = new Date(), ai
}: OverviewProps) {
  const storeQuery = isOwnStore ? "" : `?store=${encodeURIComponent(store.slug)}`;
  const withRange = (value: Range) =>
    `/dashboard?${new URLSearchParams({ ...(isOwnStore ? {} : { store: store.slug }), range: value })}`;
  const rangeInfo = RANGES.find(item => item.value === range)!;
  const { current, previous } = summary;
  const average = current.orders ? current.sales / current.orders : 0;
  const previousAverage = previous.orders ? previous.sales / previous.orders : 0;
  const compared = `vs previous ${rangeInfo.long.replace("Last ", "")}`;

  return (
    <>
      {!isOwnStore && <AdminBanner storeName={store.name} back="/admin/stores" />}

      <PageHeader
        title={isOwnStore ? greeting(firstName, now) : store.name}
        description={<>Here&apos;s how your store did over the {rangeInfo.long.toLowerCase()}.</>}
      >
        <nav className="segmented" aria-label="Date range" data-tour="range">
          {RANGES.map(item => (
            <Link
              key={item.value}
              href={withRange(item.value)}
              className={item.value === range ? "active" : ""}
              aria-current={item.value === range ? "page" : undefined}
              title={item.long}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </PageHeader>

      <div className="stats">
        <StatCard label="Your earnings" value={money(current.earnings, 2)} delta={change(current.earnings, previous.earnings)} hint={compared} />
        <StatCard label="Orders" value={number(current.orders)} delta={change(current.orders, previous.orders)} hint={compared} />
        <StatCard label="Gross sales" value={money(current.sales, 2)} delta={change(current.sales, previous.sales)} hint={compared} />
        <StatCard label="Average order" value={money(average, 2)} delta={change(average, previousAverage)} hint={compared} />
      </div>

      <div className="grid-main">
        <section className="card">
          <div className="card-head">
            <h2>Performance</h2>
            <span className="muted">Completed orders · refunds excluded</span>
          </div>
          <BarChart
            metrics={CHART_METRICS}
            buckets={summary.buckets.map(bucket => ({
              label: bucket.label,
              tooltip: bucket.tooltip,
              values: { earnings: bucket.earnings, orders: bucket.orders }
            }))}
          />
        </section>

        <div className="stack">
          <section className="card balance-card" data-tour="balance">
            <div className="card-head">
              <h2>Balance</h2>
              <Link className="link" href={`/dashboard/earnings${storeQuery}`}>Payouts</Link>
            </div>
            <span className="stat-label">Available to pay out</span>
            <strong className={`balance-value${(balance?.balance ?? 0) < 0 ? " is-negative" : ""}`}>
              {money(balance?.balance ?? 0, 2)}
            </strong>
            <dl className="balance-rows">
              <div><dt>On its way</dt><dd>{money(balance?.pendingPayouts ?? 0, 2)}</dd></div>
              <div><dt>Paid out to date</dt><dd>{money(balance?.paidOut ?? 0, 2)}</dd></div>
              <div><dt>Your revenue share</dt><dd>{balance?.revenueShare ?? 0}%</dd></div>
            </dl>
          </section>

          <Checklist store={store} products={products} balance={balance} storeQuery={storeQuery} />
        </div>
      </div>

      {ai.enabled && <IdeasCard viewingStore={isOwnStore ? undefined : store.slug} initial={ai.initial} />}

      <div className="grid-main">
        <section className="card card-flush">
          <div className="card-head">
            <h2>Recent orders</h2>
            <Link className="link" href={`/dashboard/earnings${storeQuery}`}>View all</Link>
          </div>
          {recentOrders.length === 0 ? (
            <Empty title="No orders yet">
              When someone buys from your store, the sale shows up here.
            </Empty>
          ) : (
            <OrderRows orders={recentOrders} />
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Top products</h2>
            <span className="muted">{rangeInfo.long}</span>
          </div>
          {summary.products.length === 0 ? (
            <Empty title="Nothing sold in this period">
              {products.length === 0
                ? <><Link className="link" href={`/dashboard/products${storeQuery}`}>Add a product</Link> to start selling.</>
                : "Try a longer date range, or share your store to get the first sale."}
            </Empty>
          ) : (
            <ol className="ranked">
              {summary.products.map((product, index) => (
                <li key={`${product.name}-${index}`}>
                  <div className="ranked-top">
                    <span className="ranked-name">{product.name}</span>
                    <span className="num">{money(product.earnings, 2)}</span>
                  </div>
                  <div className="ranked-bar" aria-hidden="true">
                    <span style={{ width: `${(product.earnings / summary.products[0].earnings) * 100}%` }} />
                  </div>
                  <span className="muted">{product.orders} order{product.orders === 1 ? "" : "s"}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}
