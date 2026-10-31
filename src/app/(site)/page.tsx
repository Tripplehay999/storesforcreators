import Link from "next/link";
import Calculator from "@/components/Calculator";
import CreatorGrid from "@/components/CreatorGrid";
import DashboardPreview from "@/components/DashboardPreview";
import SiteFooter from "@/components/SiteFooter";
import { getProducts, getStores } from "@/lib/data";
import "./home.css";

const faqs = [
  ["Do I have to pay to get started?", "No. Our standard partnership has no upfront store setup fee. The revenue share, and any optional extras, are agreed with you before launch."],
  ["Do I have to make the products myself?", "No. We can source and prepare properly licensed digital products that suit your audience. If you already have products of your own, we can talk about including them."],
  ["Will the store look like my brand?", "Yes. Your storefront is designed around your name, photos, colours and the way you talk to your audience."],
  ["What exactly do you handle?", "Store design and setup, checkout, digital delivery, customer emails, and the day-to-day running of the store."],
  ["Is the split always 50/50?", "No. 50/50 is a starting point, not a rule. The split can be negotiated in your favour depending on your audience and the partnership."],
  ["How much could I earn?", "It depends on real traffic, pricing, conversion and refunds. The calculator above uses assumptions you set; it isn't a forecast or a typical result."],
  ["Do I need to promote my store?", "Yes. You introduce products to your audience in your own way, and disclose the partnership where the rules require it."]
];

const WE_HANDLE = [
  ["Storefront design", "A store page built around your name, photos and colours."],
  ["Products", "Digital products that fit your niche, sourced and properly licensed."],
  ["Checkout and delivery", "Payments, digital delivery and order emails to your customers."],
  ["Running the store", "Day-to-day store admin, with reporting in your dashboard."]
];

const YOU_DO = [
  "Share products that genuinely fit your content",
  "Tell your audience about the partnership",
  "Check your earnings whenever you like"
];

const STEPS = [
  ["Intro call", "We learn about your audience, your niche and what they already ask you for."],
  ["We build your store", "Design, products and checkout, set up and tested before anyone sees it."],
  ["You share it", "Post about it the way you normally would. We take care of every order."],
  ["You get paid", "Your share of every sale builds up in your dashboard and is paid out to you."]
];

export default async function HomePage() {
  const [stores, products] = await Promise.all([getStores(), getProducts()]);
  const exampleStores = stores.filter(store => store.isDemo);

  return (
    <>
      <main className="home">

        <section className="h-hero">
          <div className="container h-hero-grid">
            <div className="h-hero-copy">
              <p className="h-kicker">Stores for creators with an audience</p>

              <h1>Your own store, without having to run one.</h1>

              <p className="h-lede">
                We design your storefront, stock it with digital products that suit your niche,
                and handle checkout, delivery and customer emails. You share it with your
                audience and earn on every sale.
              </p>

              <div className="h-actions">
                <button className="btn btn-lime" data-apply>Apply to partner</button>
                <a className="btn btn-outline-light" href="#examples">See example stores</a>
              </div>

              <dl className="h-facts">
                <div><dt>$0</dt><dd>to get started. No setup fee.</dd></div>
                <div><dt>50/50</dt><dd>starting split, agreed before launch.</dd></div>
                <div><dt>Live</dt><dd>dashboard for every order and payout.</dd></div>
              </dl>
            </div>

            <div className="h-hero-visual" aria-hidden="true">
              <div className="h-phone">
                <div className="h-phone-screen">
                  <div className="h-phone-bar">
                    <span>jasmine&apos;s financials</span>
                    <i />
                  </div>
                  <div className="h-phone-hero">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=640&fit=crop&crop=faces"
                      alt=""
                    />
                  </div>
                  <div className="h-phone-copy">
                    <small>Finance · Money tips</small>
                    <strong>Your money. Your way.</strong>
                  </div>
                  <div className="h-phone-product">
                    <img src="/templates/student-money-planner.png" alt="" />
                    <div>
                      <strong>Budget Planner Collection</strong>
                      <span>From $19</span>
                    </div>
                    <b>Buy</b>
                  </div>
                </div>
              </div>

              <div className="h-notify">
                <span className="h-notify-icon">$</span>
                <div>
                  <strong>New order</strong>
                  <span>Budget Planner · +$29.50 to you</span>
                </div>
                <time>now</time>
              </div>

              <div className="h-earned">
                <small>This month</small>
                <strong>$1,761.50</strong>
                <span className="h-earned-delta">+41% vs last month</span>
              </div>
            </div>
          </div>
          <div className="container"><p className="h-hero-note">Example store and figures for illustration.</p></div>
        </section>

        <section className="h-section" id="services">
          <div className="container">
            <div className="h-head">
              <h2>You bring the audience. We do everything else.</h2>
              <p>Your followers already trust your recommendations. We turn that into a store that looks like you and runs without you.</p>
            </div>

            <div className="h-split">
              <div className="h-panel">
                <h3>What we handle</h3>
                <ul className="h-handle">
                  {WE_HANDLE.map(([title, body]) => (
                    <li key={title}>
                      <strong>{title}</strong>
                      <span>{body}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="h-panel h-panel-you">
                <h3>What you do</h3>
                <ul className="h-you">
                  {YOU_DO.map(item => <li key={item}>{item}</li>)}
                </ul>
                <p>That&apos;s it. No inventory and no payment setup.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="h-section h-section-tint" id="process">
          <div className="container">
            <div className="h-head">
              <h2>From first call to first sale</h2>
              <p>Four steps, and we do most of the work.</p>
            </div>

            <ol className="h-steps">
              {STEPS.map(([title, body], index) => (
                <li key={title}>
                  <span className="h-step-num">{index + 1}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </li>
              ))}
            </ol>

            <button className="btn btn-dark" data-apply>Book an intro call</button>
          </div>
        </section>

        <section className="h-section" id="examples">
          <div className="container">
            <div className="h-head">
              <h2>Example stores</h2>
              <p>Three made-up creators, to show how different niches can look. Open any of them to see the full store.</p>
            </div>

            <CreatorGrid stores={exampleStores} products={products} />

            <p className="h-footnote">Fictional creators for illustration. Photos do not show real partners.</p>
          </div>
        </section>

        <section className="h-section h-section-tint" id="calculator">
          <div className="container">
            <div className="h-head">
              <h2>What could your store earn?</h2>
              <p>Move the sliders to try your own numbers. It&apos;s a rough model, not a promise.</p>
            </div>

            <Calculator />

            <div className="h-fee">
              <h3>One share, no surprise invoices</h3>
              <p>
                Our share of each sale covers the normal costs of running your store: payment
                processing, hosting, delivery and store management. How sales, refunds, taxes and
                payouts are calculated is set out in your agreement before you launch.
              </p>
            </div>
          </div>
        </section>

        <section className="h-section" id="dashboard">
          <div className="container h-dash">
            <div className="h-dash-copy">
              <h2>Every sale, in one place</h2>
              <p>
                Your creator hub shows your orders, earnings and payouts, so you always know
                how your store is doing and what you&apos;re owed.
              </p>
              <ul className="h-you">
                <li>Earnings and orders for any date range</li>
                <li>Each order with your exact share</li>
                <li>Payout history, and a CSV export for your records</li>
              </ul>
              <Link className="btn btn-dark" href="/dashboard">Open the creator hub</Link>
            </div>

            <DashboardPreview />
          </div>
        </section>

        <section className="h-section h-section-tint" id="faq">
          <div className="container h-faq">
            <div className="h-head h-head-stack">
              <h2>Questions creators ask</h2>
              <p>Anything else? Apply and ask us on the intro call. There&apos;s no commitment.</p>
            </div>

            <div className="faq-items">
              {faqs.map(([question, answer]) => (
                <details key={question}>
                  <summary>{question}</summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="h-cta">
          <div className="container">
            <h2>Your audience is already there. Give them somewhere to shop.</h2>
            <p>Tell us a little about you and your audience to get started.</p>
            <button className="btn btn-lime" data-apply>Apply to partner</button>
          </div>
        </section>

      </main>

      <SiteFooter />
    </>
  );
}
