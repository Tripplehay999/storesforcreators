import Link from "next/link";
import Icon from "@/components/hub/Icon";
import OverviewView from "@/components/hub/OverviewView";
import { getStoreBalance } from "@/lib/admin-data";
import { aiConfigured, type Recommendations } from "@/lib/ai";
import { getLatestInsight } from "@/lib/growth-data";
import { getOrderPage, getOrders, getProducts, getViewedStore, requireSession } from "@/lib/data";
import { parseRange, rangeStart, summarize } from "@/lib/stats";

type Props = {
  searchParams: Promise<{ range?: string; store?: string; notice?: string }>;
};

const NOTICES: Record<string, string> = {
  welcome: "Welcome to Stores for Creators! Start by setting up your store.",
  "password-updated": "Your password has been updated."
};

// AI ideas are generated from this page; give the request room to finish.
export const maxDuration = 120;

export default async function DashboardPage({ searchParams }: Props) {
  const session = await requireSession();
  const params = await searchParams;
  const firstName = session.profile.fullName.split(" ")[0] ?? "";
  const store = await getViewedStore(session, params.store);
  const notice = params.notice && NOTICES[params.notice];

  if (!store) {
    return (
      <>
        {notice && <div className="banner banner-pos"><Icon name="check" size={16} /><span>{notice}</span></div>}

        <section className="welcome">
          <h1>{firstName ? `Welcome, ${firstName}` : "Welcome"}</h1>
          <p>Your store is three steps away. Here&apos;s where to start.</p>

          <ol className="welcome-steps">
            <li>
              <span className="welcome-num">1</span>
              <div>
                <strong>Create your storefront</strong>
                <p>Choose your store address, name, photo and colours.</p>
              </div>
              <Link className="btn btn-primary" href="/dashboard/store">Start</Link>
            </li>
            <li className="is-locked">
              <span className="welcome-num">2</span>
              <div>
                <strong>Add your products</strong>
                <p>Set up photos, pricing, features and FAQs for each one.</p>
              </div>
            </li>
            <li className="is-locked">
              <span className="welcome-num">3</span>
              <div>
                <strong>Share it with your audience</strong>
                <p>Orders and earnings appear here as soon as they come in.</p>
              </div>
            </li>
          </ol>
        </section>
      </>
    );
  }

  const range = parseRange(params.range);
  const now = new Date();
  const aiOn = aiConfigured();
  const [orders, recent, products, balance, latest] = await Promise.all([
    getOrders(store.slug, rangeStart(range, now)),
    getOrderPage(store.slug, { page: 1, pageSize: 6 }),
    getProducts(store.slug),
    getStoreBalance(store.slug),
    aiOn ? getLatestInsight<Recommendations>(store.slug, "recommendations") : Promise.resolve({ ready: false, insight: null })
  ]);
  const isAdmin = session.profile.role === "admin";
  const adminHint = !isAdmin
    ? null
    : !aiOn
      ? "Add ANTHROPIC_API_KEY to your environment variables to give creators AI ideas. Only admins see this note."
      : !latest.ready
        ? "Run supabase/migrations/004_growth.sql to turn on AI ideas. Only admins see this note."
        : null;

  return (
    <>
      {notice && <div className="banner banner-pos"><Icon name="check" size={16} /><span>{notice}</span></div>}
      <OverviewView
        store={store}
        firstName={firstName}
        isOwnStore={store.slug === session.store?.slug}
        range={range}
        summary={summarize(orders, range, now)}
        balance={balance}
        recentOrders={recent.orders}
        products={products}
        now={now}
        ai={{ enabled: aiOn && latest.ready, initial: latest.insight, adminHint }}
      />
    </>
  );
}
