import Link from "next/link";
import Calculator from "@/components/Calculator";
import DashboardPreview from "@/components/DashboardPreview";
import SiteFooter from "@/components/SiteFooter";
import { productImage, productLink, productPrice } from "@/lib/catalog";
import { getProducts, getStores } from "@/lib/data";
import type { Product, Store } from "@/lib/types";
import "./home.css";

const faqs = [
  ["Do I have to pay to get started?", "No. Our standard partnership has no upfront store setup fee. The revenue share, and any optional extras, are agreed with you before launch."],
  ["Do I have to make the products myself?", "No. We can source and prepare properly licensed digital products that suit your audience. If you already have products of your own, we can talk about including them."],
  ["Will the store look like my brand?", "Yes. Your storefront is designed around your name, photos, colours and the way you talk to your audience."],
  ["What exactly do you handle?", "Store design and setup, checkout, digital delivery, customer emails, and the day-to-day running of the store."],
  ["Is the split always 50/50?", "No. 50/50 is a starting point, not a rule. The split can be negotiated in your favour depending on your audience and the partnership."],
  ["How much could I earn?", "It depends on real traffic, pricing, conversion and refunds. The calculator uses assumptions you set; it isn't a forecast or a typical result."],
  ["Do I need to promote my store?", "Yes. You introduce products to your audience in your own way, and disclose the partnership where the rules require it."]
];

const MARQUEE = [
  "Budget planners", "Meal plans", "Study guides", "Workout programs",
  "Photo presets", "Notion templates", "Recipe books", "Coaching calls"
];

const OUR_LIST = [
  "Design your storefront",
  "Find and license products",
  "Write every product page",
  "Set up checkout and payments",
  "Deliver every order",
  "Send the order emails",
  "Keep the store running",
  "Report your earnings"
];

const YOUR_LIST = ["Post about it", "Tell your audience it's a partnership", "Get paid"];

const STEPS = [
  { title: "We get to know you", body: "A quick intro call about your audience, your niche, and what your followers already ask you for.", tone: "lilac" },
  { title: "We build your store", body: "Design, products and checkout, all set up and tested before anyone sees it.", tone: "plum" },
  { title: "You share it. You get paid.", body: "Post about it your way. Your share of every sale shows up in your dashboard and gets paid out to you.", tone: "lime" }
];

function StoreCard({ store, product }: { store: Store; product?: Product }) {
  return (
    <article className="b-store">
      <Link className="b-store-photo" href={`/store/${store.slug}`} style={{ background: store.background }}>
        {store.image && <img src={store.image} alt={store.name} loading="lazy" />}
        {store.label && <span className="b-store-tag">{store.label}</span>}
      </Link>
      <div className="b-store-body">
        {store.category && <span className="b-store-cat">{store.category}</span>}
        <h3>{store.name}</h3>
        {product && (
          <Link className="b-store-product" href={productLink(product, store.slug)}>
            <img src={productImage(product)} alt="" loading="lazy" />
            <div>
              <strong>{product.name}</strong>
              <span>{productPrice(product)}</span>
            </div>
          </Link>
        )}
        <Link className="b-store-link" href={`/store/${store.slug}`}>
          Visit store <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

export default async function HomePage() {
  const [stores, products] = await Promise.all([getStores(), getProducts()]);
  const withProduct = (store: Store) => ({
    store,
    product: products.find(item => item.id === store.featuredProductId) ?? products.find(item => item.store === store.slug)
  });
  const examples = stores.filter(store => store.isDemo).map(withProduct);

  return (
    <>
      <main className="home">

        <section className="b-hero">
          <div className="container b-hero-grid">
            <div className="b-hero-copy">
              <p className="b-chip">For creators with an audience</p>

              <h1>
                <span>You post.</span>
                <span>We sell.</span>
                <span className="b-hl">You get paid.</span>
              </h1>

              <p className="b-lede">
                We build and run your own online store: the design, the products, checkout and
                delivery. You share it with your audience and earn on every sale.
              </p>

              <div className="b-actions">
                <button className="b-btn b-btn-ink" data-apply>Get my store <span aria-hidden="true">→</span></button>
                <a className="b-btn b-btn-ghost" href="#stores">See the stores</a>
              </div>

              <ul className="b-proof">
                <li>$0 setup fee</li>
                <li>Split agreed up front</li>
                <li>Your own earnings dashboard</li>
              </ul>
            </div>

            <div className="b-stack" aria-hidden="true">
              {examples.slice(0, 3).map(({ store, product }, index) => (
                <div className={`b-card b-card-${index + 1}`} key={store.slug} style={{ background: store.background }}>
                  <img src={store.image} alt="" />
                  <div className="b-card-foot">
                    <strong>{store.name}</strong>
                    <span>{product ? productPrice(product) : store.category}</span>
                  </div>
                </div>
              ))}

              <div className="b-sticker b-sticker-order">
                <b>+$29.50</b>
                <span>New order · Budget Planner</span>
              </div>
              <div className="b-sticker b-sticker-badge">
                <b>$0</b>
                <span>to start</span>
              </div>
            </div>
          </div>
        </section>

        <div className="b-marquee" aria-label="Things creators sell">
          <div className="b-marquee-track">
            {[0, 1].map(copy => (
              <ul key={copy} aria-hidden={copy === 1}>
                {MARQUEE.map(item => <li key={item}>{item}</li>)}
              </ul>
            ))}
          </div>
        </div>

        <section className="b-section" id="services">
          <div className="container">
            <h2 className="b-title">Our to-do list is long.<br /><span className="b-mark">Yours isn&apos;t.</span></h2>

            <div className="b-lists">
              <div className="b-box b-list-ours">
                <div className="b-box-head">
                  <h3>Our list</h3>
                  <span>{OUR_LIST.length} things</span>
                </div>
                <ul className="b-checks">
                  {OUR_LIST.map(item => <li key={item}>{item}</li>)}
                </ul>
              </div>

              <div className="b-box b-list-yours">
                <div className="b-box-head">
                  <h3>Your list</h3>
                  <span>{YOUR_LIST.length} things</span>
                </div>
                <ul className="b-checks">
                  {YOUR_LIST.map(item => <li key={item}>{item}</li>)}
                </ul>
                <p>No inventory. No payment setup. No website to maintain.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="b-section b-section-tight" id="process">
          <div className="container">
            <h2 className="b-title">How it works</h2>

            <ol className="b-steps">
              {STEPS.map((step, index) => (
                <li key={step.title} className={`b-step b-step-${step.tone}`}>
                  <span className="b-step-num">{index + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="b-section b-section-lilac" id="stores">
          <div className="container">
            <div className="b-head">
              <h2 className="b-title">What your store could look like</h2>
              <p>Tap one to look around.</p>
            </div>
            <div className="b-stores">
              {examples.map(item => <StoreCard key={item.store.slug} {...item} />)}
            </div>
          </div>
        </section>

        <section className="b-section" id="calculator">
          <div className="container">
            <div className="b-head">
              <h2 className="b-title">Do the <span className="b-mark">maths.</span></h2>
              <p>Drag the sliders to estimate what a store could earn with your audience.</p>
            </div>

            <Calculator />

            <div className="b-box b-fee">
              <h3>One share. No surprise invoices.</h3>
              <p>
                Our share of each sale covers the normal costs of running your store: payment
                processing, hosting, delivery and store management. How sales, refunds, taxes and
                payouts are calculated is written into your agreement before you launch.
              </p>
            </div>
          </div>
        </section>

        <section className="b-section b-section-ink" id="dashboard">
          <div className="container b-dash">
            <div className="b-dash-copy">
              <h2 className="b-title">Every sale.<br />Every payout.<br /><span className="b-mark">One app.</span></h2>
              <p>
                Your creator hub shows your orders, earnings and payouts for any date range,
                so you always know how your store is doing and what you&apos;re owed.
              </p>
              <Link className="b-btn b-btn-lime" href="/dashboard">Open the creator hub <span aria-hidden="true">→</span></Link>
            </div>

            <div className="b-dash-frame">
              <DashboardPreview />
            </div>
          </div>
        </section>

        <section className="b-section" id="faq">
          <div className="container b-faq">
            <div>
              <h2 className="b-title">Good questions.</h2>
              <p className="b-faq-sub">Anything else? Apply and ask us on the intro call. No commitment.</p>
            </div>

            <div className="b-faq-items">
              {faqs.map(([question, answer]) => (
                <details key={question}>
                  <summary>{question}</summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="b-cta">
          <div className="container">
            <h2>Your audience is ready.<br />Is your store?</h2>
            <button className="b-btn b-btn-lime b-btn-lg" data-apply>Apply to partner <span aria-hidden="true">→</span></button>
            <p>No setup fee. Takes two minutes.</p>
          </div>
        </section>

      </main>

      <SiteFooter />
    </>
  );
}
