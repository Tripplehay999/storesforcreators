import Link from "next/link";

export default function Brand({ className = "", href = "/" }: { className?: string; href?: string }) {
  return (
    <Link className={`brand ${className}`.trim()} href={href}>
      <span className="brand-mark">SFC</span>
      <span className="brand-copy">
        <strong>Stores for Creators</strong>
      </span>
    </Link>
  );
}
