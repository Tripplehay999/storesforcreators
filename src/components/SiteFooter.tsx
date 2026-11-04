import Link from "next/link";
import Brand from "./Brand";

export default function SiteFooter() {
  return (
    <footer className="site-footer" id="site-footer">
      <div className="container footer-main">
        <div>
          <Brand className="footer-brand" />
          <p>Online stores for creators, designed and run for you.</p>
        </div>

        <div className="footer-links">
          <Link href="/#process">How it works</Link>
          <Link href="/#stores">Stores</Link>
          <Link href="/#calculator">Earnings</Link>
          <Link href="/#faq">FAQ</Link>
          <Link href="/dashboard">Creator hub</Link>
        </div>

        <div className="footer-contact">
          <strong>Ready to talk?</strong>
          <button className="btn btn-outline-light" data-apply>Apply to partner</button>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Stores for Creators</span>
        <nav className="footer-legal" aria-label="Legal">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms &amp; Conditions</Link>
        </nav>
      </div>
    </footer>
  );
}
