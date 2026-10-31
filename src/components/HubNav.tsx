"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import Icon, { type IconName } from "./hub/Icon";

const LINKS: { href: string; label: string; short: string; icon: IconName; tour: string; inTabs: boolean; keepsStore: boolean }[] = [
  { href: "/dashboard", label: "Overview", short: "Home", icon: "overview", tour: "nav-overview", inTabs: true, keepsStore: true },
  { href: "/dashboard/earnings", label: "Earnings", short: "Earnings", icon: "wallet", tour: "nav-earnings", inTabs: true, keepsStore: true },
  { href: "/dashboard/products", label: "Products", short: "Products", icon: "box", tour: "nav-products", inTabs: true, keepsStore: true },
  { href: "/dashboard/analytics", label: "Analytics", short: "Stats", icon: "chart", tour: "nav-analytics", inTabs: true, keepsStore: true },
  { href: "/dashboard/promote", label: "Promote", short: "Promote", icon: "megaphone", tour: "nav-promote", inTabs: true, keepsStore: true },
  { href: "/dashboard/store", label: "Storefront", short: "Store", icon: "store", tour: "nav-store", inTabs: false, keepsStore: false }
];

/** Hub navigation: the sidebar list on desktop, the bottom tab bar on phones (Storefront lives in the account menu there). */
export default function HubNav({ variant }: { variant: "sidebar" | "tabs" }) {
  const pathname = usePathname();
  // Admins viewing a creator's hub keep ?store= as they move between pages.
  const viewing = useSearchParams().get("store");
  const links = variant === "tabs" ? LINKS.filter(link => link.inTabs) : LINKS;

  return (
    <nav className={variant === "sidebar" ? "app-nav" : "app-tabbar"} aria-label="Creator hub">
      {links.map(link => {
        const active = pathname === link.href;
        const href = viewing && link.keepsStore ? `${link.href}?store=${encodeURIComponent(viewing)}` : link.href;

        return (
          <Link
            key={link.href}
            href={href}
            className={active ? "active" : ""}
            aria-current={active ? "page" : undefined}
            data-tour={link.tour}
          >
            <Icon name={link.icon} size={variant === "sidebar" ? 18 : 22} />
            <span>{variant === "sidebar" ? link.label : link.short}</span>
          </Link>
        );
      })}
    </nav>
  );
}
