import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import Icon from "@/components/hub/Icon";
import ProductGallery from "@/components/ProductGallery";
import BuyForm from "@/components/storefront/BuyForm";
import StickyBuy from "@/components/storefront/StickyBuy";
import StoreBar from "@/components/storefront/StoreBar";
import StoreFooter from "@/components/storefront/StoreFooter";
import TestingNote from "@/components/storefront/TestingNote";
import VisitTracker from "@/components/VisitTracker";
import { buyLabel, productImage, productPrice } from "@/lib/catalog";
import { chargeable, checkoutAccess, productsWithFiles, stripeTestMode } from "@/lib/checkout";
import { getProduct, getStore } from "@/lib/data";
import { emailConfigured } from "@/lib/email";
import { shareableImage, SITE_SHARE_IMAGE, SITE_TWITTER_IMAGE } from "@/lib/share";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ creator?: string; checkout?: string; code?: string }>;
};

const CHECKOUT_MESSAGES: Record<string, string> = {
  "bad-code": "That code isn't valid for this store, or it has expired.",
  unavailable: "This product can't be bought online just yet.",
  error: "We couldn't start checkout. Please try again in a moment."
};

/** A product, only if its store exists. */
async function getPublicProduct(id: string) {
  const product = await getProduct(id);
  const store = product ? await getStore(product.store) : null;
  return product && store ? { product, store } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await getPublicProduct((await params).id);
  if (!found) return { title: "Product not found" };

  const { product, store } = found;
  const title = `${product.name} | ${store.name}`;
  const description = product.tagline || product.description.slice(0, 160) || `From ${store.name}.`;
  const cover = shareableImage(product.image);

  return {
    title,
    description,
    openGraph: { type: "website", title, description, images: [cover ? { url: cover, alt: product.name } : SITE_SHARE_IMAGE] },
    twitter: { card: "summary_large_image", title, description, images: [cover ?? SITE_TWITTER_IMAGE] }
  };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const [{ id }, { checkout, code }] = await Promise.all([params, searchParams]);
  const found = await getPublicProduct(id);

  if (!found) notFound();

  const { product, store } = found;
  const access = await checkoutAccess(store);
  const canBuy = access.open && chargeable(product);
  const instant = canBuy && (await productsWithFiles([product.id])).has(product.id);
  const checkoutMessage = checkout ? CHECKOUT_MESSAGES[checkout] : undefined;

  const images = [productImage(product), ...product.gallery];
  const price = productPrice(product);
  const label = buyLabel(product);

  return (
    <div
      className={`sf${canBuy ? " sf-has-sticky" : ""}`}
      style={{ "--sf-bg": store.background, "--theme": product.theme } as CSSProperties}
    >
      <StoreBar store={store} onProduct />
      <VisitTracker store={store.slug} product={product.id} />
      {access.testing && <TestingNote test={stripeTestMode()} />}

      <main className={`sf-wrap sf-product${product.layout === "center" ? " sf-product-center" : ""}`}>
        <div className="sf-product-media">
          <ProductGallery images={images} name={product.name} theme={product.theme} />
        </div>

        <div className="sf-product-info">
          <Link className="sf-crumb" href={`/store/${store.slug}`}>
            <Icon name="left" size={15} /> {store.name}
          </Link>
          {product.category && <span className="sf-eyebrow">{product.category}</span>}
          <h1>{product.name}</h1>
          {product.tagline && <p className="sf-tagline">{product.tagline}</p>}

          <div className="sf-buy-box">
            <strong className="sf-price-big">{price}</strong>

            {canBuy ? (
              <BuyForm
                id="buy-form"
                className="sf-buy-form"
                productId={product.id}
                label={label}
                buttonClassName="sf-btn sf-btn-ink sf-btn-lg"
              >
                {checkoutMessage && <p className="sf-alert" role="alert">{checkoutMessage}</p>}
                <details className="sf-code" open={checkout === "bad-code" || undefined}>
                  <summary>Have a discount code?</summary>
                  <input
                    name="code"
                    defaultValue={code ?? ""}
                    placeholder="Enter code"
                    autoCapitalize="characters"
                    autoComplete="off"
                    maxLength={24}
                    aria-label="Discount code"
                  />
                </details>
              </BuyForm>
            ) : (
              <div className="sf-buy-form">
                {checkoutMessage && <p className="sf-alert" role="alert">{checkoutMessage}</p>}
                <button className="sf-btn sf-btn-ink sf-btn-lg" type="button" data-buy>{label}</button>
              </div>
            )}

            {canBuy && (
              <ul className="sf-assure">
                <li><Icon name="lock" size={16} /> Secure checkout with Stripe</li>
                {instant && <li><Icon name="bolt" size={16} /> Instant download right after you pay</li>}
                {emailConfigured() && (
                  <li><Icon name="mail" size={16} /> {instant ? "Receipt and download link" : "Receipt"} sent to your email</li>
                )}
              </ul>
            )}
          </div>

          {product.description && (
            <section className="sf-section">
              <h2>About this product</h2>
              <p className="sf-text">{product.description}</p>
            </section>
          )}

          {product.features.length > 0 && (
            <section className="sf-section">
              <h2>What&apos;s included</h2>
              <ul className="sf-points">
                {product.features.map((feature, index) => <li key={index}>{feature}</li>)}
              </ul>
            </section>
          )}

          {product.faqs.length > 0 && (
            <section className="sf-section sf-faq">
              <h2>Questions</h2>
              {product.faqs.map(([question, answer], index) => (
                <details key={index}>
                  <summary>{question}</summary>
                  <p>{answer}</p>
                </details>
              ))}
            </section>
          )}
        </div>
      </main>

      {canBuy && <StickyBuy name={product.name} price={price} label={label} formId="buy-form" />}
      <StoreFooter store={store} />
    </div>
  );
}
