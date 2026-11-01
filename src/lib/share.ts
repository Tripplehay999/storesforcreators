// Link previews (WhatsApp, iMessage, X, Facebook…) for store and product pages.
// A page that sets its own preview replaces the site-wide one, so it falls back to the site card itself.

/** The site's own preview card (src/app/opengraph-image.png). */
export const SITE_SHARE_IMAGE = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  alt: "Stores for Creators: You post. We sell. You get paid."
};

export const SITE_TWITTER_IMAGE = "/twitter-image.png";

/** An image that link previews can load: a full https address or a path on this site. Uploaded data images can't be used. */
export function shareableImage(src: string) {
  return src.startsWith("https://") || (src.startsWith("/") && !src.startsWith("//")) ? src : null;
}
