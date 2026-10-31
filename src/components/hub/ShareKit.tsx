"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { toast } from "@/lib/ui";
import Icon from "./Icon";

const PLATFORMS = [
  { id: "tiktok", label: "TikTok" },
  { id: "instagram", label: "Instagram" },
  { id: "youtube", label: "YouTube" },
  { id: "x", label: "X" },
  { id: "email", label: "Email" },
  { id: "bio", label: "Link in bio" }
];

type Props = {
  siteUrl: string;
  storeSlug: string;
  storeName: string;
  products: { id: string; name: string }[];
};

/** Tracked share links per platform (they power Analytics), with copy and QR download. */
export default function ShareKit({ siteUrl, storeSlug, storeName, products }: Props) {
  const [target, setTarget] = useState("");
  const [platform, setPlatform] = useState("tiktok");
  const [qr, setQr] = useState("");

  const path = target ? `/product/${encodeURIComponent(target)}?creator=${encodeURIComponent(storeSlug)}&src=${platform}` : `/store/${storeSlug}?src=${platform}`;
  const url = `${siteUrl}${path}`;
  const label = target ? products.find(product => product.id === target)?.name ?? "Product" : storeName;

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, { width: 480, margin: 2, color: { dark: "#1c1722", light: "#ffffff" } })
      .then(data => { if (!cancelled) setQr(data); })
      .catch(() => { if (!cancelled) setQr(""); });
    return () => { cancelled = true; };
  }, [url]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied.");
    } catch {
      toast("Couldn't copy. Select the link and copy it instead.");
    }
  }

  return (
    <section className="card share-kit">
      <div className="card-head">
        <h2>Share links</h2>
        <span className="muted">Each platform gets its own link, so Analytics can tell you which posts work.</span>
      </div>

      <div className="form-section">
        <label className="field">
          What to share
          <select value={target} onChange={event => setTarget(event.target.value)}>
            <option value="">Your whole store</option>
            {products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}
          </select>
        </label>

        <div className="field">
          Where you&apos;re posting
          <div className="chip-row" role="radiogroup" aria-label="Platform">
            {PLATFORMS.map(item => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={platform === item.id}
                className={`chip${platform === item.id ? " active" : ""}`}
                onClick={() => setPlatform(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="share-result">
        <div className="share-link">
          <span className="field-hint">Link for {label}</span>
          <div className="share-url">
            <input value={url} readOnly aria-label="Share link" onFocus={event => event.target.select()} />
            <button type="button" className="btn btn-primary" onClick={copy}>
              <Icon name="copy" size={15} /> Copy
            </button>
          </div>
        </div>

        {qr && (
          <div className="share-qr">
            <img src={qr} alt={`QR code for ${label}`} width={160} height={160} />
            <a className="btn btn-secondary btn-sm" href={qr} download={`${storeSlug}${target ? `-${target}` : ""}-${platform}-qr.png`}>
              <Icon name="download" size={14} /> Download QR
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
