import Link from "next/link";

export default function NotFound() {
  return (
    <main className="subpage">
      <section className="final-cta">
        <div className="container final-cta-content">
          <span className="eyebrow">404 / NOT FOUND</span>
          <h2>This page wandered off.<br /><em>Let&apos;s get you back.</em></h2>
          <p>The store or product you&apos;re looking for doesn&apos;t exist or isn&apos;t public yet.</p>
          <Link className="btn btn-lime" href="/">Back to Browne&apos;s Talent Group ↗</Link>
        </div>
      </section>
    </main>
  );
}
