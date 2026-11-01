import Link from "next/link";
import LogoMark from "@/components/LogoMark";
import "./auth.css";

const POINTS = [
  "Your own branded store, set up for you",
  "Every order and payout in one dashboard",
  "Share links, discount codes and growth ideas"
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="au">
      <aside className="au-brand">
        <Link className="au-logo" href="/">
          <span className="au-logo-mark"><LogoMark size={40} /></span>
          <span>Stores for Creators</span>
        </Link>

        <div className="au-brand-copy">
          <h2>
            <span>You post.</span>
            <span>We sell.</span>
            <span className="au-hl">You get paid.</span>
          </h2>
          <ul>
            {POINTS.map(point => <li key={point}>{point}</li>)}
          </ul>
        </div>

        <p className="au-brand-foot">No setup fee · Split agreed up front</p>
      </aside>

      <section className="au-main">
        <div className="au-card">{children}</div>
        <Link className="au-home" href="/">← Back to Stores for Creators</Link>
      </section>
    </main>
  );
}
