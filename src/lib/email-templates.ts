import { money } from "./format";
import type { Email } from "./email";

// Branded transactional emails. Table layout and inline styles, because that's what email clients
// render reliably. Everything a user typed goes through esc().

type Template = Omit<Email, "to">;

export function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout({ preheader, heading, body, cta, footnote }: {
  preheader: string;
  heading: string;
  body: string;
  cta?: { label: string; url: string };
  footnote?: string;
}) {
  const button = cta
    ? `<tr><td style="padding:8px 0 4px;">
         <a href="${esc(cta.url)}" style="display:inline-block;padding:14px 26px;border-radius:12px;background:#1c1722;color:#d4f57a;font-weight:800;font-size:15px;text-decoration:none;">${esc(cta.label)}</a>
       </td></tr>`
    : "";

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(heading)}</title></head>
<body style="margin:0;padding:0;background:#f4f1ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1722;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:2px solid #1c1722;border-radius:18px;overflow:hidden;">
        <tr><td style="background:#d4f57a;padding:18px 28px;border-bottom:2px solid #1c1722;">
          <span style="display:inline-block;width:34px;height:34px;line-height:34px;text-align:center;border-radius:9px;background:#1c1722;color:#d4f57a;font-weight:800;font-size:12px;vertical-align:middle;">SFC</span>
          <span style="margin-left:10px;font-weight:800;font-size:15px;vertical-align:middle;">Stores for Creators</span>
        </td></tr>
        <tr><td style="padding:30px 28px 26px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="font-size:24px;line-height:1.25;font-weight:800;padding-bottom:14px;">${esc(heading)}</td></tr>
            <tr><td style="font-size:15px;line-height:1.6;color:#3c3542;padding-bottom:18px;">${body}</td></tr>
            ${button}
          </table>
        </td></tr>
        <tr><td style="padding:16px 28px 22px;border-top:1px solid #ece7df;font-size:12px;line-height:1.5;color:#7a7180;">
          ${footnote ? `${footnote}<br>` : ""}Stores for Creators · Online stores for creators, designed and run for you.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function row(label: string, value: string) {
  return `<tr><td style="padding:6px 0;color:#7a7180;">${esc(label)}</td><td style="padding:6px 0;text-align:right;font-weight:700;">${esc(value)}</td></tr>`;
}

function table(rows: [string, string][]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;border-top:1px solid #ece7df;font-size:14px;">${rows.map(([label, value]) => row(label, value)).join("")}</table>`;
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

/** To a creator when someone buys from their store. */
export function newSaleEmail(input: { name: string; storeName: string; productName: string; amount: number; share: number; dashboardUrl: string }): Template {
  return {
    subject: `You made a sale: ${input.productName}`,
    html: layout({
      preheader: `${money(input.share, 2)} is yours from a ${input.storeName} order.`,
      heading: `Nice one, ${firstName(input.name)}. You made a sale.`,
      body: `Someone just bought <strong>${esc(input.productName)}</strong> from ${esc(input.storeName)}.`
        + table([["Sale price", money(input.amount, 2)], ["Your share", money(input.share, 2)]]),
      cta: { label: "See it in your dashboard", url: input.dashboardUrl },
      footnote: "You're getting this because sale emails are on in your account settings."
    }),
    text: `Nice one, ${firstName(input.name)}. You made a sale.\n\n${input.productName} from ${input.storeName}\nSale price: ${money(input.amount, 2)}\nYour share: ${money(input.share, 2)}\n\nSee it in your dashboard: ${input.dashboardUrl}`
  };
}

/** To a buyer after paying: their receipt, plus the download link for digital products. */
export function receiptEmail(input: { productName: string; storeName: string; amount: number; downloadUrl?: string; storeUrl: string }): Template {
  const delivery = input.downloadUrl
    ? `Your download is ready. The link works for 30 days and up to 5 downloads.`
    : `${esc(input.storeName)} will be in touch about what happens next.`;

  return {
    subject: `Your order: ${input.productName}`,
    html: layout({
      preheader: input.downloadUrl ? "Your download is ready." : `Thanks for your order from ${input.storeName}.`,
      heading: "Thanks for your order",
      body: `You bought <strong>${esc(input.productName)}</strong> from ${esc(input.storeName)}. ${delivery}`
        + table([["Paid", money(input.amount, 2)]]),
      cta: input.downloadUrl ? { label: "Download your file", url: input.downloadUrl } : { label: "Visit the store", url: input.storeUrl },
      footnote: "Keep this email: it's your receipt. Reply if anything's wrong with your order."
    }),
    text: `Thanks for your order\n\n${input.productName} from ${input.storeName}\nPaid: ${money(input.amount, 2)}\n\n${input.downloadUrl ? `Download your file (works for 30 days, up to 5 downloads): ${input.downloadUrl}` : `${input.storeName} will be in touch about what happens next.`}`
  };
}

/** To a creator when a payout is marked as sent. */
export function payoutSentEmail(input: { name: string; amount: number; method: string; reference: string; dashboardUrl: string }): Template {
  const rows: [string, string][] = [["Amount", money(input.amount, 2)]];
  if (input.method) rows.push(["Sent via", input.method]);
  if (input.reference) rows.push(["Reference", input.reference]);

  return {
    subject: `${money(input.amount, 2)} is on its way to you`,
    html: layout({
      preheader: `We've sent your payout of ${money(input.amount, 2)}.`,
      heading: `Payday, ${firstName(input.name)}`,
      body: "We've sent your payout. Depending on the method, it can take a few days to land." + table(rows),
      cta: { label: "View your payouts", url: input.dashboardUrl }
    }),
    text: `Payday, ${firstName(input.name)}\n\nWe've sent your payout of ${money(input.amount, 2)}${input.method ? ` via ${input.method}` : ""}.${input.reference ? `\nReference: ${input.reference}` : ""}\n\nView your payouts: ${input.dashboardUrl}`
  };
}

/** To admins when a creator asks to be paid. */
export function payoutRequestedEmail(input: { storeName: string; amount: number; method: string; adminUrl: string }): Template {
  return {
    subject: `Payout request: ${money(input.amount, 2)} for ${input.storeName}`,
    html: layout({
      preheader: `${input.storeName} asked for ${money(input.amount, 2)}.`,
      heading: "New payout request",
      body: `<strong>${esc(input.storeName)}</strong> asked to be paid ${money(input.amount, 2)}${input.method ? ` by ${esc(input.method)}` : ""}.`,
      cta: { label: "Review in the admin panel", url: input.adminUrl }
    }),
    text: `New payout request\n\n${input.storeName} asked to be paid ${money(input.amount, 2)}${input.method ? ` by ${input.method}` : ""}.\n\nReview: ${input.adminUrl}`
  };
}

/** To the applicant right after they apply. */
export function applicationReceivedEmail(input: { name: string; siteUrl: string }): Template {
  return {
    subject: "We got your application",
    html: layout({
      preheader: "Thanks for applying to Stores for Creators.",
      heading: `Thanks for applying, ${firstName(input.name)}`,
      body: "We've got your application and we'll review it soon. You'll hear from us by email either way. In the meantime, you can start setting up your store from your creator hub.",
      cta: { label: "Open your creator hub", url: `${input.siteUrl}/dashboard` }
    }),
    text: `Thanks for applying, ${firstName(input.name)}\n\nWe've got your application and we'll review it soon. You'll hear from us by email either way.\n\nYour creator hub: ${input.siteUrl}/dashboard`
  };
}

/** To admins when someone applies. */
export function newApplicationEmail(input: { name: string; email: string; social: string; followers: string; niche: string; message: string; adminUrl: string }): Template {
  return {
    subject: `New application: ${input.name}`,
    replyTo: input.email,
    html: layout({
      preheader: `${input.name} (${input.followers}) applied.`,
      heading: "New creator application",
      body: table([["Name", input.name], ["Email", input.email], ["Profile", input.social], ["Followers", input.followers], ["Niche", input.niche || "Not given"]])
        + (input.message ? `<p style="margin:16px 0 0;padding:12px 14px;border-radius:10px;background:#f6f2ea;">${esc(input.message)}</p>` : ""),
      cta: { label: "Review applications", url: input.adminUrl },
      footnote: "Reply to this email to answer the applicant directly."
    }),
    text: `New creator application\n\nName: ${input.name}\nEmail: ${input.email}\nProfile: ${input.social}\nFollowers: ${input.followers}\nNiche: ${input.niche || "Not given"}\n\n${input.message}\n\nReview: ${input.adminUrl}`
  };
}

/** To the applicant when an admin accepts or declines. */
export function applicationDecisionEmail(input: { name: string; accepted: boolean; siteUrl: string }): Template {
  return input.accepted
    ? {
        subject: "You're in: welcome to Stores for Creators",
        html: layout({
          preheader: "Your application was accepted.",
          heading: `You're in, ${firstName(input.name)}!`,
          body: "Your application was accepted. The next step is your store: add your photo, write a short bio and add your first product. We'll be in touch about the details of your partnership.",
          cta: { label: "Set up your store", url: `${input.siteUrl}/dashboard/store` }
        }),
        text: `You're in, ${firstName(input.name)}!\n\nYour application was accepted. Set up your store: ${input.siteUrl}/dashboard/store`
      }
    : {
        subject: "About your Stores for Creators application",
        html: layout({
          preheader: "An update on your application.",
          heading: `Thanks for applying, ${firstName(input.name)}`,
          body: "We've reviewed your application and it isn't the right fit for us right now. That can change as your audience grows, so you're welcome to apply again in the future."
        }),
        text: `Thanks for applying, ${firstName(input.name)}\n\nWe've reviewed your application and it isn't the right fit for us right now. You're welcome to apply again in the future.`
      };
}

/** To a creator when their store first goes live. */
export function storeLiveEmail(input: { name: string; storeName: string; storeUrl: string; siteUrl: string }): Template {
  return {
    subject: `${input.storeName} is live`,
    html: layout({
      preheader: "Your store is live. Here's what to do next.",
      heading: `${input.storeName} is live!`,
      body: `Your store is up at <a href="${esc(input.storeUrl)}" style="color:#1c1722;font-weight:700;">${esc(input.storeUrl.replace(/^https?:\/\//, ""))}</a>.<br><br>Next up: add your products, then grab your share links from the Promote page so you can track which posts bring in sales.`,
      cta: { label: "Add your first product", url: `${input.siteUrl}/dashboard/products` }
    }),
    text: `${input.storeName} is live!\n\nYour store: ${input.storeUrl}\nAdd your first product: ${input.siteUrl}/dashboard/products`
  };
}
