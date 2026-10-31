"use client";

import { useState, useTransition } from "react";
import { generateCaptions } from "@/app/dashboard/ai-actions";
import type { Captions } from "@/lib/ai";
import { toast } from "@/lib/ui";
import Icon from "./Icon";

const PLATFORMS = [
  { id: "tiktok", label: "TikTok" },
  { id: "instagram", label: "Instagram" },
  { id: "x", label: "X" },
  { id: "youtube", label: "YouTube" },
  { id: "email", label: "Email" }
];

const LABELS: Record<string, string> = Object.fromEntries(PLATFORMS.map(platform => [platform.id, platform.label]));

type Props = {
  products: { id: string; name: string }[];
  codes: string[];
};

/** AI-written, ready-to-post captions for a product. */
export default function CaptionWriter({ products, codes }: Props) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [platforms, setPlatforms] = useState<string[]>(["tiktok", "instagram"]);
  const [code, setCode] = useState("");
  const [captions, setCaptions] = useState<Captions["captions"]>([]);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const toggle = (id: string) =>
    setPlatforms(current => (current.includes(id) ? current.filter(item => item !== id) : [...current, id]));

  function write() {
    setError("");
    startTransition(async () => {
      const result = await generateCaptions(productId, platforms, code);
      if (result.ok) setCaptions(result.payload.captions);
      else setError(result.error);
    });
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast("Caption copied.");
    } catch {
      toast("Couldn't copy. Select the text and copy it instead.");
    }
  }

  if (products.length === 0) {
    return (
      <section className="card">
        <div className="card-head"><h2 className="ideas-title"><Icon name="sparkles" size={18} /> Caption writer</h2></div>
        <p className="muted">Add a product first, then come back for ready-to-post captions.</p>
      </section>
    );
  }

  return (
    <section className="card" aria-busy={pending}>
      <div className="card-head">
        <h2 className="ideas-title"><Icon name="sparkles" size={18} /> Caption writer</h2>
        <span className="muted">Ready-to-post captions in your voice</span>
      </div>

      <div className="form-section">
        <label className="field">
          Product
          <select value={productId} onChange={event => setProductId(event.target.value)}>
            {products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}
          </select>
        </label>

        <label className="field">
          Mention a discount code <span className="field-hint">Optional</span>
          <select value={code} onChange={event => setCode(event.target.value)}>
            <option value="">No code</option>
            {codes.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>

        <div className="field full">
          Platforms
          <div className="chip-row">
            {PLATFORMS.map(platform => (
              <button
                key={platform.id}
                type="button"
                aria-pressed={platforms.includes(platform.id)}
                className={`chip${platforms.includes(platform.id) ? " active" : ""}`}
                onClick={() => toggle(platform.id)}
              >
                {platform.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button className="btn btn-primary" type="button" onClick={write} disabled={pending || platforms.length === 0}>
          <Icon name="sparkles" size={15} /> {pending ? "Writing…" : captions.length ? "Write new captions" : "Write captions"}
        </button>
        {pending && <span className="muted">This takes about 20 seconds.</span>}
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>

      {captions.length > 0 && (
        <ul className="captions">
          {captions.map((item, index) => {
            const full = item.hashtags.length ? `${item.caption}\n\n${item.hashtags.map(tag => `#${tag.replace(/^#/, "")}`).join(" ")}` : item.caption;
            return (
              <li key={`${item.platform}-${index}`}>
                <div className="captions-head">
                  <span className="badge badge-muted">{LABELS[item.platform] ?? item.platform}</span>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => copy(full)}>
                    <Icon name="copy" size={14} /> Copy
                  </button>
                </div>
                <p className="captions-text">{full}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
