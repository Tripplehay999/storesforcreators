"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import Icon, { type IconName } from "./hub/Icon";

const LINKS: { href: string; label: string; short: string; icon: IconName; keepsStore: boolean }[] = [
  { href: "/dashboard", label: "Overview", short: "Home", icon: "overview", keepsStore: true },
  { href: "/dashboard/earnings", label: "Earnings", short: "Earnings", icon: "wallet", keepsStore: true },
  { href: "/dashboard/products", label: "Products", short: "Products", icon: "box", keepsStore: true },
  { href: "/dashboard/store", label: "Storefront", short: "Store", icon: "store", keepsStore: false }
];

/** Hub navigation: the sidebar list on desktop, the bottom tab bar on phones. */
export default function HubNav({ variant }: { variant: "sidebar" | "tabs" }) {
  const pathname = usePathname();
  // Admins viewing a creator's hub keep ?store= as they move between pages.
  const viewing = useSearchParams().get("store");

  return (
    <nav className={variant === "sidebar" ? "app-nav" : "app-tabbar"} aria-label="Creator hub">
      {LINKS.map(link => {
        const active = pathname === link.href;
        const href = viewing && link.keepsStore ? `${link.href}?store=${encodeURIComponent(viewing)}` : link.href;

        return (
          <Link key={link.href} href={href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
            <Icon name={link.icon} size={variant === "sidebar" ? 18 : 22} />
            <span>{variant === "sidebar" ? link.label : link.short}</span>
          </Link>
        );
      })}
    </nav>
  );
}
