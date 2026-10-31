import Link from "next/link";
import CaptionWriter from "@/components/hub/CaptionWriter";
import DiscountCodes from "@/components/hub/DiscountCodes";
import ShareKit from "@/components/hub/ShareKit";
import { AdminBanner, Empty, PageHeader } from "@/components/hub/ui";
import { aiConfigured } from "@/lib/ai";
import { getProducts, getViewedStore, requireSession } from "@/lib/data";
import { getDiscountCodes } from "@/lib/growth-data";
import { siteUrl } from "@/lib/site";

// Captions are generated from this page; give the request room to finish.
export const maxDuration = 120;

type Props = { searchParams: Promise<{ store?: string }> };

export default async function PromotePage({ searchParams }: Props) {
  const session = await requireSession();
  const store = await getViewedStore(session, (await searchParams).store);

  if (!store) {
    return (
      <>
        <PageHeader title="Promote" />
        <section className="card">
          <Empty title="No store yet">
            Share links and discount codes are ready once your store is. <Link className="link" href="/dashboard/store">Create your store</Link>
          </Empty>
        </section>
      </>
    );
  }

  const isOwnStore = store.slug === session.store?.slug;
  const [products, codes, site] = await Promise.all([getProducts(store.slug), getDiscountCodes(store.slug), siteUrl()]);
  const productList = products.map(product => ({ id: product.id, name: product.name }));
  const liveCodes = codes.codes.filter(code => code.active).map(code => code.code);

  return (
    <>
      {!isOwnStore && <AdminBanner storeName={store.name} back="/admin/stores" />}
      <PageHeader title="Promote" description="Everything you need to share your store and turn followers into buyers." />

      <div className="grid-main">
        <div className="stack">
          <ShareKit siteUrl={site} storeSlug={store.slug} storeName={store.name} products={productList} />
          {aiConfigured() && codes.ready && <CaptionWriter products={productList} codes={liveCodes} />}
        </div>

        {codes.ready ? (
          <DiscountCodes storeSlug={store.slug} codes={codes.codes} viewingStore={isOwnStore ? undefined : store.slug} />
        ) : (
          <section className="card">
            <Empty title="Discount codes are almost ready">
              {session.profile.role === "admin"
                ? "Run supabase/migrations/004_growth.sql in Supabase to turn on discount codes and AI captions."
                : "Discount codes are being switched on for your store. Check back soon."}
            </Empty>
          </section>
        )}
      </div>
    </>
  );
}
