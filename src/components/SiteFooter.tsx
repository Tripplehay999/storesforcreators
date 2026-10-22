import Link from "next/link";
import Brand from "./Brand";

export default function SiteFooter() {
  return (
    <footer className="site-footer" id="site-footer">
      <div className="container footer-main">
        <div>
          <Brand className="footer-brand" />
          <p>Your audience. Our expertise.<br />Beautiful creator commerce, handled.</p>
        </div>

        <div className="footer-links">
          <Link href="/#services">What we do</Link>
          <Link href="/#process">How it works</Link>
          <Link href="/#stores">Creator stores</Link>
          <Link href="/#calculator">Your potential</Link>
          <Link href="/dashboard/products">Product studio</Link>
        </div>

        <div className="footer-contact">
          <strong>Let&apos;s create together.</strong>
          <button className="btn btn-outline-light" data-apply>Become a partner ↗</button>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Browne&apos;s Talent Group.</span>
        <span>Illustrative creator profiles, earnings, and products are clearly identified throughout.</span>
        <button data-policy>Privacy &amp; terms</button>
      </div>
    </footer>
  );
}
