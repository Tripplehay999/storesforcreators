import Link from "next/link";
import EarningsView from "@/components/hub/EarningsView";
import { Empty, PageHeader } from "@/components/hub/ui";
import { getAdjustments, getPayouts, getStoreBalance } from "@/lib/admin-data";
import { getOrderPage, getViewedStore, requireSession } from "@/lib/data";
import { getPayoutRequests } from "@/lib/growth-data";

type Props = {
  searchParams: Promise<{ status?: string; page?: string; store?: string }>;
};

const PAGE_SIZE = 20;

export default async function EarningsPage({ searchParams }: Props) {
  const session = await requireSession();
  const params = await searchParams;
  const store = await getViewedStore(session, params.store);

  if (!store) {
    return (
      <>
        <PageHeader title="Earnings" />
        <section className="card">
          <Empty title="No store yet">
            Your orders, earnings and payouts appear here once your store is set up.{" "}
            <Link className="link" href="/dashboard/store">Create your store</Link>
          </Empty>
        </section>
      </>
    );
  }

  const status = params.status === "completed" || params.status === "refunded" ? params.status : undefined;
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);

  const [orderPage, balance, payouts, adjustments, requests] = await Promise.all([
    getOrderPage(store.slug, { status, page, pageSize: PAGE_SIZE }),
    getStoreBalance(store.slug),
    getPayouts({ store: store.slug }),
    getAdjustments(store.slug),
    getPayoutRequests(store.slug)
  ]);

  return (
    <EarningsView
      store={store}
      isOwnStore={store.slug === session.store?.slug}
      status={status}
      page={page}
      pageSize={PAGE_SIZE}
      orders={orderPage.orders}
      total={orderPage.total}
      balance={balance}
      payouts={payouts}
      adjustments={adjustments}
      profile={session.profile}
      payoutRequests={requests.ready ? requests.requests : null}
    />
  );
}
