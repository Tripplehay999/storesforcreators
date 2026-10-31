import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InnerTop } from "@/components/InnerChrome";
import VisitTracker from "@/components/VisitTracker";
import ProductGallery from "@/components/ProductGallery";
import { productImage, productPrice } from "@/lib/catalog";
import { BRAND_NAME } from "@/lib/format";
import { getProduct, getStore } from "@/lib/data";
import { MIN_CHARGE_CENTS, stripeConfigured } from "@/lib/stripe";

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
  return { title: found ? `${found.product.name} | ${BRAND_NAME}` : "Product not found" };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const [{ id }, { creator, checkout, code }] = await Promise.all([params, searchParams]);
  const found = await getPublicProduct(id);

  if (!found) notFound();

  const { product, store } = found;
  // Real stores with Stripe connected sell for real; concept stores keep the "opens soon" message.
  const canBuy = stripeConfigured() && !store.isDemo && store.published && product.price * 100 >= MIN_CHARGE_CENTS;
  const checkoutMessage = checkout ? CHECKOUT_MESSAGES[checkout] : undefined;

  const back = creator ? `/store/${encodeURIComponent(creator)}` : "/#stores";
  const images = [productImage(product), ...product.gallery];

  return (
    <main className="subpage">
      <div className="product-page">

        <InnerTop back={back} />
        <VisitTracker store={store.slug} product={product.id} />

        <div className={`container product-detail product-layout-${product.layout}`}>
          <ProductGallery images={images} name={product.name} theme={product.theme} />

          <div className="product-info">
            <span className="eyebrow">{product.category}</span>
            <h1>{product.name}</h1>
            <p>{product.tagline}</p>

            <div className="product-price">{productPrice(product)}</div>

            <p>{product.description}</p>

            {canBuy ? (
              <form className="buy-form" action="/api/checkout" method="post">
                <input type="hidden" name="product_id" value={product.id} />
                {checkoutMessage && <p className="buy-error" role="alert">{checkoutMessage}</p>}
                <details className="buy-code" open={checkout === "bad-code" || undefined}>
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
                <button className="btn btn-dark" type="submit">{product.cta}</button>
                <small className="buy-note">Secure checkout by Stripe. Digital products are delivered instantly by email.</small>
              </form>
            ) : (
              <button className="btn btn-dark" data-buy>{product.cta}</button>
            )}

            <ul className="feature-list">
              {product.features.map(feature => <li key={feature}>{feature}</li>)}
            </ul>

            {product.faqs.length > 0 && (
              <div className="product-faq">
                <h3>Questions</h3>
                {product.faqs.map(([question, answer]) => (
                  <details key={question}>
                    <summary>{question}</summary>
                    <p>{answer}</p>
                  </details>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
