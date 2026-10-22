import Link from "next/link";
import Studio from "@/components/Studio";
import { getProducts, getViewedStore, requireSession } from "@/lib/data";

type Props = { searchParams: Promise<{ product?: string; store?: string }> };

export default async function ProductsPage({ searchParams }: Props) {
  const session = await requireSession();
  const { product, store: storeParam } = await searchParams;
  const store = await getViewedStore(session, storeParam);
  const stores = store ? [store] : [];

  const heading = (
    <div className="studio-heading hub-page-heading">
      <span className="eyebrow">PRODUCT DESIGN STUDIO</span>
      <h1>Make every product <em>your own.</em></h1>
      <p>
        Customize product photos, pricing, descriptions,
        features, FAQs, layouts, and branding.
      </p>
    </div>
  );

  if (stores.length === 0) {
    return (
      <>
        {heading}
        <section className="editor-panel hub-callout">
          <h2>First, create your storefront.</h2>
          <p className="hub-empty">Products live inside your store. Set it up in a minute, then come back here.</p>
          <Link className="btn btn-dark" href="/dashboard/store">Create my store ↗</Link>
        </section>
      </>
    );
  }

  const products = await getProducts(store!.slug);

  return (
    <>
      {store!.slug !== session.store?.slug && (
        <p className="hub-flash hub-flash-admin">
          ✳ Editing {store!.name}&apos;s products as an admin.{" "}
          <Link href="/admin/products">Back to admin panel →</Link>
        </p>
      )}
      {heading}
      <Studio
        initialProducts={products}
        stores={stores.map(({ slug, name }) => ({ slug, name }))}
        initialId={product}
        ownStore={session.store?.slug ?? null}
        userId={session.profile.id}
      />
    </>
  );
}
