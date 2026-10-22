import Link from "next/link";
import Brand from "@/components/Brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-page">
      <aside className="auth-aside">
        <Brand className="auth-brand" />

        <div className="auth-aside-copy">
          <div className="eyebrow hero-eyebrow">
            <span className="pulse-dot"></span>
            YOUR CREATOR HUB
          </div>
          <h2>Every order.<br />Every milestone.<br /><em>All in one place.</em></h2>
          <p>Your storefront, your products, and your earnings — beautifully organized.</p>
        </div>

        <div className="floating-label floating-bottom auth-floating">
          <div className="floating-avatar">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces"
              alt=""
            />
          </div>
          <div>
            <small>CREATOR STOREFRONT</small>
            <strong>Your brand. Your world.</strong>
            <span>Powered by BTG ✳</span>
          </div>
        </div>

        <span className="auth-decoration" aria-hidden="true">✳</span>
      </aside>

      <section className="auth-main">
        <Link className="back-link auth-back" href="/">← Back to Browne&apos;s Talent Group</Link>
        <div className="auth-card">{children}</div>
      </section>
    </main>
  );
}
