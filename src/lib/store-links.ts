// Where a creator's store lives: storesforcreators.com/<slug>, like storesforcreators.com/jasmine.
// Old /store/<slug> links (already shared, printed on QR codes) redirect here; see next.config.ts.
// Safe to use from client components.

/** The store's path on the site, like "/jasmine". */
export function storePath(slug: string) {
  return `/${slug}`;
}

/** The store's full address, like "https://www.storesforcreators.com/jasmine". */
export function storeUrl(site: string, slug: string) {
  return `${site.replace(/\/$/, "")}${storePath(slug)}`;
}

/**
 * Store web addresses nobody can pick, because the site uses them for its own pages (or may soon).
 * Keep in sync with the stores_slug_not_reserved check in supabase/migrations/008_split_and_store_links.sql.
 */
export const RESERVED_SLUGS = [
  // Pages and folders the site has today
  "admin", "api", "auth", "dashboard", "download", "email-preferences", "fonts", "forgot-password",
  "login", "order", "privacy", "product", "reset-password", "signup", "store", "suspended", "templates", "terms",
  // Kept free for the business
  "about", "account", "apply", "blog", "careers", "cart", "checkout", "contact", "creators", "explore",
  "faq", "hello", "help", "home", "how-it-works", "jobs", "legal", "logout", "partners", "partnerships",
  "press", "pricing", "search", "settings", "shop", "sitemap", "stores", "support", "team", "www"
];

export function isReservedSlug(slug: string) {
  return RESERVED_SLUGS.includes(slug);
}
