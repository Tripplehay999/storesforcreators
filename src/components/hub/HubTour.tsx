"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "./Icon";

// Bump the version to show the tour again to everyone after big changes.
const STORAGE_KEY = "sfc-hub-tour-v1";
export const START_TOUR_EVENT = "sfc:tour";

type Step = { target?: string; title: string; body: string };

// Steps whose target isn't on screen (e.g. the balance card before a store exists) are skipped.
const STEPS: Step[] = [
  {
    title: "Welcome to your creator hub",
    body: "Here's a quick look around. It takes about a minute, and you can replay it any time from your account menu."
  },
  { target: "nav-overview", title: "Overview", body: "Your earnings, orders and sales at a glance, with how you're trending against the period before." },
  { target: "range", title: "Pick a date range", body: "Switch between the last 7 days, 30 days, 90 days or 12 months. Every number on the page follows along." },
  { target: "balance", title: "Your balance", body: "What you're owed right now, what's on its way, and everything paid out so far." },
  { target: "ideas", title: "Ideas for your store", body: "Get suggestions on pricing, products and promotion, based on how your store is actually doing." },
  { target: "nav-earnings", title: "Earnings", body: "Every order with your exact share, your payout history, and payout requests. Export everything as a spreadsheet." },
  { target: "nav-products", title: "Products", body: "Add products, set prices, upload the files buyers receive. Changes go live as soon as you save." },
  { target: "nav-analytics", title: "Analytics", body: "See how many people visit, where they come from, and which products turn visits into sales." },
  { target: "nav-promote", title: "Promote", body: "Share links for every platform, QR codes, ready-to-post captions and discount codes for your audience." },
  { target: "nav-store", title: "Storefront", body: "Your store's name, photo, colours and whether it's public." },
  { target: "account", title: "Your account", body: "Switch between light and dark mode, change your password, or take this tour again." }
];

function visibleTarget(step: Step) {
  if (!step.target) return null;
  const candidates = document.querySelectorAll<HTMLElement>(`[data-tour="${step.target}"]`);
  for (const element of candidates) {
    const box = element.getBoundingClientRect();
    if (box.width > 0 && box.height > 0) return element;
  }
  return null;
}

/** The nearest step from `from` (moving in `dir`) that can be shown right now. */
function nearestStep(from: number, dir: 1 | -1) {
  for (let index = from; index >= 0 && index < STEPS.length; index += dir) {
    if (!STEPS[index].target || visibleTarget(STEPS[index])) return index;
  }
  return null;
}

function remember() {
  try {
    localStorage.setItem(STORAGE_KEY, "done");
  } catch {
    // Private browsing: the tour may show again next time, which is fine.
  }
}

/** Spotlight tour of the hub. Starts on a creator's first visit to the overview; replay via START_TOUR_EVENT. */
export default function HubTour() {
  const pathname = usePathname();
  const [index, setIndex] = useState<number | null>(null);
  // Bumped on scroll/resize so the spotlight follows its target.
  const [, setLayoutTick] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    remember();
    setIndex(null);
  }, []);

  const go = useCallback((to: number, dir: 1 | -1) => {
    if (to < 0) return;
    const next = nearestStep(to, dir);
    if (next === null) {
      if (dir === 1) close();
      return;
    }
    setIndex(next);
  }, [close]);

  // First visit to the overview starts the tour automatically.
  useEffect(() => {
    if (pathname !== "/dashboard") return;
    let seen = false;
    try {
      seen = Boolean(localStorage.getItem(STORAGE_KEY));
    } catch {
      seen = true;
    }
    if (seen) return;
    const timer = setTimeout(() => setIndex(0), 700);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    const start = () => setIndex(0);
    window.addEventListener(START_TOUR_EVENT, start);
    return () => window.removeEventListener(START_TOUR_EVENT, start);
  }, []);

  // Bring the target into view, then follow it while the page scrolls or resizes.
  useEffect(() => {
    if (index === null) return;
    const target = visibleTarget(STEPS[index]);
    if (target) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
    }

    const follow = () => setLayoutTick(tick => tick + 1);
    window.addEventListener("resize", follow);
    window.addEventListener("scroll", follow, true);
    return () => {
      window.removeEventListener("resize", follow);
      window.removeEventListener("scroll", follow, true);
    };
  }, [index]);

  useEffect(() => {
    if (index === null) return;
    cardRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") go(index + 1, 1);
      if (event.key === "ArrowLeft") go(index - 1, -1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go, close]);

  if (index === null) return null;

  const step = STEPS[index];
  const box = visibleTarget(step)?.getBoundingClientRect() ?? null;
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const width = Math.min(340, viewport.width - 24);
  let style: React.CSSProperties;

  if (!box) {
    style = { width, left: "50%", top: "50%", transform: "translate(-50%, -50%)" };
  } else if (viewport.width >= 1024 && viewport.width - box.right > width + 32) {
    // Room to the right (sidebar items on desktop).
    style = { width, left: box.right + 18, top: Math.min(Math.max(box.top + box.height / 2 - 90, 12), viewport.height - 260) };
  } else {
    const left = Math.min(Math.max(box.left + box.width / 2 - width / 2, 12), viewport.width - width - 12);
    style = box.bottom + 260 < viewport.height
      ? { width, left, top: box.bottom + 14 }
      : { width, left, bottom: viewport.height - box.top + 14 };
  }

  const pad = 6;
  const last = nearestStep(index + 1, 1) === null;

  return (
    <div className="tour" role="presentation">
      {box ? (
        <div
          className="tour-spotlight"
          style={{ left: box.left - pad, top: box.top - pad, width: box.width + pad * 2, height: box.height + pad * 2 }}
        />
      ) : (
        <div className="tour-dim" />
      )}

      <div
        ref={cardRef}
        className="tour-card"
        style={style}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        tabIndex={-1}
      >
        <div className="tour-head">
          <span className="tour-count">Step {index + 1} of {STEPS.length}</span>
          <button type="button" className="tour-close" onClick={close} aria-label="Close tour">
            <Icon name="close" size={16} />
          </button>
        </div>
        <h2 id="tour-title">{step.title}</h2>
        <p id="tour-body">{step.body}</p>
        <div className="tour-progress" aria-hidden="true">
          {STEPS.map((item, dot) => <span key={item.title} className={dot <= index ? "on" : ""} />)}
        </div>
        <div className="tour-actions">
          {index === 0 ? (
            <button type="button" className="btn btn-ghost btn-sm" onClick={close}>Skip tour</button>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => go(index - 1, -1)}>Back</button>
          )}
          <button type="button" className="btn btn-primary btn-sm" onClick={() => go(index + 1, 1)}>
            {last ? "Finish" : index === 0 ? "Show me around" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
