"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { STANDARD_CREATOR_SHARE } from "@/lib/format";
import Brand from "./Brand";

const LINKS = [
  { id: "process", href: "/#process", label: "How it works" },
  { id: "stores", href: "/#stores", label: "Stores" },
  { id: "calculator", href: "/#calculator", label: "Earnings" },
  { id: "faq", href: "/#faq", label: "FAQ" }
];

/** Site header: pill nav on desktop; on phones, Apply + a full-screen menu. */
export default function HeaderBar({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [section, setSection] = useState<string | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const accountHref = signedIn ? "/dashboard" : "/login";
  const accountLabel = signedIn ? "Creator hub" : "Log in";
  // Only the home page has the sections the nav points at.
  const current = pathname === "/" ? section : null;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Highlight the section in the middle of the screen.
  useEffect(() => {
    if (pathname !== "/") return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setSection(entry.target.id);
        else setSection(currentId => (currentId === entry.target.id ? null : currentId));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    LINKS.forEach(link => {
      const element = document.getElementById(link.id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [pathname]);

  // While the phone menu is open: lock page scroll, close on Escape or at desktop width.
  // Focus stays on the menu button, which is right before the menu in tab order.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    const onResize = () => {
      if (window.innerWidth > 900) setOpen(false);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <header className={`site-header${scrolled ? " is-scrolled" : ""}${open ? " is-open" : ""}`}>
        <div className="container nav-wrap">
          <Brand />

          <nav className="main-nav" aria-label="Main">
            {LINKS.map(link => (
              <Link
                key={link.id}
                href={link.href}
                className={current === link.id ? "active" : ""}
                aria-current={current === link.id ? "true" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="nav-actions">
            <Link className="login-link" href={accountHref}>{accountLabel}</Link>
            <button type="button" className="nav-apply" data-apply onClick={close}>
              Apply <span aria-hidden="true">→</span>
            </button>
            <button
              ref={toggleRef}
              type="button"
              className={`menu-toggle${open ? " is-open" : ""}`}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen(value => !value)}
            >
              <span className="menu-lines" aria-hidden="true"><i /><i /><i /></span>
            </button>
          </div>
        </div>
      </header>

      {/* Outside the header on purpose: the header's backdrop blur would trap a fixed panel inside it. */}
      <div id="mobile-menu" className={`mobile-menu${open ? " open" : ""}`} inert={!open} aria-hidden={!open}>
        <nav className="mobile-menu-links" aria-label="Menu">
          {LINKS.map((link, index) => (
            <Link
              key={link.id}
              href={link.href}
              onClick={close}
              className={current === link.id ? "active" : ""}
              style={{ "--i": index } as React.CSSProperties}
            >
              {link.label}
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </nav>

        <div className="mobile-menu-actions">
          <button type="button" className="mm-btn mm-btn-ink" data-apply onClick={close}>Apply to partner →</button>
          <Link className="mm-btn mm-btn-light" href={accountHref} onClick={close}>{accountLabel}</Link>
        </div>

        <p className="mobile-menu-note">
          <span className="mm-sticker" aria-hidden="true">$0</span>
          No setup fee. You keep {STANDARD_CREATOR_SHARE}% of every sale.
        </p>
      </div>
    </>
  );
}
