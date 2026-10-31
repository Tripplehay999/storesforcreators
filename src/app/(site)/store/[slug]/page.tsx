import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { InnerTop } from "@/components/InnerChrome";
import VisitTracker from "@/components/VisitTracker";
import { productImage, productLink, productPrice } from "@/lib/catalog";
import { getProducts, getStore } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const store = await getStore((await params).slug);
  return { title: store ? `${store.name} | Stores for Creators` : "Store not found" };
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params;
  const [store, products] = await Promise.all([getStore(slug), getProducts(slug)]);

  if (!store) notFound();

  return (
    <main className="subpage">
      <div className="store-page" style={{ "--store-bg": store.background } as CSSProperties}>

        <InnerTop back="/#stores" />
        <VisitTracker store={store.slug} />

        <section className="container store-hero">
          <div>
            <span className="eyebrow">{store.category}</span>
            <h1>{store.headline}<br /><em>{store.headlineEm}</em></h1>
            <p>{store.bio}</p>
            <a className="btn btn-dark" href="#store-collection">Shop the collection</a>
          </div>

          <div className="store-hero-photo">
            {store.image && <img src={store.image} alt={`${store.name} portrait`} />}
          </div>
        </section>

        <section className="store-collection" id="store-collection">
          <div className="container">
            <h2>Shop {store.name}</h2>

            <div className="store-product-grid">
              {products.map(product => (
                <article className="store-product-card" key={product.id}>
                  <Link href={productLink(product, store.slug)}>
                    <div className="store-product-image">
                      <img src={productImage(product)} alt={product.name} loading="lazy" />
                    </div>
                  </Link>

                  <div className="store-product-copy">
                    <small>{product.category}</small>
                    <h3>{product.name}</h3>
                    <p>{product.tagline}</p>
                    <strong>{productPrice(product)}</strong>
                    <Link href={productLink(product, store.slug)}>Explore product</Link>
                  </div>
                </article>
              ))}
            </div>

            {products.length === 0 && (
              <p className="store-empty">New products are on the way. Check back soon.</p>
            )}
          </div>
        </section>

      </div>
    </main>
  );
}
