"use client";

import Link from "next/link";
import { useState } from "react";

const links = [
  ["/#process", "How it works"],
  ["/#examples", "Examples"],
  ["/#calculator", "Earnings"],
  ["/#faq", "FAQ"]
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
          {signedIn ? "Creator hub" : "Log in"}
        </Link>
        <button className="btn btn-dark nav-apply" data-apply>Apply</button>
        <button
          className="menu-toggle"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen(value => !value)}
        >
          <span aria-hidden="true">{open ? "✕" : "☰"}</span>
        </button>
      </div>
    </>
  );
}
