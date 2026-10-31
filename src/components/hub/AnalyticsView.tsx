import Link from "next/link";
import type { Visit } from "@/lib/growth-data";
import { money, number } from "@/lib/format";
import { sourceLabel } from "@/lib/sources";
import { change, rangeFrame, RANGES, type Range } from "@/lib/stats";
import type { Order, Product, Store } from "@/lib/types";
import BarChart from "./BarChart";
import { AdminBanner, Empty, PageHeader, StatCard } from "./ui";

export const ANALYTICS_RANGES = RANGES.filter(range => range.value !== "12m");

type Props = {
  store: Store;
  isOwnStore: boolean;
  range: Range;
  visits: Visit[];
  orders: Order[];
  products: Product[];
  now?: Date;
};

function percent(part: number, whole: number) {
  return whole > 0 ? (part / whole) * 100 : 0;
}

export default function AnalyticsView({ store, isOwnStore, range, visits, orders, products, now = new Date() }: Props) {
  const frame = rangeFrame(range, now);
  const buckets = frame.labels.map(label => ({ ...label, values: { visits: 0, orders: 0 } }));
  const current = { visits: 0, orders: 0, sales: 0 };
  const previous = { visits: 0, orders: 0, sales: 0 };
  const sources = new Map<string, number>();
  const productViews = new Map<string, number>();
  const productOrders = new Map<string, number>();
  let storePageViews = 0;

  visits.forEach(visit => {
    const { period, bucket } = frame.locate(visit.hour);
    if (period === "previous") previous.visits += visit.views;
    if (period !== "current") return;

    current.visits += visit.views;
    buckets[bucket].values.visits += visit.views;
    sources.set(visit.source, (sources.get(visit.source) ?? 0) + visit.views);
    if (visit.productId) productViews.set(visit.productId, (productViews.get(visit.productId) ?? 0) + visit.views);
    else storePageViews += visit.views;
  });

  orders.filter(order => order.status === "completed").forEach(order => {
    const { period, bucket } = frame.locate(order.createdAt);
    if (period === "previous") {
      previous.orders += 1;
      previous.sales += order.amount;
    }
    if (period !== "current") return;

    current.orders += 1;
    current.sales += order.amount;
    buckets[bucket].values.orders += 1;
    if (order.productId) productOrders.set(order.productId, (productOrders.get(order.productId) ?? 0) + 1);
  });

  const conversion = percent(current.orders, current.visits);
  const previousConversion = percent(previous.orders, previous.visits);
  const perVisit = current.visits ? current.sales / current.visits : 0;
  const previousPerVisit = previous.visits ? previous.sales / previous.visits : 0;
  const rangeInfo = RANGES.find(item => item.value === range)!;
  const compared = `vs previous ${rangeInfo.long.replace("Last ", "")}`;
  const sourceRows = [...sources.entries()].sort((a, b) => b[1] - a[1]);
  const productRows = products
    .map(product => {
      const views = productViews.get(product.id) ?? 0;
      const sold = productOrders.get(product.id) ?? 0;
      return { product, views, sold, conversion: percent(sold, views) };
    })
    .sort((a, b) => b.views - a.views || b.sold - a.sold);

  const withRange = (value: Range) =>
    `/dashboard/analytics?${new URLSearchParams({ ...(isOwnStore ? {} : { store: store.slug }), range: value })}`;

  return (
    <>
      {!isOwnStore && <AdminBanner storeName={store.name} back="/admin/stores" />}

      <PageHeader title="Analytics" description={<>Who visits your store, where they come from, and what they buy. {rangeInfo.long}.</>}>
        <nav className="segmented" aria-label="Date range">
          {ANALYTICS_RANGES.map(item => (
            <Link key={item.value} href={withRange(item.value)} className={item.value === range ? "active" : ""} aria-current={item.value === range ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
      </PageHeader>

      <div className="stats">
        <StatCard label="Visits" value={number(current.visits)} delta={change(current.visits, previous.visits)} hint={compared} />
        <StatCard label="Orders" value={number(current.orders)} delta={change(current.orders, previous.orders)} hint={compared} />
        <StatCard label="Conversion rate" value={`${conversion.toFixed(1)}%`} delta={change(conversion, previousConversion)} hint="Orders per visit" />
        <StatCard label="Sales per visit" value={money(perVisit, 2)} delta={change(perVisit, previousPerVisit)} hint={compared} />
      </div>

      <div className="grid-main">
        <section className="card">
          <div className="card-head">
            <h2>Traffic</h2>
            <span className="muted">{number(storePageViews)} store page · {number(current.visits - storePageViews)} product pages</span>
          </div>
          <BarChart
            buckets={buckets}
            metrics={[
              { key: "visits", label: "Visits", unit: "visits", kind: "count" },
              { key: "orders", label: "Orders", unit: "orders", kind: "count" }
            ]}
          />
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Where visitors come from</h2>
          </div>
          {sourceRows.length === 0 ? (
            <Empty title="No visits yet">
              Share your store link to start seeing where your visitors come from.{" "}
              <Link className="link" href="/dashboard/promote">Get your share links</Link>
            </Empty>
          ) : (
            <ol className="ranked">
              {sourceRows.map(([source, views]) => (
                <li key={source}>
                  <div className="ranked-top">
                    <span className="ranked-name">{sourceLabel(source)}</span>
                    <span className="num">{number(views)}</span>
                  </div>
                  <div className="ranked-bar" aria-hidden="true">
                    <span style={{ width: `${percent(views, sourceRows[0][1])}%` }} />
                  </div>
                  <span className="muted">{percent(views, current.visits).toFixed(0)}% of visits</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="card card-flush">
        <div className="card-head">
          <h2>Products</h2>
          <span className="muted">{rangeInfo.long}</span>
        </div>
        {productRows.length === 0 ? (
          <Empty title="No products yet">Add a product to see how it performs.</Empty>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col" className="num">Page views</th>
                  <th scope="col" className="num">Orders</th>
                  <th scope="col" className="num">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {productRows.map(row => (
                  <tr key={row.product.id}>
                    <th scope="row">{row.product.name}</th>
                    <td className="num">{number(row.views)}</td>
                    <td className="num">{number(row.sold)}</td>
                    <td className="num">{row.views ? `${row.conversion.toFixed(1)}%` : "—"}</td>
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
