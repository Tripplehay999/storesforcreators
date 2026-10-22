import Link from "next/link";

/** Creator ⇄ Admin toggle, shown only to admin accounts. */
export default function ModeSwitch({ current }: { current: "creator" | "admin" }) {
  return (
    <div className="mode-switch" role="group" aria-label="Switch dashboard">
      <Link href="/dashboard" className={current === "creator" ? "active" : ""} aria-current={current === "creator" ? "page" : undefined}>
        Creator
      </Link>
      <Link href="/admin" className={current === "admin" ? "active" : ""} aria-current={current === "admin" ? "page" : undefined}>
        Admin
      </Link>
    </div>
  );
}
