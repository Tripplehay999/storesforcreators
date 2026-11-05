import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import Icon from "@/components/hub/Icon";
import { FeatureCard, ProductCard } from "@/components/storefront/ProductCards";
import StoreBar from "@/components/storefront/StoreBar";
import StoreFooter from "@/components/storefront/StoreFooter";
import TestingNote from "@/components/storefront/TestingNote";
import VisitTracker from "@/components/VisitTracker";
import { chargeable, checkoutAccess, productsWithFiles, stripeTestMode } from "@/lib/checkout";
import { getProducts, getStore } from "@/lib/data";
import { emailConfigured } from "@/lib/email";
import { shareableImage, SITE_SHARE_IMAGE, SITE_TWITTER_IMAGE } from "@/lib/share";
import type { Product } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const store = await getStore((await params).slug);
  if (!store) return { title: "Store not found" };

  const title = `${store.name} | Stores for Creators`;
  const description = store.description || store.bio || `Shop ${store.name}.`;
  // Link previews show the creator's photo when there is one; otherwise the site's own card.
  const photo = shareableImage(store.image);

  return {
    title,
    description,
    openGraph: { type: "website", title, description, images: [photo ? { url: photo, alt: store.name } : SITE_SHARE_IMAGE] },
    twitter: photo
      ? { card: "summary", title, description, images: [photo] }
      : { card: "summary_large_image", title, description, images: [SITE_TWITTER_IMAGE] }
  };
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params;
  const [store, products] = await Promise.all([getStore(slug), getProducts(slug)]);

  if (!store) notFound();

  const access = await checkoutAccess(store);
  const withFiles = access.open ? await productsWithFiles(products.map(product => product.id)) : new Set<string>();
  const featured = products.find(product => product.id === store.featuredProductId) ?? null;
  const rest = featured ? products.filter(product => product.id !== featured.id) : products;

  const card = (product: Product) => ({
    product,
    storeSlug: store.slug,
    canBuy: access.open && chargeable(product),
    instant: withFiles.has(product.id)
  });

  return (
    <div className="sf" style={{ "--sf-bg": store.background } as CSSProperties}>
      <StoreBar store={store} />
      <VisitTracker store={store.slug} />
      {access.testing && <TestingNote test={stripeTestMode()} />}

      <main>
        <section className="sf-hero">
          <div className="sf-wrap sf-hero-grid">
            <div className="sf-hero-copy">
              {store.category && <span className="sf-eyebrow">{store.category}</span>}
              <h1>
                {store.headline || store.name}
                {store.headlineEm && <em>{store.headlineEm}</em>}
              </h1>
              {store.bio && <p className="sf-bio">{store.bio}</p>}

              {products.length > 0 && (
                <div className="sf-hero-actions">
                  <a className="sf-btn sf-btn-ink" href="#shop">
                    Shop now <Icon name="chevron" size={16} />
                  </a>
                  <span className="sf-hero-count">
                    {products.length === 1 ? "1 product" : `${products.length} products`}
                  </span>
                </div>
              )}

              {access.open && (
                <ul className="sf-trust">
                  <li><Icon name="lock" size={16} /> Secure checkout with Stripe</li>
                  {withFiles.size > 0 && <li><Icon name="bolt" size={16} /> Instant download</li>}
                  {emailConfigured() && <li><Icon name="mail" size={16} /> Receipt by email</li>}
                </ul>
              )}
            </div>

            <figure className="sf-hero-photo">
              <div className="sf-hero-frame">
                {store.image ? (
                  <img src={store.image} alt={store.name} />
                ) : (
                  <span className="sf-photo-initial" aria-hidden="true">{store.name.charAt(0)}</span>
                )}
              </div>
              {store.label && <span className="sf-photo-tag">{store.label}</span>}
              {store.short && <figcaption className="sf-photo-name">{store.short}</figcaption>}
            </figure>
          </div>
        </section>

        <section className="sf-shop" id="shop">
          <div className="sf-wrap">
            <div className="sf-shop-head">
              <h2>Shop {store.name}</h2>
            </div>

            {featured && <FeatureCard {...card(featured)} />}

            {rest.length > 0 && (
              <>
                {featured && <h3 className="sf-more">More from {store.name}</h3>}
                <div className="sf-grid">
                  {rest.map(product => <ProductCard key={product.id} {...card(product)} />)}
                </div>
              </>
            )}

            {products.length === 0 && (
              <p className="sf-empty">New products are on the way. Check back soon.</p>
            )}
          </div>
        </section>
      </main>

      <StoreFooter store={store} />
    </div>
  );
}
