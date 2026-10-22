import Link from "next/link";
import Calculator from "@/components/Calculator";
import CreatorGrid from "@/components/CreatorGrid";
import DashboardPreview from "@/components/DashboardPreview";
import SiteFooter from "@/components/SiteFooter";
import { getProducts, getStores } from "@/lib/data";

const faqs = [
  ["Do I have to pay to get started?", "Our standard partnership has no upfront store setup fee. Revenue share and any optional services are agreed before launch."],
  ["Do I have to make the products myself?", "No. We can source and prepare appropriately licensed digital products. You can also discuss products you already own."],
  ["Will my store match my personal brand?", "Yes. Your storefront is customized around your identity, style, audience, and product collection."],
  ["What does Browne's Talent Group handle?", "We handle store design, setup, ordinary checkout operations, digital delivery, and agreed ongoing administration."],
  ["Can I negotiate a better revenue split?", "Yes. The 50/50 example is not a universal requirement. The split can be negotiated in the creator's favour depending on the audience and partnership."],
  ["How much could I earn?", "Earnings depend on real traffic, conversion, pricing, refunds, and other factors. The calculator uses hypothetical assumptions, not guaranteed or typical results."],
  ["Do I need to promote my store?", "Yes. Creator promotion is part of the partnership. You introduce relevant products to your audience and disclose the commercial relationship where required."]
];

export default async function HomePage() {
  const [stores, products] = await Promise.all([getStores(), getProducts()]);
  const exampleStores = stores.filter(store => store.isDemo);

  return (
    <>
      <main id="company-view">

        {/* HERO */}

        <section className="hero" id="home">
          <div className="container hero-grid">

            <div className="hero-content reveal">
              <div className="eyebrow hero-eyebrow">
                <span className="pulse-dot"></span>
                YOUR AUDIENCE. OUR EXPERTISE.
              </div>

              <h1>
                You&apos;re the <em>talent.</em><br />
                We&apos;re the <span className="outlined">business.</span><span className="hero-star">✳</span>
              </h1>

              <p className="hero-description">
                We build and run beautifully branded digital stores for creators.
                Products, design, checkout, delivery, and the details?{" "}
                <strong>Handled.</strong> You focus on what made people follow
                you in the first place.
              </p>

              <div className="hero-buttons">
                <button className="btn btn-lime" data-apply>Build my store ↗</button>
                <a className="btn btn-outline-light" href="#process">See how it works ↗</a>
              </div>

              <div className="hero-footnote">
                <span>✳</span>
                <p>
                  No upfront store setup fee<br />
                  <strong>Partnership-based. Built around you.</strong>
                </p>
              </div>

              <div className="hero-metrics">
                <div>
                  <strong>$0</strong>
                  <small>UPFRONT STORE<br />SETUP FEE</small>
                </div>
                <div>
                  <strong>50%</strong>
                  <small>EXAMPLE CREATOR<br />REVENUE SHARE</small>
                </div>
                <div>
                  <strong>100%</strong>
                  <small>BUILT AROUND<br />YOUR BRAND</small>
                </div>
              </div>
            </div>

            <div className="hero-visual reveal">
              <div className="hero-photo">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&h=1200&fit=crop&crop=faces"
                  alt="Illustrative lifestyle creator portrait"
                />
              </div>

              <div className="floating-label floating-top">
                <span>✳ YOUR OWN STORE</span>
                <strong>Your brand.<br />Your world.</strong>
              </div>

              <div className="floating-label floating-bottom">
                <div className="floating-avatar">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces"
                    alt="Illustrative Jasmine portrait"
                  />
                </div>
                <div>
                  <small>CREATOR STOREFRONT</small>
                  <strong>Jasmine&apos;s Financials</strong>
                  <span>Powered by BTG ✳</span>
                </div>
              </div>

              <div className="hero-decoration">✳</div>
            </div>

          </div>
        </section>

        {/* BENEFIT STRIP */}

        <div className="benefit-strip">
          <div className="container benefit-items">
            <span>✳ YOUR OWN BRAND</span>
            <span>✳ WE HANDLE OPERATIONS</span>
            <span>✳ NO UPFRONT SETUP FEE</span>
            <span>✳ EARN FROM YOUR AUDIENCE</span>
          </div>
        </div>

        {/* SERVICES */}

        <section className="section services-section" id="services">
          <div className="container">

            <div className="section-heading reveal">
              <div>
                <span className="eyebrow">01 / WHAT WE DO</span>
                <h2>All the business.<br /><em>None of the busywork.</em></h2>
              </div>
              <p>
                Your audience already trusts you. We help turn that connection
                into a <strong>beautifully branded shopping experience</strong>{" "}
                while handling the work behind the scenes.
              </p>
            </div>

            <div className="services-grid">
              <article className="service-card reveal">
                <div className="service-icon">✳</div>
                <span>01 / BRANDING</span>
                <h3>Your own<br /><em>storefront.</em></h3>
                <p>Personalized design, product pages, photography, and a shopping experience that feels like you.</p>
              </article>

              <article className="service-card reveal">
                <div className="service-icon">▦</div>
                <span>02 / PRODUCTS</span>
                <h3>Beautiful products.<br /><em>Ready to share.</em></h3>
                <p>Curated digital products and properly licensed resources matched to your audience and niche.</p>
              </article>

              <article className="service-card reveal">
                <div className="service-icon">↗</div>
                <span>03 / OPERATIONS</span>
                <h3>Behind the scenes?<br /><em>Handled.</em></h3>
                <p>Store setup, checkout operations, payment processing, delivery, and routine store administration.</p>
              </article>

              <article className="service-card reveal">
                <div className="service-icon">♡</div>
                <span>04 / PARTNERSHIP</span>
                <h3>Your brand.<br /><em>Your earnings.</em></h3>
                <p>Clear partnership terms, creator reporting, and a revenue share agreed before launch.</p>
              </article>
            </div>

          </div>
        </section>

        {/* PROCESS */}

        <section className="section process-section" id="process">
          <div className="container process-layout">

            <div className="process-heading reveal">
              <span className="eyebrow">02 / HOW IT WORKS</span>
              <h2>Simple for you.<br /><em>Beautiful for them.</em></h2>
              <p>
                We take care of building and operating the store.
                You bring your personality, your community, and your creative voice.
              </p>
              <button className="btn btn-dark" data-apply>Let&apos;s work together ↗</button>
            </div>

            <div className="process-steps">
              {[
                ["01", "We get to know your audience.", "We learn about your niche, your brand, and the products that make sense for your followers."],
                ["02", "We create your personalized store.", "From the visual identity to the product collection, we handle the setup and operations."],
                ["03", "You introduce it to your community.", "Share products that fit your content and disclose your partnership appropriately."],
                ["04", "You earn your agreed share.", "We manage the operational side while you track store performance through your creator dashboard."]
              ].map(([step, title, body]) => (
                <div className="process-step reveal" key={step}>
                  <span>{step}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                  <b>↗</b>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* COMBINED CREATOR + PRODUCT SECTION */}

        <section className="section stores-section" id="stores">
          <div className="container">

            <div className="section-heading reveal">
              <div>
                <span className="eyebrow">03 / THE CREATOR COLLECTION</span>
                <h2>Choose a product<br /><em>that works for you!</em></h2>
              </div>
              <p>
                Different audiences need different things. Here are examples
                of the kinds of products a creator can offer through a{" "}
                <strong>personalized storefront.</strong>
              </p>
            </div>

            <CreatorGrid stores={exampleStores} products={products} />

            <div className="collection-bottom">
              <p>✳ Fictional creator concepts for illustration only. Photos do not represent actual BTG partners.</p>
              <Link href="/dashboard/products">Explore product customization ↗</Link>
            </div>

          </div>
        </section>

        {/* EARNINGS / CALCULATOR */}

        <section className="section calculator-section" id="calculator">
          <div className="container">

            <div className="section-heading reveal">
              <div>
                <span className="eyebrow">04 / YOUR POTENTIAL</span>
                <h2>Your audience.<br /><em>New possibilities.</em></h2>
              </div>
              <p>
                Curious what a digital storefront could look like for your audience?{" "}
                <strong>Adjust the numbers</strong> to explore different
                hypothetical sales scenarios.
              </p>
            </div>

            <Calculator />

            <div className="fee-explainer reveal">
              <div className="fee-icon">✳</div>

              <div>
                <span className="eyebrow">ONE AGREED PARTNERSHIP SHARE</span>
                <h3>We handle the operating costs.<br /><em>You focus on creating.</em></h3>
                <p>
                  Our agreed share is intended to cover ordinary store operating
                  costs, including payment processing, platform operations,
                  digital delivery, and store management. You don&apos;t receive a
                  separate BTG platform-fee invoice for those standard services.
                  The calculation of eligible sales receipts, refunds, taxes,
                  exceptional costs, and payout terms is defined in your agreement.
                </p>
              </div>

              <div className="fee-share">
                <strong>50/50</strong>
                <span>EXAMPLE STARTING SPLIT</span>
                <small>Negotiable in the creator&apos;s favour based on the partnership.</small>
              </div>
            </div>

          </div>
        </section>

        {/* JASMINE SHOWCASE */}

        <section className="section jasmine-section" id="jasmine">
          <div className="container">

            <div className="section-heading reveal">
              <div>
                <span className="eyebrow">05 / MADE FOR YOUR BRAND</span>
                <h2>A store that feels<br /><em>like yours.</em></h2>
              </div>
              <p>
                A beautiful customer-facing storefront with your name,
                your identity, and products that make sense for your community.
              </p>
            </div>

            <div className="jasmine-showcase reveal">

              <div className="jasmine-image">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&h=1100&fit=crop&crop=faces"
                  alt="Illustrative Jasmine finance creator portrait"
                />
                <div className="jasmine-photo-sticker">✳ FINANCE CREATOR</div>
              </div>

              <div className="jasmine-content">
                <div className="jasmine-mini-brand">
                  <span className="jasmine-monogram">J<span>✳</span></span>
                  <span>JASMINE&apos;S FINANCIALS</span>
                </div>

                <span className="eyebrow">EXAMPLE CREATOR STOREFRONT</span>

                <h3>Money moves,<br /><em>made beautiful.</em></h3>

                <p>
                  Meet Jasmine&apos;s Financials: a sample creator store
                  featuring budgeting resources, personalized branding,
                  and a carefully curated digital collection.
                </p>

                <div className="jasmine-products">
                  <Link href="/product/budget?creator=jasmine" className="jasmine-mini-product">
                    <img src="/templates/student-money-planner.png" alt="Student Money Planner screenshot" loading="lazy" />
                    <div>
                      <small>DIGITAL PLANNERS</small>
                      <strong>Budget Planner Collection</strong>
                      <span>$19–$59 USD</span>
                    </div>
                    <b>↗</b>
                  </Link>

                  <Link href="/product/coaching?creator=jasmine" className="jasmine-mini-product">
                    <img
                      src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=300&h=300&fit=crop"
                      alt="Financial coaching consultation concept"
                      loading="lazy"
                    />
                    <div>
                      <small>PERSONAL SUPPORT</small>
                      <strong>1:1 Financial Coaching</strong>
                      <span>$105 USD / hour</span>
                    </div>
                    <b>↗</b>
                  </Link>
                </div>

                <Link className="btn btn-dark" href="/store/jasmine">Visit Jasmine&apos;s example store ↗</Link>
              </div>

            </div>

          </div>
        </section>

        {/* DASHBOARD */}

        <section className="section dashboard-section" id="dashboard">
          <div className="container dashboard-layout">

            <div className="dashboard-copy reveal">
              <span className="eyebrow">06 / YOUR CREATOR HUB</span>

              <h2>Every order.<br />Every milestone.<br /><em>All in one place.</em></h2>

              <p>
                A clear overview of your store&apos;s orders, creator earnings,
                and performance. Explore the sample dashboard to see
                how your results are presented.
              </p>

              <div className="dashboard-benefit">
                <span>✳</span>
                <div>
                  <strong>See your store performance</strong>
                  <small>Orders and earnings organized in one beautiful view.</small>
                </div>
              </div>

              <div className="dashboard-benefit">
                <span>↗</span>
                <div>
                  <strong>Follow your progress</strong>
                  <small>Switch between weekly and monthly reporting.</small>
                </div>
              </div>

              <Link className="btn btn-dark" href="/dashboard">Open your creator hub ↗</Link>

              <p className="demo-notice">
                Illustrative dashboard data. Not connected to actual sales.
              </p>
            </div>

            <DashboardPreview />

          </div>
        </section>

        {/* FAQ */}

        <section className="section faq-section" id="faq">
          <div className="container faq-layout">

            <div className="faq-heading reveal">
              <span className="eyebrow">GOOD QUESTIONS</span>
              <h2>Curious?<br /><em>We get it.</em></h2>
              <p>Everything you need to know before exploring a partnership.</p>
            </div>

            <div className="faq-items reveal">
              {faqs.map(([question, answer]) => (
                <details key={question}>
                  <summary>{question}</summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>

          </div>
        </section>

        {/* FINAL CTA */}

        <section className="final-cta">
          <div className="container final-cta-content reveal">
            <span className="eyebrow">LET&apos;S MAKE SOMETHING BEAUTIFUL</span>

            <h2>Your audience is yours.<br /><em>Let&apos;s build something around it.</em></h2>

            <p>
              A personalized storefront. Products that fit your niche.
              A business team handling the behind-the-scenes details.
            </p>

            <button className="btn btn-lime" data-apply>Become a BTG creator ↗</button>

            <small>✳ NO UPFRONT STORE SETUP FEE</small>
          </div>
        </section>

      </main>

      <SiteFooter />
    </>
  );
}
