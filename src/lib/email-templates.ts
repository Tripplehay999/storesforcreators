import { CONTACT, LOGO, PUBLIC_SITE } from "./contact";
import { money } from "./format";
import type { Email } from "./email";

// Branded emails in the home page's style: lime header, ink ticker strip, heavy tight headings with a
// lime highlight, chunky outlined boxes with a hard shadow, and lilac / plum / lime step cards.
// Table layout and inline styles only, because that's what email apps render reliably. The hard shadow
// is a thicker right and bottom border (box-shadow doesn't work in Outlook or many Gmail apps).
// Everything a user typed goes through esc().

type Template = Omit<Email, "to">;

/** Signed "Email settings" and "Unsubscribe" links for optional emails (see email-links.ts). */
export type ManageLinks = { preferencesUrl: string; unsubscribeUrl: string } | null | undefined;

export function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// The home page palette (src/app/(site)/home.css).
const INK = "#1c1722";
const LIME = "#d4f57a";
const LILAC = "#d9cbff";
const LILAC_SOFT = "#ece4ff";
const PLUM = "#2a1f35";
const PINK = "#ff8fc8";
const CREAM = "#fbf8f2";
const TEXT = "#3d3546";
const MUTED = "#6b6172";
const LINE = "#e8e1e8";
const GREEN = "#12784a";

// The site's fonts load in Apple Mail and iPhone Mail; Gmail and Outlook use the fallbacks.
const HEAD = "Manrope,'Helvetica Neue',Helvetica,Arial,sans-serif";
const BODY = "'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif";
const SERIF = "'Instrument Serif',Georgia,'Times New Roman',serif";

/** The ink strip under the header, like the scrolling one on the home page. */
const TICKER = ["Budget planners", "Meal plans", "Study guides", "Workout programs"];

const STYLE = `
  @font-face { font-family: 'Manrope'; font-style: normal; font-weight: 400 800; src: url(${PUBLIC_SITE}/fonts/manrope-latin.woff2) format('woff2'); }
  @font-face { font-family: 'DM Sans'; font-style: normal; font-weight: 400 800; src: url(${PUBLIC_SITE}/fonts/dm-sans-latin.woff2) format('woff2'); }
  @font-face { font-family: 'Instrument Serif'; font-style: italic; font-weight: 400; src: url(${PUBLIC_SITE}/fonts/instrument-serif-italic-latin.woff2) format('woff2'); }
  :root { color-scheme: light only; supported-color-schemes: light only; }
  a { color: ${INK}; }
  @media (max-width: 540px) {
    .sfc-outer { padding: 16px 10px 28px !important; }
    .sfc-pad { padding-left: 22px !important; padding-right: 22px !important; }
    .sfc-h1 { font-size: 30px !important; letter-spacing: -1px !important; }
    .sfc-wide { display: none !important; }
  }`;

/** A 2px ink outline with a thick bottom-right edge: the site's hard drop shadow. */
function boxBorder(shadow = 4) {
  return `border:2px solid ${INK};border-right-width:${shadow}px;border-bottom-width:${shadow}px;`;
}

function spacer(height: number) {
  return `<tr><td height="${height}" style="height:${height}px;font-size:0;line-height:0;">&nbsp;</td></tr>`;
}

export type LayoutInput = {
  preheader: string;
  /** The small white pill in the header, like "Receipt" or "New sale". */
  tag: string;
  heading: string;
  /** Second line of the heading, with the lime highlighter behind it. */
  mark?: string;
  body: string;
  cta?: { label: string; url: string };
  footnote?: string;
  /** Optional emails only: adds "Email settings · Unsubscribe" to the footer. */
  manage?: ManageLinks;
};

export function emailLayout({ preheader, tag, heading, mark, body, cta, footnote, manage }: LayoutInput) {
  const title = mark ? `${heading} ${mark}` : heading;
  const footLink = `color:${MUTED};text-decoration:underline;`;
  const manageLine = manage
    ? `<a href="${esc(manage.preferencesUrl)}" style="${footLink}">Email settings</a> &nbsp;·&nbsp; <a href="${esc(manage.unsubscribeUrl)}" style="${footLink}">Unsubscribe</a><br>`
    : "";

  const ticker = TICKER.map((item, index) => {
    const wide = index >= 2 ? ` class="sfc-wide"` : "";
    const dot = index > 0 ? `<span${wide} style="color:${PINK};padding:0 10px;">&#9679;</span>` : "";
    return `${dot}<span${wide}>${esc(item)}</span>`;
  }).join("");

  const button = cta
    ? `${spacer(26)}
       <tr><td>
         <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:separate;">
           <tr><td style="background:${INK};border:2px solid ${INK};border-radius:14px;">
             <a href="${esc(cta.url)}" style="display:inline-block;padding:15px 26px;border-radius:14px;font-family:${HEAD};font-size:16px;font-weight:800;letter-spacing:-0.2px;line-height:1.2;color:${LIME};text-decoration:none;">${esc(cta.label)}&nbsp;&rarr;</a>
           </td></tr>
         </table>
       </td></tr>`
    : "";

  const headingHtml = esc(heading)
    + (mark ? `<br><span style="background:${LIME};color:${INK};border-radius:8px;padding:0 7px;-webkit-box-decoration-break:clone;box-decoration-break:clone;">${esc(mark)}</span>` : "");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${esc(title)}</title>
<style>${STYLE}</style>
</head>
<body style="margin:0;padding:0;background:${CREAM};color:${INK};font-family:${BODY};-webkit-font-smoothing:antialiased;">
  <span style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};">
    <tr><td align="center" class="sfc-outer" style="padding:32px 14px 40px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">
        <tr><td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;${boxBorder(6)}border-radius:24px;border-collapse:separate;overflow:hidden;">
            <tr><td class="sfc-pad" style="background:${LIME};padding:18px 30px;border-bottom:2px solid ${INK};border-radius:22px 18px 0 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle">
                    <a href="${PUBLIC_SITE}" style="text-decoration:none;color:${INK};">
                      <img src="${LOGO.tile}" width="40" height="40" alt="" style="display:inline-block;width:40px;height:40px;border:0;border-radius:10px;vertical-align:middle;">
                      <span style="margin-left:9px;font-family:${HEAD};font-size:17px;font-weight:800;letter-spacing:-0.4px;vertical-align:middle;color:${INK};">Stores for Creators</span>
                    </a>
                  </td>
                  <td align="right" valign="middle" style="padding-left:10px;">
                    <span style="display:inline-block;padding:6px 12px;border:2px solid ${INK};border-radius:99px;background:#ffffff;font-family:${BODY};font-size:12px;font-weight:700;line-height:1.2;white-space:nowrap;color:${INK};">${esc(tag)}</span>
                  </td>
                </tr>
              </table>
            </td></tr>
            <tr><td class="sfc-pad" align="center" style="background:${INK};padding:11px 30px;border-bottom:2px solid ${INK};font-family:${HEAD};font-size:13px;font-weight:800;letter-spacing:-0.1px;line-height:1.5;color:${LIME};">${ticker}</td></tr>
            <tr><td class="sfc-pad" style="padding:34px 30px 34px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr><td class="sfc-h1" style="padding-bottom:18px;font-family:${HEAD};font-size:36px;font-weight:800;letter-spacing:-1.4px;line-height:1.24;color:${INK};">${headingHtml}</td></tr>
                <tr><td style="font-family:${BODY};font-size:16px;line-height:1.6;color:${TEXT};overflow-wrap:break-word;word-break:break-word;">${body}</td></tr>
                ${button}
              </table>
            </td></tr>
            ${footnote ? `<tr><td class="sfc-pad" style="background:${LILAC_SOFT};padding:16px 30px;border-top:2px solid ${INK};border-radius:0 0 18px 20px;font-family:${BODY};font-size:13px;line-height:1.55;color:${MUTED};">${footnote}</td></tr>` : ""}
          </table>
        </td></tr>
        <tr><td align="center" style="padding:24px 16px 0;font-family:${BODY};font-size:12px;line-height:1.7;color:${MUTED};">
          <span style="font-family:${SERIF};font-style:italic;font-size:17px;color:${INK};">You post. We sell. You get paid.</span><br>
          ${manageLine}Questions? Write to <a href="mailto:${CONTACT.support}" style="${footLink}">${CONTACT.support}</a><br>
          Stores for Creators &nbsp;·&nbsp; <a href="${PUBLIC_SITE}" style="${footLink}">storesforcreators.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** A cream box of label / value rows, like an order summary. */
function table(rows: [string, string][]) {
  const cells = rows.map(([label, value], index) => {
    const line = index > 0 ? `border-top:1px solid ${LINE};` : "";
    return `<tr>
      <td style="${line}padding:12px 16px;font-family:${BODY};font-size:14px;color:${MUTED};">${esc(label)}</td>
      <td align="right" style="${line}padding:12px 16px;font-family:${HEAD};font-size:15px;font-weight:800;letter-spacing:-0.2px;color:${INK};">${esc(value)}</td>
    </tr>`;
  }).join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;background:${CREAM};border:2px solid ${INK};border-radius:16px;border-collapse:separate;">${cells}</table>`;
}

/** The "+$29.50 · New order" sticker from the home page, for the money in an email. */
function amountSticker(amount: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:20px;border-collapse:separate;">
    <tr><td style="background:#ffffff;${boxBorder(4)}border-radius:16px;padding:12px 18px 13px;">
      <div style="font-family:${HEAD};font-size:30px;font-weight:800;letter-spacing:-1px;line-height:1.15;color:${GREEN};">${esc(amount)}</div>
      <div style="font-family:${BODY};font-size:13px;font-weight:700;line-height:1.4;color:${INK};">${esc(label)}</div>
    </td></tr>
  </table>`;
}

// The three "How it works" card colours, in the home page's order.
const STEP_COLORS = [
  { background: LILAC, number: INK, title: INK, text: TEXT },
  { background: PLUM, number: LIME, title: "#ffffff", text: "#d9cfe0" },
  { background: LIME, number: INK, title: INK, text: TEXT }
];

/** Numbered step cards, like "How it works" on the home page. */
function steps(items: { title: string; text: string }[]) {
  const cards = items.map((item, index) => {
    const color = STEP_COLORS[index % STEP_COLORS.length];
    return `${index > 0 ? spacer(12) : ""}
    <tr><td style="background:${color.background};${boxBorder(4)}border-radius:18px;padding:16px 18px 17px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="44" valign="top" style="padding-right:12px;font-family:${HEAD};font-size:40px;font-weight:800;letter-spacing:-2px;line-height:0.95;color:${color.number};">${index + 1}</td>
          <td valign="top" style="font-family:${BODY};font-size:15px;line-height:1.5;color:${color.text};">
            <span style="font-family:${HEAD};font-size:17px;font-weight:800;letter-spacing:-0.3px;color:${color.title};">${esc(item.title)}</span><br>${esc(item.text)}
          </td>
        </tr>
      </table>
    </td></tr>`;
  }).join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 4px;border-collapse:separate;">${cards}</table>`;
}

function stepsText(items: { title: string; text: string }[]) {
  return items.map((item, index) => `${index + 1}. ${item.title}: ${item.text}`).join("\n");
}

/** A paragraph after a block (steps, a table), spaced like the rest of the body. */
function after(html: string) {
  return `<div style="margin-top:20px;">${html}</div>`;
}

/** The plain-text footer of optional emails. */
function manageText(manage: ManageLinks) {
  return manage ? `\n\n--\nEmail settings: ${manage.preferencesUrl}\nUnsubscribe: ${manage.unsubscribeUrl}` : "";
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

function strong(text: string) {
  return `<strong style="color:${INK};">${esc(text)}</strong>`;
}

function storeLink(url: string) {
  return `<a href="${esc(url)}" style="color:${INK};font-weight:700;overflow-wrap:anywhere;word-break:break-all;">${esc(url.replace(/^https?:\/\/(www\.)?/, ""))}</a>`;
}

/** To a creator when someone buys from their store. `first` marks the store's very first sale. */
export function newSaleEmail(input: {
  name: string;
  storeName: string;
  productName: string;
  amount: number;
  share: number;
  dashboardUrl: string;
  first?: boolean;
  manage?: ManageLinks;
}): Template {
  const name = firstName(input.name);
  const heading = input.first ? `${name}, you made` : `Nice one, ${name}.`;
  const mark = input.first ? "your first sale!" : "You made a sale.";
  const extra = input.first
    ? after("This is the big one. Tip: tell your followers. A post about your first sale often brings in the next few.")
    : "";

  return {
    subject: input.first ? `Your first sale: ${input.productName}` : `You made a sale: ${input.productName}`,
    unsubscribeUrl: input.manage?.unsubscribeUrl,
    html: emailLayout({
      preheader: `${money(input.share, 2)} is yours from a ${input.storeName} order.`,
      tag: input.first ? "First sale!" : "New sale",
      heading,
      mark,
      body: `Someone just bought ${strong(input.productName)} from ${esc(input.storeName)}.`
        + amountSticker(`+${money(input.share, 2)}`, `Your share · sold for ${money(input.amount, 2)}`)
        + extra,
      cta: { label: "See it in your dashboard", url: input.dashboardUrl },
      footnote: "You're getting this because sale emails are on in your account settings.",
      manage: input.manage
    }),
    text: `${heading} ${mark}\n\n${input.productName} from ${input.storeName}\nSale price: ${money(input.amount, 2)}\nYour share: ${money(input.share, 2)}\n\nSee it in your dashboard: ${input.dashboardUrl}${manageText(input.manage)}`
  };
}

/** To a buyer after paying: their receipt, plus the download link for digital products. */
export function receiptEmail(input: { productName: string; storeName: string; amount: number; downloadUrl?: string; storeUrl: string }): Template {
  const delivery = input.downloadUrl
    ? "Your download is ready. The button below works for 30 days and up to 5 downloads."
    : `${esc(input.storeName)} will be in touch about what happens next.`;

  return {
    subject: `Your order: ${input.productName}`,
    html: emailLayout({
      preheader: input.downloadUrl ? "Your download is ready." : `Thanks for your order from ${input.storeName}.`,
      tag: "Receipt",
      heading: "Thanks for",
      mark: "your order!",
      body: `You bought ${strong(input.productName)} from ${esc(input.storeName)}. ${delivery}`
        + table([["Product", input.productName], ["Store", input.storeName], ["Paid", money(input.amount, 2)]]),
      cta: input.downloadUrl ? { label: "Download your file", url: input.downloadUrl } : { label: "Visit the store", url: input.storeUrl },
      footnote: "Keep this email: it's your receipt. Reply if anything's wrong with your order."
    }),
    text: `Thanks for your order!\n\n${input.productName} from ${input.storeName}\nPaid: ${money(input.amount, 2)}\n\n${input.downloadUrl ? `Download your file (works for 30 days, up to 5 downloads): ${input.downloadUrl}` : `${input.storeName} will be in touch about what happens next.`}`
  };
}

/** To a creator when a payout is marked as sent. */
export function payoutSentEmail(input: { name: string; amount: number; method: string; reference: string; dashboardUrl: string; manage?: ManageLinks }): Template {
  const name = firstName(input.name);
  const rows: [string, string][] = [];
  if (input.method) rows.push(["Sent via", input.method]);
  if (input.reference) rows.push(["Reference", input.reference]);

  return {
    subject: `${money(input.amount, 2)} is on its way to you`,
    unsubscribeUrl: input.manage?.unsubscribeUrl,
    html: emailLayout({
      preheader: `We've sent your payout of ${money(input.amount, 2)}.`,
      tag: "Payout",
      heading: `Payday, ${name}.`,
      mark: "Your money's on its way.",
      body: "We've sent your payout. Depending on the method, it can take a few days to land."
        + amountSticker(money(input.amount, 2), "Your payout")
        + (rows.length ? table(rows) : ""),
      cta: { label: "View your payouts", url: input.dashboardUrl },
      manage: input.manage
    }),
    text: `Payday, ${name}. Your money's on its way.\n\nWe've sent your payout of ${money(input.amount, 2)}${input.method ? ` via ${input.method}` : ""}.${input.reference ? `\nReference: ${input.reference}` : ""}\n\nView your payouts: ${input.dashboardUrl}${manageText(input.manage)}`
  };
}

/** To admins when a creator asks to be paid. */
export function payoutRequestedEmail(input: { storeName: string; amount: number; method: string; adminUrl: string }): Template {
  return {
    subject: `Payout request: ${money(input.amount, 2)} for ${input.storeName}`,
    html: emailLayout({
      preheader: `${input.storeName} asked for ${money(input.amount, 2)}.`,
      tag: "Admin",
      heading: "New payout request",
      body: `${strong(input.storeName)} asked to be paid.`
        + table([["Store", input.storeName], ["Amount", money(input.amount, 2)], ["Method", input.method || "Not set"]]),
      cta: { label: "Review in the admin panel", url: input.adminUrl }
    }),
    text: `New payout request\n\n${input.storeName} asked to be paid ${money(input.amount, 2)}${input.method ? ` by ${input.method}` : ""}.\n\nReview: ${input.adminUrl}`
  };
}

/** To the applicant right after they apply. */
export function applicationReceivedEmail(input: { name: string; siteUrl: string }): Template {
  const name = firstName(input.name);

  return {
    subject: "We got your application",
    html: emailLayout({
      preheader: "Thanks for applying to Stores for Creators.",
      tag: "Application",
      heading: `Thanks for applying, ${name}.`,
      mark: "We'll be in touch.",
      body: "We've got your application and we'll review it soon. You'll hear from us by email either way. In the meantime, you can start setting up your store from your creator hub.",
      cta: { label: "Open your creator hub", url: `${input.siteUrl}/dashboard` }
    }),
    text: `Thanks for applying, ${name}. We'll be in touch.\n\nWe've got your application and we'll review it soon. You'll hear from us by email either way.\n\nYour creator hub: ${input.siteUrl}/dashboard`
  };
}

/** To admins when someone applies. */
export function newApplicationEmail(input: { name: string; email: string; social: string; followers: string; niche: string; message: string; adminUrl: string }): Template {
  return {
    subject: `New application: ${input.name}`,
    replyTo: input.email,
    html: emailLayout({
      preheader: `${input.name} (${input.followers}) applied.`,
      tag: "Admin",
      heading: "New creator application",
      body: table([["Name", input.name], ["Email", input.email], ["Profile", input.social], ["Followers", input.followers], ["Niche", input.niche || "Not given"]])
        + (input.message ? `<div style="margin-top:14px;padding:14px 16px;border:2px solid ${INK};border-radius:16px;background:${LILAC_SOFT};font-size:15px;line-height:1.55;color:${TEXT};">${esc(input.message)}</div>` : ""),
      cta: { label: "Review applications", url: input.adminUrl },
      footnote: "Reply to this email to answer the applicant directly."
    }),
    text: `New creator application\n\nName: ${input.name}\nEmail: ${input.email}\nProfile: ${input.social}\nFollowers: ${input.followers}\nNiche: ${input.niche || "Not given"}\n\n${input.message}\n\nReview: ${input.adminUrl}`
  };
}

/** To the applicant when an admin accepts or declines. */
export function applicationDecisionEmail(input: { name: string; accepted: boolean; siteUrl: string }): Template {
  const name = firstName(input.name);

  return input.accepted
    ? {
        subject: "You're in: welcome to Stores for Creators",
        html: emailLayout({
          preheader: "Your application was accepted.",
          tag: "You're in",
          heading: `Good news, ${name}.`,
          mark: "You're in!",
          body: "Your application was accepted. The next step is your store: add your photo, write a short bio and add your first product. We'll be in touch about the details of your partnership."
            + after(`Questions about the partnership in the meantime? Write to <a href="mailto:${CONTACT.partnerships}" style="color:${INK};font-weight:700;">${CONTACT.partnerships}</a>.`),
          cta: { label: "Set up your store", url: `${input.siteUrl}/dashboard/store` }
        }),
        text: `Good news, ${name}. You're in!\n\nYour application was accepted. Set up your store: ${input.siteUrl}/dashboard/store\n\nQuestions about the partnership? Write to ${CONTACT.partnerships}.`
      }
    : {
        subject: "About your Stores for Creators application",
        html: emailLayout({
          preheader: "An update on your application.",
          tag: "Application",
          heading: `Thanks for applying, ${name}`,
          body: "We've reviewed your application and it isn't the right fit for us right now. That can change as your audience grows, so you're welcome to apply again in the future."
        }),
        text: `Thanks for applying, ${name}\n\nWe've reviewed your application and it isn't the right fit for us right now. You're welcome to apply again in the future.`
      };
}

/** To a creator when their store first goes live. */
export function storeLiveEmail(input: { name: string; storeName: string; storeUrl: string; siteUrl: string; hasProducts?: boolean }): Template {
  const next = input.hasProducts
    ? { text: "Next up: grab your share links from the Promote page and put your store in your bio, so you can see which posts bring in sales.", label: "Get your share links", url: `${input.siteUrl}/dashboard/promote` }
    : { text: "Next up: add your products, then grab your share links from the Promote page so you can track which posts bring in sales.", label: "Add your first product", url: `${input.siteUrl}/dashboard/products` };

  return {
    subject: `${input.storeName} is live`,
    html: emailLayout({
      preheader: "Your store is live. Here's what to do next.",
      tag: "Store live",
      heading: input.storeName,
      mark: "is live!",
      body: `Your store is up at ${storeLink(input.storeUrl)}.` + after(esc(next.text)),
      cta: { label: next.label, url: next.url }
    }),
    text: `${input.storeName} is live!\n\nYour store: ${input.storeUrl}\n${next.text}\n${next.label}: ${next.url}`
  };
}

// ── Onboarding ───────────────────────────────────────────────
// The welcome email goes out when someone confirms their account. The four follow-ups are sent by the
// daily onboarding run (src/lib/onboarding.ts), each at most once, only while that step is still undone.

const WELCOME_STEPS = [
  { title: "Set up your store", text: "Pick a name and web address, add a photo and a line or two about you. About 5 minutes." },
  { title: "Add your first product", text: "A guide, preset, template, plan or anything you'd like to sell. Upload the file and we send it to every buyer automatically." },
  { title: "Share your link", text: "Put your store in your bio and posts. Your hub shows which posts bring in visits and sales." }
];

/** To a new creator as soon as they confirm their email. */
export function welcomeEmail(input: { name: string; siteUrl: string; hasStore?: boolean; manage?: ManageLinks }): Template {
  const name = firstName(input.name);
  const cta = input.hasStore
    ? { label: "Open your creator hub", url: `${input.siteUrl}/dashboard` }
    : { label: "Set up my store", url: `${input.siteUrl}/dashboard/store` };

  return {
    subject: `Welcome to Stores for Creators, ${name}`,
    unsubscribeUrl: input.manage?.unsubscribeUrl,
    html: emailLayout({
      preheader: "Your account is ready. Here's how to get your store selling, in three steps.",
      tag: "Welcome",
      heading: `Welcome, ${name}!`,
      mark: "Let's get your store ready.",
      body: "Your account is confirmed. Here's how it works:"
        + steps(WELCOME_STEPS)
        + after("Your creator hub has a checklist that ticks off as you go. Stuck at any point? Just reply to this email and we'll help."),
      cta,
      footnote: "Over the next couple of weeks we'll send a few short tips, only for steps you haven't done yet.",
      manage: input.manage
    }),
    text: `Welcome, ${name}! Let's get your store ready.\n\nYour account is confirmed. Here's how it works:\n\n${stepsText(WELCOME_STEPS)}\n\nStuck at any point? Just reply to this email and we'll help.\n\n${cta.label}: ${cta.url}${manageText(input.manage)}`
  };
}

/** Follow-up: signed up 2+ days ago, no store yet. */
export function nudgeStoreEmail(input: { name: string; siteUrl: string; manage?: ManageLinks }): Template {
  const name = firstName(input.name);
  const url = `${input.siteUrl}/dashboard/store`;
  const items = [
    { title: "Name your store", text: "Your name or brand works great. This also picks your web address." },
    { title: "Add a photo", text: "A clear photo of you helps followers trust it's really your store." },
    { title: "Write a short bio", text: "One or two sentences about what you make and who it's for." }
  ];

  return {
    subject: "Your store takes about 5 minutes",
    unsubscribeUrl: input.manage?.unsubscribeUrl,
    html: emailLayout({
      preheader: "Three quick things and your store is up. You can change everything later.",
      tag: "Quick tip",
      heading: `${name}, your store`,
      mark: "is waiting.",
      body: "You've got an account, but you haven't made your store yet. It's three quick things:"
        + steps(items)
        + after("You can change all of it later, so don't worry about getting it perfect."),
      cta: { label: "Create my store", url },
      footnote: "You're getting this because you signed up recently.",
      manage: input.manage
    }),
    text: `${name}, your store is waiting.\n\nYou've got an account, but you haven't made your store yet. It's three quick things:\n\n${stepsText(items)}\n\nYou can change all of it later.\n\nCreate my store: ${url}${manageText(input.manage)}`
  };
}

/** Follow-up: store made 2+ days ago, still no products. */
export function nudgeProductEmail(input: { name: string; storeName: string; siteUrl: string; manage?: ManageLinks }): Template {
  const name = firstName(input.name);
  const url = `${input.siteUrl}/dashboard/products`;
  const ideas = "a guide or e-book, presets or templates, a workout or meal plan, a recipe pack, or a short course";
  const items = [
    { title: "Give it a name and price", text: "Say what buyers get in plain words." },
    { title: "Add a photo", text: "A cover image or a picture of what's inside." },
    { title: "Upload the file", text: "We email it to every buyer the moment they pay." }
  ];

  return {
    subject: `Add your first product to ${input.storeName}`,
    unsubscribeUrl: input.manage?.unsubscribeUrl,
    html: emailLayout({
      preheader: "Your store is set up. Now it needs something to sell.",
      tag: "Quick tip",
      heading: `${name}, ready for your`,
      mark: "first product?",
      body: `${strong(input.storeName)} is set up. Now it needs something to sell.`
        + after(`Things that sell well for creators: ${esc(ideas)}. Start with the one your followers ask you about most.`)
        + steps(items),
      cta: { label: "Add a product", url },
      footnote: "You're getting this because your store doesn't have a product yet.",
      manage: input.manage
    }),
    text: `${name}, ready for your first product?\n\n${input.storeName} is set up. Now it needs something to sell.\n\nThings that sell well for creators: ${ideas}.\n\n${stepsText(items)}\n\nAdd a product: ${url}${manageText(input.manage)}`
  };
}

/** Follow-up: has products, but the store is still hidden. */
export function nudgePublishEmail(input: { name: string; storeName: string; productCount: number; siteUrl: string; manage?: ManageLinks }): Template {
  const name = firstName(input.name);
  const url = `${input.siteUrl}/dashboard/store`;
  const products = input.productCount === 1 ? "a product" : `${input.productCount} products`;

  return {
    subject: `${input.storeName} is still hidden`,
    unsubscribeUrl: input.manage?.unsubscribeUrl,
    html: emailLayout({
      preheader: "Visitors can't see your store yet. It's one switch to fix.",
      tag: "Quick tip",
      heading: `${name}, your store is`,
      mark: "ready to show.",
      body: `You've added ${products}, but ${strong(input.storeName)} is still hidden, so visitors can't see it yet.`
        + steps([
          { title: "Open Storefront", text: "It's in the menu of your creator hub." },
          { title: "Turn on \"Store is public\"", text: "This lets visitors see your store and your products." },
          { title: "Press save", text: "That's it. Your store link works straight away." }
        ]),
      cta: { label: "Make my store public", url },
      footnote: "You're getting this because your store is hidden.",
      manage: input.manage
    }),
    text: `${name}, your store is ready to show.\n\nYou've added ${products}, but ${input.storeName} is still hidden, so visitors can't see it yet.\n\nOpen Storefront in your hub, turn on "Store is public", and press save.\n\n${url}${manageText(input.manage)}`
  };
}

/** Follow-up: public, has products, no sales yet after 5+ days. */
export function nudgeShareEmail(input: { name: string; storeName: string; storeUrl: string; siteUrl: string; manage?: ManageLinks }): Template {
  const name = firstName(input.name);
  const url = `${input.siteUrl}/dashboard/promote`;
  const tips = [
    { title: "Put your store link in your bio", text: "On every platform you post on. It's where most first buyers come from." },
    { title: "Use your share links", text: "The Promote page has a link for each platform, so you can see which one brings buyers." },
    { title: "Give people a reason to buy now", text: "A launch discount code for the first week works well. You can make one on the Promote page." }
  ];

  return {
    subject: "3 ways to get your first sale",
    unsubscribeUrl: input.manage?.unsubscribeUrl,
    html: emailLayout({
      preheader: "Most first sales come from sharing. Here's what works.",
      tag: "Quick tip",
      heading: "Let's get your",
      mark: `first sale, ${name}.`,
      body: `${strong(input.storeName)} is live at ${storeLink(input.storeUrl)}. Most first sales come from sharing it. Three things that help:`
        + steps(tips),
      cta: { label: "Open Promote", url },
      footnote: "You're getting this because your store hasn't made a sale yet.",
      manage: input.manage
    }),
    text: `Let's get your first sale, ${name}.\n\n${input.storeName} is live at ${input.storeUrl}. Most first sales come from sharing it:\n\n${stepsText(tips)}\n\nOpen Promote: ${url}${manageText(input.manage)}`
  };
}
