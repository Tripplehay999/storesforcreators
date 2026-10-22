import Link from "next/link";
import { productImage, productLink, productPrice } from "@/lib/catalog";
import type { Product, Store } from "@/lib/types";

export default function CreatorGrid({ stores, products }: { stores: Store[]; products: Product[] }) {
  return (
    <div className="creator-grid" id="creator-grid">
      {stores.map(store => {
        const product =
          products.find(item => item.id === store.featuredProductId) ??
          products.find(item => item.store === store.slug);

        if (!product) return null;

        return (
          <article className="creator-card reveal" key={store.slug}>
            <Link className="creator-photo" href={`/store/${store.slug}`}>
              <img
                src={store.image}
                alt={`Illustrative ${store.category.toLowerCase()} creator portrait`}
                loading="lazy"
              />
              <span className="creator-photo-badge">{store.label}</span>
              <span className="creator-photo-title">{store.short}</span>
            </Link>

            <div className="creator-card-body">
              <span className="creator-category">{store.category}</span>
              <h3>{store.name}</h3>
              <p className="creator-card-description">{store.description}</p>

              <Link className="creator-product" href={productLink(product, store.slug)}>
                <div className="creator-product-photo">
                  <img src={productImage(product)} alt={`${product.name} preview`} loading="lazy" />
                </div>

                <div className="creator-product-info">
                  <small>FEATURED PRODUCT</small>
                  <strong>{product.name}</strong>
                  <span>{productPrice(product)}</span>
                  <b>View product ↗</b>
                </div>
              </Link>

              <Link className="creator-store-link" href={`/store/${store.slug}`}>
                Visit example storefront
                <span>↗</span>
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
