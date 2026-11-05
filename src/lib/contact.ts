// The public email addresses for the business. Change them here and the site footer, legal pages,
// emails and the admin Emails page all update. Mail to these addresses is forwarded to your own inbox
// by Cloudflare Email Routing (see "Set up your email addresses" in the README).

export const MAIL_DOMAIN = "storesforcreators.com";

export const CONTACT = {
  /** Help with an account, store, order or download. Also on the Privacy Policy and Terms. */
  support: `support@${MAIL_DOMAIN}`,
  /** Brand deals, collaborations and creator partnerships. */
  partnerships: `partnerships@${MAIL_DOMAIN}`,
  /** General hellos, and the address the app's emails come from. */
  hello: `hello@${MAIL_DOMAIN}`
};

/**
 * The live site. Pictures in an email have to come from a public web address, so emails and email
 * signatures always load the logo from here (even a test sent from your computer, where the site
 * itself runs on localhost and nobody else can reach it).
 */
export const PUBLIC_SITE = `https://www.${MAIL_DOMAIN}`;

/** The logo as picture files (generated from src/app/icon.svg; see LogoMark.tsx). */
export const LOGO = {
  /** Rounded tile with see-through corners: email headers and signatures. */
  tile: `${PUBLIC_SITE}/icon-192.png`,
  /** Full square with extra margin, safe to crop into a circle: profile photos. */
  square: `${PUBLIC_SITE}/icon-maskable-512.png`
};

/** The addresses, with what each one is for, in the order they're shown. */
export const CONTACT_LIST = [
  { address: CONTACT.support, purpose: "Help with an account, store, order or download" },
  { address: CONTACT.partnerships, purpose: "Brand deals, collaborations and creator partnerships" },
  { address: CONTACT.hello, purpose: "General questions; the app's emails are sent from here" }
];
