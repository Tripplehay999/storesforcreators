"use client";

import Link from "next/link";
import { useState } from "react";

const links = [
  ["/#services", "What we do"],
  ["/#process", "How it works"],
  ["/#stores", "Creator stores"],
  ["/#calculator", "Your potential"],
  ["/#faq", "FAQs"]
];

export default function MainNav({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className={`main-nav${open ? " open" : ""}`} id="main-nav">
        {links.map(([href, label]) => (
          <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>
        ))}
      </nav>

      <div className="nav-actions">
        <Link className="login-link" href={signedIn ? "/dashboard" : "/login"}>
          {signedIn ? "Creator hub" : "Creator login"}
        </Link>
        <button className="btn btn-dark nav-apply" data-apply>Become a partner ↗</button>
        <button
          className="menu-toggle"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen(value => !value)}
        >
          ☰
        </button>
      </div>
    </>
  );
}
