import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoRibbon, InnerTop } from "@/components/InnerChrome";
import ProductGallery from "@/components/ProductGallery";
import { productImage, productPrice } from "@/lib/catalog";
import { BRAND_NAME } from "@/lib/format";
import { getProduct } from "@/lib/data";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ creator?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).id);
  return { title: product ? `${product.name} | ${BRAND_NAME}` : "Product not found" };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const [{ id }, { creator }] = await Promise.all([params, searchParams]);
  const product = await getProduct(id);

  if (!product) notFound();

  const back = creator ? `/store/${encodeURIComponent(creator)}` : "/#stores";
  const images = [productImage(product), ...product.gallery];

  return (
    <main className="subpage">
      <div className="product-page">

        <DemoRibbon />
        <InnerTop back={back} />

        <div className={`container product-detail product-layout-${product.layout}`}>
          <ProductGallery images={images} name={product.name} theme={product.theme} />

          <div className="product-info">
            <span className="eyebrow">{product.category}</span>
            <h1>{product.name}</h1>
            <p>{product.tagline}</p>

            <div className="product-price">
              {productPrice(product)}
              <small>Illustrative product pricing</small>
            </div>

            <p>{product.description}</p>

            <button className="btn btn-dark" data-buy>{product.cta} ↗</button>

            <p className="product-note">Storefront demonstration — checkout is not connected.</p>

            <ul className="feature-list">
              {product.features.map(feature => <li key={feature}>{feature}</li>)}
            </ul>

            <div className="product-faq">
              <h3>Questions, answered.</h3>
              {product.faqs.map(([question, answer]) => (
                <details key={question}>
                  <summary>{question}</summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>

            <Link className="back-link" href={`/dashboard/products?product=${encodeURIComponent(product.id)}`}>
              Customize this product design ↗
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}
