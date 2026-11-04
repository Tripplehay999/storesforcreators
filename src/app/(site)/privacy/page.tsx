import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/LegalPage";
import { DOWNLOAD_DAYS, MAX_DOWNLOADS } from "@/lib/downloads";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy | Stores for Creators",
  description: "What information Stores for Creators collects, why, who it's shared with, and the choices you have."
};

const mail = <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>;

const sections: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <>
        <p>
          {LEGAL.company} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) runs {LEGAL.site}. We build and run online stores for
          creators, take payments for the products sold in those stores, deliver them to buyers, and pay creators their
          share. We&apos;re based in {LEGAL.region}.
        </p>
        <p>This policy covers everyone who uses the site: visitors, buyers and creators with an account.</p>
      </>
    )
  },
  {
    id: "what-we-collect",
    title: "What we collect",
    body: (
      <>
        <h3>If you have a creator account</h3>
        <ul>
          <li>Your name, email address and, if you add it, your social media handle.</li>
          <li>
            Your password. It&apos;s stored by our login provider in a scrambled (hashed) form, so we can never see it.
          </li>
          <li>Your store details: store name, photo, bio, colours, and the products and files you add.</li>
          <li>
            The payout details you enter (for example a PayPal email or bank details) so we can pay you, and your email
            preferences.
          </li>
          <li>Records of your sales, balance and payouts, and notes our team keeps about your account, such as payout or support history.</li>
          <li>Ideas and captions you create with the AI tools in the creator hub.</li>
        </ul>

        <h3>If you apply to partner with us</h3>
        <p>
          Your name, email, social profile, follower count, content niche and anything you write in your message.
        </p>

        <h3>If you buy something</h3>
        <p>
          Payments are handled by Stripe. Your card details go straight to Stripe and are never sent to or stored by us.
          From Stripe we receive your email address, what you bought, the amount paid, any discount code used, and a
          payment reference.
        </p>

        <h3>When anyone visits a store</h3>
        <p>
          We count visits to store and product pages in hourly totals, together with where the visit came from in
          general terms (for example Instagram, TikTok or a direct visit). These counts don&apos;t include your name,
          email address, IP address or device. A creator&apos;s visits to their own store aren&apos;t counted.
        </p>
        <p>
          Like most websites, our hosting provider may keep short technical logs, such as IP addresses and browser
          type, to keep the site secure and working.
        </p>
      </>
    )
  },
  {
    id: "cookies",
    title: "Cookies and browser storage",
    body: (
      <>
        <p>We only use what the site needs to work. We don&apos;t use advertising cookies or third-party tracking.</p>
        <ul>
          <li><strong>Login cookies</strong> keep you signed in to your account.</li>
          <li><strong>A preference cookie</strong> remembers whether you chose light or dark mode in the creator hub.</li>
          <li>
            <strong>Browser session storage</strong> remembers that a visit has already been counted, so refreshing a
            page doesn&apos;t count twice. It clears when you close the tab.
          </li>
          <li><strong>Browser storage</strong> remembers that you&apos;ve finished the creator hub tour.</li>
        </ul>
      </>
    )
  },
  {
    id: "how-we-use-it",
    title: "How we use your information",
    body: (
      <ul>
        <li>To run your account and your store, and show your store to visitors.</li>
        <li>
          To process orders, deliver products and send receipts. Download links work for {DOWNLOAD_DAYS} days and up to{" "}
          {MAX_DOWNLOADS} downloads.
        </li>
        <li>To tell creators about their sales and payouts by email, and to pay them their share.</li>
        <li>To review partner applications and reply to them.</li>
        <li>To show creators their sales and visit numbers.</li>
        <li>To keep the site secure, prevent fraud, and meet our legal, tax and accounting obligations.</li>
        <li>To answer your questions when you contact us.</li>
      </ul>
    )
  },
  {
    id: "who-we-share-with",
    title: "Who we share it with",
    body: (
      <>
        <p>
          <strong>We don&apos;t sell your personal information.</strong> We share it only with the services that help us
          run the site, and only what they need:
        </p>
        <ul>
          <li><strong>Supabase</strong>: our database, logins and file storage.</li>
          <li><strong>Vercel</strong>: hosts the website.</li>
          <li><strong>Stripe</strong>: processes payments.</li>
          <li><strong>Resend</strong>: sends our emails, such as receipts and sale alerts.</li>
          <li><strong>Cloudflare</strong>: manages our domain name.</li>
          <li>
            <strong>Anthropic</strong>: powers the AI ideas and captions in the creator hub. When a creator uses them, we
            send that store&apos;s details, product names and descriptions, and summary numbers such as total visits and
            sales. We don&apos;t send buyers&apos; names or email addresses.
          </li>
        </ul>
        <p>
          When you buy from a store, the creator who runs it can see your order, including the email address you used,
          so they can help with any questions about it.
        </p>
        <p>
          A creator&apos;s store page, including the store name, photo and bio, is public while the store is set to
          public.
        </p>
        <p>We may also share information when the law requires it, or to protect our rights, users or the public.</p>
      </>
    )
  },
  {
    id: "where-its-stored",
    title: "Where it's stored",
    body: (
      <p>
        Our service providers may store and process information outside Canada, including in the United States. When
        that happens, the information may be subject to the laws of the country where it&apos;s held.
      </p>
    )
  },
  {
    id: "how-long",
    title: "How long we keep it",
    body: (
      <ul>
        <li>Account and store information: while your account is open.</li>
        <li>Order and payout records: for as long as tax and accounting laws require (in Canada, generally six years).</li>
        <li>Partner applications: while we review them and for our records afterwards, unless you ask us to delete yours.</li>
        <li>Visit counts: kept as totals, which don&apos;t identify anyone.</li>
      </ul>
    )
  },
  {
    id: "your-choices",
    title: "Your choices and rights",
    body: (
      <>
        <ul>
          <li>
            <strong>See or correct your information.</strong> Creators can update their details in the creator hub under{" "}
            <em>Storefront &amp; account</em>. For anything else, email {mail}.
          </li>
          <li><strong>Delete your account or information.</strong> Email {mail} and we&apos;ll take care of it, except for records the law requires us to keep.</li>
          <li><strong>Stop sale emails.</strong> Creators can turn off sale and payout emails in the creator hub under <em>Earnings</em>.</li>
          <li><strong>Withdraw consent</strong> to how we use your information at any time, though some services may then stop working for you.</li>
        </ul>
        <p>
          If you&apos;re not happy with how we&apos;ve handled your information, please tell us first so we can put it
          right. You can also contact the{" "}
          <a href="https://www.priv.gc.ca" target="_blank" rel="noreferrer">Office of the Privacy Commissioner of Canada</a>.
        </p>
      </>
    )
  },
  {
    id: "security",
    title: "How we protect it",
    body: (
      <p>
        Passwords are stored hashed, payments are handled by Stripe, downloadable files are kept private and shared only
        through time-limited links, and our database only lets each creator see their own store&apos;s information. No
        system is perfectly secure, but we take reasonable steps to protect your information.
      </p>
    )
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        The site isn&apos;t meant for children under 13, and we don&apos;t knowingly collect their information. Creator
        accounts are only for adults (see our <Link href="/terms">Terms</Link>). If you think a child has given us
        information, email {mail} and we&apos;ll delete it.
      </p>
    )
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        If we change this policy, we&apos;ll post the new version on this page and update the date at the top.
      </p>
    )
  }
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={<>How {LEGAL.company} collects, uses and protects your information, in plain language.</>}
      summary={[
        "We collect only what we need to run stores, take payments, deliver products and pay creators.",
        "We never sell your personal information.",
        "Card details go straight to Stripe. We never see or store them.",
        "Store visit counts are anonymous: we count visits, not people.",
        <>You can ask to see, correct or delete your information at any time by emailing {mail}.</>
      ]}
      sections={sections}
      other={{ href: "/terms", label: "Terms & Conditions" }}
    />
  );
}
