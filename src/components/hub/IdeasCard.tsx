"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { generateIdeas } from "@/app/dashboard/ai-actions";
import type { Recommendations } from "@/lib/ai";
import Icon from "./Icon";

const PAGES: Record<string, { href: string; label: string }> = {
  products: { href: "/dashboard/products", label: "Open Products" },
  storefront: { href: "/dashboard/store", label: "Open Storefront" },
  promote: { href: "/dashboard/promote", label: "Open Promote" },
  analytics: { href: "/dashboard/analytics", label: "Open Analytics" },
  earnings: { href: "/dashboard/earnings", label: "Open Earnings" }
};

const CATEGORY_LABELS: Record<string, string> = {
  pricing: "Pricing",
  products: "Products",
  promotion: "Promotion",
  storefront: "Storefront",
  conversion: "Conversion"
};

function updatedLabel(value: string) {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return "Updated just now";
  if (minutes < 60) return `Updated ${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Updated ${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `Updated ${days} day${days === 1 ? "" : "s"} ago`;
}

type Props = {
  /** Only set when an admin is viewing someone else's store. */
  viewingStore?: string;
  initial: { payload: Recommendations; createdAt: string } | null;
};

export default function IdeasCard({ viewingStore, initial }: Props) {
  const [ideas, setIdeas] = useState(initial);
  const [focus, setFocus] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const query = viewingStore ? `?store=${encodeURIComponent(viewingStore)}` : "";

  function run() {
    setError("");
    startTransition(async () => {
      const result = await generateIdeas(viewingStore, focus);
      if (result.ok) {
        setIdeas({ payload: result.payload, createdAt: result.createdAt });
        setFocus("");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <section className="card ideas" data-tour="ideas" aria-busy={pending}>
      <div className="card-head">
        <h2 className="ideas-title"><Icon name="sparkles" size={18} /> Ideas for your store</h2>
        {ideas && !pending && <span className="muted">{updatedLabel(ideas.createdAt)}</span>}
      </div>

      {pending ? (
        <div className="ideas-loading" role="status">
          <span className="ideas-pulse" aria-hidden="true" />
          <div>
            <strong>Looking through your numbers…</strong>
            <p>Sales, visits, prices and products. This takes about 30 seconds.</p>
          </div>
        </div>
      ) : ideas ? (
        <>
          <p className="ideas-headline">{ideas.payload.headline}</p>
          <ol className="ideas-list">
            {ideas.payload.recommendations.map(item => {
              const page = PAGES[item.page];
              return (
                <li key={item.title}>
                  <div className="ideas-tags">
                    <span className="badge badge-muted">{CATEGORY_LABELS[item.category] ?? item.category}</span>
                    {item.impact === "high" && <span className="badge badge-pos">High impact</span>}
                  </div>
                  <strong>{item.title}</strong>
                  <p>{item.why}</p>
                  <p className="ideas-action"><span>Do this:</span> {item.action}</p>
                  {page && <Link className="link" href={`${page.href}${query}`}>{page.label}</Link>}
                </li>
              );
            })}
          </ol>
        </>
      ) : (
        <p className="ideas-empty">
          Get 3 to 5 suggestions based on your own sales, visits and products: what to price differently,
          what to add, and where to promote.
        </p>
      )}

      {error && <p className="form-error" role="alert">{error}</p>}

      <form
        className="ideas-ask"
        onSubmit={event => {
          event.preventDefault();
          run();
        }}
      >
        <input
          className="ideas-input"
          value={focus}
          onChange={event => setFocus(event.target.value)}
          placeholder="Ask about something specific (optional)"
          maxLength={300}
          aria-label="What would you like ideas about?"
          disabled={pending}
        />
        <button className="btn btn-primary" type="submit" disabled={pending}>
          <Icon name={ideas ? "refresh" : "sparkles"} size={15} />
          {ideas ? "New ideas" : "Get ideas"}
        </button>
      </form>
    </section>
  );
}
