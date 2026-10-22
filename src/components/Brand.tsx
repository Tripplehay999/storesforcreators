import Link from "next/link";

export default function Brand({ className = "", href = "/" }: { className?: string; href?: string }) {
  return (
    <Link className={`brand ${className}`.trim()} href={href}>
      <span className="brand-mark">BTG<span>✳</span></span>
      <span className="brand-copy">
        <strong>Browne&apos;s Talent Group</strong>
        <small>CREATOR COMMERCE &amp; TALENT</small>
      </span>
    </Link>
  );
}
