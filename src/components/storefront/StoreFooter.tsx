import Link from "next/link";
import LogoMark from "@/components/LogoMark";
import type { Store } from "@/lib/types";

export default function StoreFooter({ store }: { store: Store }) {
  return (
    <footer className="sf-foot">
      <div className="sf-wrap sf-foot-inner">
        <span>© {new Date().getFullYear()} {store.name}</span>
        <nav className="sf-foot-legal" aria-label="Legal">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms &amp; Conditions</Link>
        </nav>
        <Link className="sf-powered" href="/">
          <LogoMark size={22} />
          <span>Powered by <strong>Stores for Creators</strong></span>
        </Link>
      </div>
    </footer>
  );
}
