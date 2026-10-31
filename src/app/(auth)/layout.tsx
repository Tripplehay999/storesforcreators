import Link from "next/link";
import Brand from "@/components/Brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-page">
      <aside className="auth-aside">
        <Brand className="auth-brand" />

        <div className="auth-aside-copy">
          <h2>Your store, your products and your earnings in one place.</h2>
          <ul className="auth-points">
            <li>See every order and your share of it</li>
            <li>Edit your storefront and products any time</li>
            <li>Track payouts and export your records</li>
          </ul>
        </div>
      </aside>

      <section className="auth-main">
        <Link className="back-link auth-back" href="/">← Back to Stores for Creators</Link>
        <div className="auth-card">{children}</div>
      </section>
    </main>
  );
}
