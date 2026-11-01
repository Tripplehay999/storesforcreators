import Link from "next/link";
import LogoMark from "./LogoMark";

export default function Brand({ className = "", href = "/" }: { className?: string; href?: string }) {
  return (
    <Link className={`brand ${className}`.trim()} href={href} aria-label="Stores for Creators home">
      <span className="brand-mark"><LogoMark size={42} /></span>
      <span className="brand-copy">
        <strong>Stores for Creators</strong>
      </span>
    </Link>
  );
}
