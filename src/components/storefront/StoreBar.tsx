import Link from "next/link";
import type { Store } from "@/lib/types";

/** The slim header on a creator's store and product pages: their name, and a way back to the shop. */
export default function StoreBar({ store, onProduct = false }: { store: Store; onProduct?: boolean }) {
  return (
    <header className="sf-bar">
      <div className="sf-wrap sf-bar-inner">
        <Link className="sf-bar-store" href={`/store/${store.slug}`}>
          <span className="sf-avatar" aria-hidden="true">
            {store.image ? <img src={store.image} alt="" /> : store.name.charAt(0)}
          </span>
          <strong>{store.name}</strong>
        </Link>

        <Link className="sf-btn sf-btn-line sf-btn-sm" href={`/store/${store.slug}#shop`}>
          {onProduct ? "All products" : "Shop"}
        </Link>
      </div>
    </header>
  );
}
