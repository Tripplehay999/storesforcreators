import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/LegalPage";
import { DOWNLOAD_DAYS, MAX_DOWNLOADS } from "@/lib/downloads";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms & Conditions | Stores for Creators",
  description: "The rules for buying from and selling with Stores for Creators, including refunds and creator payouts."
};

const mail = <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>;

const sections: LegalSection[] = [
  {
    id: "about",
    title: "About these terms",
    body: (
      <>
        <p>
          These terms are an agreement between you and {LEGAL.company} (&ldquo;we&rdquo;, &ldquo;us&rdquo;), which runs{" "}
          {LEGAL.site}. By using the site, buying a product, or creating an account, you agree to them.
        </p>
        <p>
          In these terms, a <strong>creator</strong> is someone with an account whose store we run, and a{" "}
          <strong>buyer</strong> is anyone who buys from a store. How we handle personal information is explained in our{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </>
    )
  },
  {
    id: "accounts",
    title: "Accounts",
    body: (
      <ul>
        <li>You must be at least 18, or the age of majority where you live, to open a creator account.</li>
        <li>Give accurate details and keep them up to date, especially your email and payout details.</li>
        <li>Keep your password private. You&apos;re responsible for what happens in your account.</li>
        <li>We may suspend or close accounts that break these terms or put buyers, creators or the site at risk.</li>
      </ul>
    )
  },
  {
    id: "buying",
    title: "Buying from a store",
    body: (
      <>
        <ul>
          <li>Prices are in US dollars (USD). The total you&apos;ll pay is shown on the secure checkout page before you pay.</li>
          <li>Payments are processed by Stripe. We never see or store your card details.</li>
          <li>
            Discount codes work at the store they belong to, one per order. They may expire or have a limited number of
            uses, and have no cash value.
          </li>
          <li>
            If you&apos;re under the age of majority where you live, you need a parent&apos;s or guardian&apos;s permission
            to buy.
          </li>
        </ul>

        <h3>Getting your product</h3>
        <p>
          Digital products are delivered as soon as your payment goes through: you&apos;ll get a download link on the
          confirmation page and by email. Each link works for {DOWNLOAD_DAYS} days and up to {MAX_DOWNLOADS} downloads, so
          please save your file. If a product is a service, such as a coaching call, its page explains how it&apos;s
          provided, and we&apos;ll use the email you gave at checkout to arrange it.
        </p>

        <h3>Using what you buy</h3>
        <p>
          You get a personal licence to use the product yourself. Unless the product page says otherwise, you may not
          resell, share, copy for others, or publish the files.
        </p>
      </>
    )
  },
  {
    id: "refunds",
    title: "Refunds",
    body: (
      <>
        <p>
          Because digital products are delivered instantly, <strong>all sales are final</strong>, except when:
        </p>
        <ul>
          <li>the file is faulty or won&apos;t open,</li>
          <li>you didn&apos;t receive your product,</li>
          <li>the product is clearly not as described, or</li>
          <li>you were charged more than once for the same order.</li>
        </ul>
        <p>
          If one of these happens, email {mail} with the email address you used to buy and what went wrong. We&apos;ll fix
          the problem, send you a working file, or refund you. Refunds go back to the card or account you paid with, and
          your bank may take a few business days to show them.
        </p>
        <p>Nothing in these terms takes away any rights you have under consumer protection laws that apply to you.</p>
      </>
    )
  },
  {
    id: "creators",
    title: "For creators",
    body: (
      <>
        <h3>Your content</h3>
        <p>
          You keep ownership of the content you give us, such as your name, photos, bio and any products you supply. You
          give us permission to use it to build, run and promote your store while we work together. You confirm you have
          the rights to everything you upload and that it doesn&apos;t break anyone else&apos;s rights.
        </p>
        <p>
          Products we source or prepare for your store stay licensed to us, and you may only sell them through your
          store.
        </p>

        <h3>Your share and payouts</h3>
        <ul>
          <li>Your revenue share is agreed with you before your store launches.</li>
          <li>Each completed sale adds your share to your balance, which you can see in the creator hub.</li>
          <li>If a sale is refunded, your share of that sale comes off your balance.</li>
          <li>
            You can request a payout from the <em>Earnings</em> page once you&apos;ve added your payout details. We review
            requests and pay by the method you choose, such as PayPal, Interac e-Transfer or bank transfer.
          </li>
          <li>You&apos;re responsible for any taxes on your earnings.</li>
        </ul>

        <h3>Promoting your store</h3>
        <p>
          You introduce the products to your audience in your own way, and you must clearly disclose our partnership
          wherever the rules of the platform or the law require it.
        </p>

        <h3>Ending the partnership</h3>
        <p>
          You can stop at any time by emailing {mail}. We may close a store that breaks these terms. Either way, we&apos;ll
          pay you the balance you&apos;ve earned from completed sales, minus any refunds.
        </p>
      </>
    )
  },
  {
    id: "acceptable-use",
    title: "What's not allowed",
    body: (
      <>
        <p>When using the site, you must not:</p>
        <ul>
          <li>sell or upload anything illegal, harmful, misleading, or that you don&apos;t have the rights to;</li>
          <li>try to access accounts, stores or data that aren&apos;t yours, or interfere with how the site works;</li>
          <li>copy or scrape the site, or use it to send spam;</li>
          <li>misuse discount codes, payments or refunds.</li>
        </ul>
      </>
    )
  },
  {
    id: "our-content",
    title: "Our site and brand",
    body: (
      <p>
        The {LEGAL.company} name, logo, site design and software belong to us. You may not use them without our
        permission, except to share links to the site and its stores.
      </p>
    )
  },
  {
    id: "availability",
    title: "Keeping the site running",
    body: (
      <p>
        We work to keep the site available and working well, but we can&apos;t promise it will always be free of
        interruptions or errors. We may change or improve features over time.
      </p>
    )
  },
  {
    id: "liability",
    title: "Our responsibility to you",
    body: (
      <>
        <p>
          As far as the law allows, we aren&apos;t responsible for indirect losses, such as lost profits or lost data, and
          our total responsibility for any claim is limited to the amount you paid us for the product involved or, for
          creators, the amount we owe you.
        </p>
        <p>This doesn&apos;t limit any responsibility that the law doesn&apos;t allow us to limit.</p>
      </>
    )
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        If we change these terms, we&apos;ll post the new version on this page and update the date at the top. Using the
        site after a change means you accept the new terms.
      </p>
    )
  },
  {
    id: "law",
    title: "Which laws apply",
    body: (
      <p>
        These terms are governed by the laws of {LEGAL.region.replace(", Canada", "")} and the federal laws of Canada
        that apply there. Any dispute will be handled by the courts of {LEGAL.region.replace(", Canada", "")}, unless
        the law where you live gives you the right to bring it elsewhere.
      </p>
    )
  }
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      intro={<>The rules for buying from and selling with {LEGAL.company}, in plain language.</>}
      summary={[
        "We build and run online stores for creators, and sell their digital products.",
        "Payments are handled securely by Stripe, and digital products arrive straight after you pay.",
        "Sales are final, except when a file is faulty, missing or not as described, or you were charged twice.",
        "Creators keep ownership of their content. Their revenue share is agreed before their store launches.",
        <>These terms follow the laws of {LEGAL.region}.</>
      ]}
      sections={sections}
      other={{ href: "/privacy", label: "Privacy Policy" }}
    />
  );
}
