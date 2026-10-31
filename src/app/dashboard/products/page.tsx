import Link from "next/link";
import { AdminBanner, Empty, PageHeader } from "@/components/hub/ui";
import Studio from "@/components/Studio";
import { getProducts, getViewedStore, requireSession } from "@/lib/data";

type Props = { searchParams: Promise<{ product?: string; store?: string }> };

export default async function ProductsPage({ searchParams }: Props) {
  const session = await requireSession();
  const { product, store: storeParam } = await searchParams;
  const store = await getViewedStore(session, storeParam);

  if (!store) {
    return (
      <>
        <PageHeader title="Products" />
        <section className="card">
          <Empty title="Create your store first">
            Products live inside your store. Set it up in a minute, then come back here.{" "}
            <Link className="link" href="/dashboard/store">Create your store</Link>
          </Empty>
        </section>
      </>
    );
  }

  const products = await getProducts(store.slug);
  const isOwnStore = store.slug === session.store?.slug;

  return (
    <>
      {!isOwnStore && <AdminBanner storeName={store.name} back="/admin/products" />}
      <PageHeader title="Products" description="Everything you sell. Changes are live as soon as you save." />
      <Studio
        initialProducts={products}
        stores={[{ slug: store.slug, name: store.name }]}
        initialId={product}
        ownStore={session.store?.slug ?? null}
        userId={session.profile.id}
      />
    </>
  );
}
