"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items: { href: string; label: string; icon: string; badge?: "applications" | "payouts" }[] = [
  { href: "/admin", label: "Overview", icon: "◧" },
  { href: "/admin/users", label: "Users", icon: "◉" },
  { href: "/admin/stores", label: "Stores", icon: "▣" },
  { href: "/admin/products", label: "Products", icon: "▦" },
  { href: "/admin/orders", label: "Orders", icon: "≡" },
  { href: "/admin/payouts", label: "Payouts", icon: "$", badge: "payouts" },
  { href: "/admin/applications", label: "Applications", icon: "✉", badge: "applications" }
];

export default function AdminNav({ badges }: { badges: { applications: number; payouts: number } }) {
  const pathname = usePathname();

  return (
    <nav className="adm-nav" aria-label="Admin">
      {items.map(item => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        const badge = item.badge ? badges[item.badge] : 0;

        return (
          <Link key={item.href} href={item.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
            <span className="adm-nav-icon" aria-hidden="true">{item.icon}</span>
            {item.label}
            {badge > 0 && <span className="adm-badge">{badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
