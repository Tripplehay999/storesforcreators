"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function HubNav({ storeSlug }: { storeSlug: string | null }) {
  const pathname = usePathname();

  const links = [
    ["/dashboard", "Overview"],
    ["/dashboard/store", "My store"],
    ["/dashboard/products", "Products"]
  ];

  return (
    <nav className="dash-tabs hub-nav" aria-label="Creator hub">
      {links.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          className={pathname === href ? "active" : ""}
          aria-current={pathname === href ? "page" : undefined}
        >
          {label}
        </Link>
      ))}
      {storeSlug && <Link href={`/store/${storeSlug}`} target="_blank">View store ↗</Link>}
    </nav>
  );
}
