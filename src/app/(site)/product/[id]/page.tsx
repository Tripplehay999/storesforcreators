import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InnerTop } from "@/components/InnerChrome";
import ProductGallery from "@/components/ProductGallery";
import { productImage, productPrice } from "@/lib/catalog";
import { BRAND_NAME } from "@/lib/format";
import { getProduct, getStore } from "@/lib/data";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ creator?: string }>;
};

/** A product, only if its store exists. */
async function getPublicProduct(id: string) {
  const product = await getProduct(id);
  return product && (await getStore(product.store)) ? product : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getPublicProduct((await params).id);
  return { title: product ? `${product.name} | ${BRAND_NAME}` : "Product not found" };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const [{ id }, { creator }] = await Promise.all([params, searchParams]);
  const product = await getPublicProduct(id);

  if (!product) notFound();

  const back = creator ? `/store/${encodeURIComponent(creator)}` : "/#stores";
  const images = [productImage(product), ...product.gallery];

  return (
    <main className="subpage">
      <div className="product-page">

        <InnerTop back={back} />

        <div className={`container product-detail product-layout-${product.layout}`}>
          <ProductGallery images={images} name={product.name} theme={product.theme} />

          <div className="product-info">
            <span className="eyebrow">{product.category}</span>
            <h1>{product.name}</h1>
            <p>{product.tagline}</p>

            <div className="product-price">{productPrice(product)}</div>

            <p>{product.description}</p>

            <button className="btn btn-dark" data-buy>{product.cta}</button>

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
