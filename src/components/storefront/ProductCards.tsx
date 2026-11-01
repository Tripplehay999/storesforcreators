import Link from "next/link";
import type { CSSProperties } from "react";
import Icon from "@/components/hub/Icon";
import { buyLabel, productImage, productLink, productPrice } from "@/lib/catalog";
import type { Product } from "@/lib/types";
import BuyForm from "./BuyForm";

type CardProps = {
  product: Product;
  storeSlug: string;
  /** Show a Buy button that goes straight to checkout. */
  canBuy: boolean;
  /** The product has a file buyers download after paying. */
  instant: boolean;
};

const themed = (product: Product) => ({ "--theme": product.theme }) as CSSProperties;

/** The big card at the top of a store for the creator's featured product. */
export function FeatureCard({ product, storeSlug, canBuy, instant }: CardProps) {
  const href = productLink(product, storeSlug);

  return (
    <article className="sf-feature" style={themed(product)}>
      <Link className="sf-feature-media" href={href} tabIndex={-1} aria-hidden="true">
        <img src={productImage(product)} alt="" />
      </Link>

      <div className="sf-feature-body">
        <span className="sf-flag">{product.badge || "Featured"}</span>
        <h3><Link href={href}>{product.name}</Link></h3>
        {product.tagline && <p>{product.tagline}</p>}

        {product.features.length > 0 && (
          <ul className="sf-points">
            {product.features.slice(0, 3).map((feature, index) => <li key={index}>{feature}</li>)}
          </ul>
        )}

        <div className="sf-buy-row">
          <strong className="sf-price">{productPrice(product)}</strong>
          {canBuy ? (
            <BuyForm productId={product.id} label={buyLabel(product)} buttonClassName="sf-btn sf-btn-ink" />
          ) : (
            <Link className="sf-btn sf-btn-ink" href={href}>See details</Link>
          )}
          {canBuy && <Link className="sf-link" href={href}>See details</Link>}
        </div>

        {canBuy && instant && (
          <span className="sf-note"><Icon name="bolt" size={15} /> Instant download after you pay</span>
        )}
      </div>
    </article>
  );
}

/** A product in the store grid: tap the picture or name for details, or buy straight away. */
export function ProductCard({ product, storeSlug, canBuy, instant }: CardProps) {
  const href = productLink(product, storeSlug);

  return (
    <article className="sf-card" style={themed(product)}>
      <Link className="sf-card-media" href={href} tabIndex={-1} aria-hidden="true">
        <img src={productImage(product)} alt="" loading="lazy" />
        {product.badge && <span className="sf-card-badge">{product.badge}</span>}
      </Link>

      <div className="sf-card-body">
        {product.category && <small className="sf-card-cat">{product.category}</small>}
        <h3><Link href={href}>{product.name}</Link></h3>
        {product.tagline && <p>{product.tagline}</p>}

        <div className="sf-card-foot">
          <strong className="sf-price">{productPrice(product)}</strong>
          {canBuy ? (
            <BuyForm productId={product.id} label="Buy now" busyLabel="Opening…" buttonClassName="sf-btn sf-btn-ink sf-btn-sm" />
          ) : (
            <Link className="sf-btn sf-btn-line sf-btn-sm" href={href}>View</Link>
          )}
        </div>

        {canBuy && instant && (
          <span className="sf-note"><Icon name="bolt" size={14} /> Instant download</span>
        )}
      </div>
    </article>
  );
}
