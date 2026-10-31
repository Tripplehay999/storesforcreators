import Link from "next/link";
import Icon from "@/components/hub/Icon";
import OverviewView from "@/components/hub/OverviewView";
import { getStoreBalance } from "@/lib/admin-data";
import { getOrderPage, getOrders, getProducts, getViewedStore, requireSession } from "@/lib/data";
import { parseRange, rangeStart, summarize } from "@/lib/stats";

type Props = {
  searchParams: Promise<{ range?: string; store?: string; notice?: string }>;
};

const NOTICES: Record<string, string> = {
  welcome: "Welcome to Stores for Creators! Start by setting up your store.",
  "password-updated": "Your password has been updated."
};

export default async function DashboardPage({ searchParams }: Props) {
  const session = await requireSession();
  const params = await searchParams;
  const firstName = session.profile.fullName.split(" ")[0] || "there";
  const store = await getViewedStore(session, params.store);
  const notice = params.notice && NOTICES[params.notice];

  if (!store) {
    return (
      <>
        {notice && <div className="banner banner-pos"><Icon name="check" size={16} /><span>{notice}</span></div>}

        <section className="welcome">
          <h1>Welcome, {firstName}</h1>
          <p>Your store is three steps away. Most creators finish in under ten minutes.</p>

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
  const [orders, recent, products, balance] = await Promise.all([
    getOrders(store.slug, rangeStart(range, now)),
    getOrderPage(store.slug, { page: 1, pageSize: 6 }),
    getProducts(store.slug),
    getStoreBalance(store.slug)
  ]);

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
      />
    </>
  );
}
