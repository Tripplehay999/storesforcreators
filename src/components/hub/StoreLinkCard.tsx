"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "@/lib/ui";
import Icon from "./Icon";

type Props = {
  url: string;
  storeName: string;
  image: string;
  background: string;
  published: boolean;
  checkout: "off" | "testing" | "on";
};

const noSubscribe = () => () => {};

/** Older browsers and plain-http pages don't have the Clipboard API; fall back to a hidden text box. */
function copyWithFallback(text: string) {
  const box = document.createElement("textarea");
  box.value = text;
  box.setAttribute("readonly", "");
  box.style.position = "fixed";
  box.style.opacity = "0";
  document.body.appendChild(box);
  box.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  box.remove();
  return ok;
}

const CHECKOUT_TEXT = {
  on: { tone: "pos", text: "Buying is on: visitors can pay and get their products straight away." },
  testing: { tone: "warn", text: "Buying is being tested: only you and our team can see the Buy buttons for now." },
  off: { tone: "muted", text: "Buying isn't switched on for your store yet. Visitors can browse and see your prices." }
} as const;

/** The store's public link, with one-tap copy and share. Top of the Storefront page. */
export default function StoreLinkCard({ url, storeName, image, background, published, checkout }: Props) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Phones have a native share sheet (WhatsApp, Instagram, Messages…); most computers don't.
  const canShare = useSyncExternalStore(noSubscribe, () => typeof navigator.share === "function", () => false);
  const display = url.replace(/^https?:\/\//, "");
  const status = CHECKOUT_TEXT[checkout];

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(url);
      ok = true;
    } catch {
      ok = copyWithFallback(url);
    }

    if (!ok) {
      toast("Couldn't copy automatically. Press and hold the link to copy it.");
      return;
    }

    setCopied(true);
    toast("Link copied. Paste it in your bio or a post.");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2500);
  }

  async function share() {
    try {
      await navigator.share({ title: storeName, text: `Shop ${storeName}`, url });
    } catch {
      // Closing the share sheet counts as an error; nothing to do.
    }
  }

  return (
    <section className="card store-link" aria-labelledby="store-link-title">
      <div className="store-link-top">
        <span className="store-link-thumb" style={{ background }} aria-hidden="true">
          {image ? <img src={image} alt="" /> : storeName.charAt(0)}
        </span>
        <div className="store-link-intro">
          <h2 id="store-link-title">Your store link</h2>
          <p>Share it wherever your followers are: your Instagram or TikTok bio, YouTube descriptions, WhatsApp.</p>
        </div>
        <span className={`badge ${published ? "badge-pos" : "badge-warn"}`}>{published ? "Live" : "Hidden"}</span>
      </div>

      <div className="store-link-box">
        <Icon name="link" size={18} />
        <span className="store-link-url">{display}</span>
        <button
          className={`btn btn-primary store-link-copy${copied ? " is-copied" : ""}`}
          type="button"
          onClick={copy}
        >
          <Icon name={copied ? "check" : "copy"} size={16} /> {copied ? "Copied!" : "Copy link"}
        </button>
      </div>

      <div className="store-link-actions">
        {canShare && (
          <button className="btn btn-secondary" type="button" onClick={share}>
            <Icon name="share" size={16} /> Share
          </button>
        )}
        <a className="btn btn-secondary" href={url} target="_blank" rel="noreferrer">
          <Icon name="external" size={16} /> Open my store
        </a>
        <Link className="btn btn-ghost" href="/dashboard/promote">
          <Icon name="qr" size={16} /> QR code &amp; more ways to share
        </Link>
      </div>

      {!published && (
        <p className="store-link-note is-warn">
          <Icon name="alert" size={16} /> Your store is hidden, so this link won&apos;t open for visitors yet. Turn on
          &ldquo;Store is public&rdquo; below and save.
        </p>
      )}
      <p className={`store-link-note is-${status.tone}`}>
        <Icon name={checkout === "on" ? "check" : "receipt"} size={16} /> {status.text}
      </p>
    </section>
  );
}
