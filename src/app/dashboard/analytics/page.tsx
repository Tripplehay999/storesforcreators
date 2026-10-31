import Link from "next/link";
import AnalyticsView, { ANALYTICS_RANGES } from "@/components/hub/AnalyticsView";
import { Empty, PageHeader } from "@/components/hub/ui";
import { getOrders, getProducts, getViewedStore, requireSession } from "@/lib/data";
import { getVisits } from "@/lib/growth-data";
import { parseRange, rangeStart } from "@/lib/stats";

type Props = { searchParams: Promise<{ range?: string; store?: string }> };

export default async function AnalyticsPage({ searchParams }: Props) {
  const session = await requireSession();
  const params = await searchParams;
  const store = await getViewedStore(session, params.store);

  if (!store) {
    return (
      <>
        <PageHeader title="Analytics" />
        <section className="card">
          <Empty title="No store yet">
            Analytics start as soon as your store is live. <Link className="link" href="/dashboard/store">Create your store</Link>
          </Empty>
        </section>
      </>
    );
  }

  const parsed = parseRange(params.range);
  const range = ANALYTICS_RANGES.some(item => item.value === parsed) ? parsed : "30d";
  const now = new Date();
  const since = rangeStart(range, now);
  const [visits, orders, products] = await Promise.all([
    getVisits(store.slug, since),
    getOrders(store.slug, since),
    getProducts(store.slug)
  ]);

  if (!visits.ready) {
    return (
      <>
        <PageHeader title="Analytics" />
        <section className="card">
          <Empty title="Analytics are almost ready">
            {session.profile.role === "admin"
              ? "Run supabase/migrations/004_growth.sql in Supabase to start tracking visits."
              : "Visit tracking is being switched on for your store. Check back soon."}
          </Empty>
        </section>
      </>
    );
  }

  return (
    <AnalyticsView
      store={store}
      isOwnStore={store.slug === session.store?.slug}
      range={range}
      visits={visits.visits}
      orders={orders}
      products={products}
      now={now}
    />
  );
}
