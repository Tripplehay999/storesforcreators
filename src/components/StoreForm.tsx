"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, type CSSProperties } from "react";
import { saveStore } from "@/app/dashboard/actions";
import Icon from "@/components/hub/Icon";
import { slugify } from "@/lib/catalog";
import { MAIL_DOMAIN } from "@/lib/contact";
import { isReservedSlug, storePath } from "@/lib/store-links";
import type { Store } from "@/lib/types";
import { toast } from "@/lib/ui";
import { uploadImage } from "@/lib/upload";

// Keys match the form field names read by the saveStore action.
type Values = {
  slug: string;
  name: string;
  short: string;
  category: string;
  description: string;
  headline: string;
  headline_em: string;
  bio: string;
  image: string;
  label: string;
  background: string;
  featured_product_id: string;
  published: boolean;
};

/** What the preview needs to draw a product card. */
export type PreviewProduct = { id: string; name: string; price: string; image: string; theme: string };

/** Soft backgrounds that keep dark text easy to read. */
const SWATCHES = [
  { name: "Blush", value: "#f6eaf1" },
  { name: "Lilac", value: "#ece4f7" },
  { name: "Sky", value: "#e1edf9" },
  { name: "Mint", value: "#e0f3e8" },
  { name: "Lime", value: "#eef8cf" },
  { name: "Butter", value: "#fbf1cf" },
  { name: "Peach", value: "#fde3d5" },
  { name: "Sand", value: "#f1e9dd" },
  { name: "Cloud", value: "#f1f1ee" }
];

function initialValues(store: Store | null): Values {
  return {
    slug: store?.slug ?? "",
    name: store?.name ?? "",
    short: store?.short ?? "",
    category: store?.category ?? "",
    description: store?.description ?? "",
    headline: store?.headline ?? "Your brand.",
    headline_em: store?.headlineEm ?? "Your world.",
    bio: store?.bio ?? "",
    image: store?.image ?? "",
    label: store?.label ?? "",
    background: store?.background ?? "#f6eaf1",
    featured_product_id: store?.featuredProductId ?? "",
    published: store?.published ?? true
  };
}

function Step({ number, title, children }: { number: number; title: string; children?: React.ReactNode }) {
  return (
    <div className="form-section-head step-head">
      <span className="step-num" aria-hidden="true">{number}</span>
      <div>
        <h2>{title}</h2>
        {children && <p>{children}</p>}
      </div>
    </div>
  );
}

type Props = { store: Store | null; userId: string; products?: PreviewProduct[] };

export default function StoreForm({ store, userId, products = [] }: Props) {
  const [state, action, pending] = useActionState(saveStore, {});
  const [values, setValues] = useState(() => initialValues(store));
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (state.message) toast(state.message);
  }, [state]);

  const set = <K extends keyof Values>(name: K, value: Values[K]) =>
    setValues(current => ({ ...current, [name]: value }));

  const field = (name: Exclude<keyof Values, "published">) => ({
    name,
    value: values[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      set(name, event.target.value)
  });

  async function onUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      set("image", await uploadImage(file, userId));
      toast("Photo uploaded. Save to keep it.");
    } catch (error) {
      toast((error as Error).message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  // The preview shows the featured product first, like the real store page.
  const featured = products.find(product => product.id === values.featured_product_id);
  const previewProducts = (featured ? [featured, ...products.filter(product => product !== featured)] : products).slice(0, 2);
  const customColour = !SWATCHES.some(swatch => swatch.value === values.background.toLowerCase());
  const showFeatured = Boolean(store) && products.length > 0;

  return (
    <div className="settings">
      <form className="card store-form" action={action}>
        <div className="form-section">
          <Step number={1} title="Your store">The name and web address people use to find you.</Step>

          <label className="field full">
            Store web address
            {store ? (
              <div className="input-prefix">
                <span>{MAIL_DOMAIN}/</span>
                <input value={store.slug} disabled />
              </div>
            ) : (
              <>
                <div className="input-prefix">
                  <span>{MAIL_DOMAIN}/</span>
                  <input
                    {...field("slug")}
                    required
                    minLength={2}
                    maxLength={40}
                    placeholder="your-name"
                    autoCapitalize="none"
                    onChange={event => set("slug", slugify(event.target.value, 40))}
                  />
                </div>
                {isReservedSlug(values.slug) ? (
                  <span className="field-hint" role="alert">&quot;{values.slug}&quot; is one of our own pages, so it can&apos;t be a store address. Try your name or handle.</span>
                ) : (
                  <span className="field-hint">Your store will be at {MAIL_DOMAIN}/{values.slug || "your-name"}. Letters, numbers and dashes only, like your social handle. This can&apos;t be changed later.</span>
                )}
              </>
            )}
          </label>

          <label className="field full">
            Store name
            <input {...field("name")} required placeholder="Jasmine's Financials" />
          </label>

          <label className="field">
            What you&apos;re about
            <input {...field("category")} placeholder="Money tips" />
            <span className="field-hint">A few words, like Fitness or Recipes.</span>
          </label>

          <label className="field">
            One-line description
            <input {...field("description")} placeholder="Simple money plans for busy people" />
            <span className="field-hint">Shows up when your link is shared on WhatsApp, X and others.</span>
          </label>
        </div>

        <div className="form-section">
          <Step number={2} title="Top of your store page">The first thing visitors see. Watch the preview change as you type.</Step>

          <label className="field">
            Big headline
            <input {...field("headline")} placeholder="Your brand." />
          </label>

          <label className="field">
            Second line
            <input {...field("headline_em")} placeholder="Your world." />
            <span className="field-hint">Shown in a fancy font under the headline.</span>
          </label>

          <label className="field full">
            About you
            <textarea {...field("bio")} rows={3} placeholder="A couple of sentences about you and who your products are for." />
          </label>

          <div className="field full">
            Your photo
            <div className="media-field">
              <span className="media-thumb">
                {values.image ? <img src={values.image} alt="" /> : <Icon name="image" size={22} />}
              </span>
              <div>
                <label className="btn btn-secondary btn-sm">
                  <Icon name="upload" size={14} /> {uploading ? "Uploading…" : values.image ? "Change photo" : "Upload a photo"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={onUpload}
                    disabled={uploading}
                    hidden
                  />
                </label>
                <span className="field-hint">A clear photo of you works best. PNG, JPG or WebP, under 2 MB.</span>
              </div>
            </div>
          </div>

          <details className="full more-options">
            <summary>More photo options</summary>
            <div className="more-options-body">
              <label className="field">
                Name sticker on photo
                <input {...field("short")} placeholder="jasmine's financials." />
                <span className="field-hint">Optional. A little sticker on your photo.</span>
              </label>

              <label className="field">
                Tag on photo
                <input {...field("label")} placeholder="Money tips" />
                <span className="field-hint">Optional. A small label in the corner.</span>
              </label>

              <label className="field full">
                Or paste a link to a photo
                <input {...field("image")} placeholder="https://…" inputMode="url" />
              </label>
            </div>
          </details>
        </div>

        {showFeatured && (
          <div className="form-section">
            <Step number={3} title="Featured product">Show one product big at the top of your store, with its Buy button.</Step>

            <label className="field full">
              Product to feature
              <select {...field("featured_product_id")}>
                <option value="">None, just show all my products</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>{product.name} ({product.price})</option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div className="form-section">
          <Step number={showFeatured ? 4 : 3} title="Colour & visibility" />

          <div className="field full">
            <span id="colour-label">Background colour</span>
            <div className="swatches" role="radiogroup" aria-labelledby="colour-label">
              {SWATCHES.map(swatch => {
                const active = values.background.toLowerCase() === swatch.value;
                return (
                  <button
                    key={swatch.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={swatch.name}
                    title={swatch.name}
                    className={`swatch${active ? " active" : ""}`}
                    style={{ background: swatch.value }}
                    onClick={() => set("background", swatch.value)}
                  >
                    {active && <Icon name="check" size={16} />}
                  </button>
                );
              })}
              <label className={`swatch swatch-custom${customColour ? " active" : ""}`} title="Pick any colour">
                <input {...field("background")} type="color" aria-label="Pick any colour" />
                <span className="sr-only">Pick any colour</span>
              </label>
            </div>
            <span className="field-hint">Tap a colour, or the last circle to pick your own.</span>
          </div>

          <label className="toggle full">
            <span>
              <strong>Store is public</strong>
              <small>{values.published ? "Anyone with your link can visit and buy." : "Hidden: only you can see it."}</small>
            </span>
            <input
              name="published"
              type="checkbox"
              checked={values.published}
              onChange={event => set("published", event.target.checked)}
            />
            <span className="switch" aria-hidden="true" />
          </label>
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={pending || uploading}>
            {pending ? "Saving…" : store ? "Save changes" : "Create my store"}
          </button>
          {store && <Link className="btn btn-ghost" href="/dashboard/products">Manage products</Link>}
          {state.error && <p className="form-error" role="alert">{state.error}</p>}
        </div>
      </form>

      <aside className="card settings-preview" aria-label="Store preview">
        <div className="card-head">
          <h2>Live preview</h2>
          {store && (
            <a className="link" href={storePath(store.slug)} target="_blank" rel="noreferrer">Open store</a>
          )}
        </div>

        <div className="mini-store" style={{ "--store-bg": values.background } as CSSProperties}>
          <div className="mini-store-bar">
            <span className="mini-store-avatar">
              {values.image ? <img src={values.image} alt="" /> : (values.name || "Y").charAt(0)}
            </span>
            <strong>{values.name || "Your store"}</strong>
            <span className="mini-store-shop">Shop</span>
          </div>

          <div className="mini-store-hero">
            <div className="mini-store-copy">
              {values.category && <small>{values.category}</small>}
              <h3>
                {values.headline || "Your headline"}
                {values.headline_em && <em>{values.headline_em}</em>}
              </h3>
              <p>{values.bio || "Your bio appears here."}</p>
              <span className="mini-store-cta">Shop now</span>
            </div>
            <div className="mini-store-photo">
              {values.image ? <img src={values.image} alt="" /> : <Icon name="image" size={24} />}
              {values.label && <span className="mini-store-tag">{values.label}</span>}
              {values.short && <span className="mini-store-name">{values.short}</span>}
            </div>
          </div>

          <div className="mini-store-shopgrid">
            {previewProducts.length > 0 ? previewProducts.map(product => (
              <div className="mini-product" key={product.id}>
                <span className="mini-product-image" style={{ background: product.theme }}>
                  <img src={product.image} alt="" />
                </span>
                <strong>{product.name}</strong>
                <span className="mini-product-foot">
                  <span>{product.price}</span>
                  <span className="mini-product-buy">Buy</span>
                </span>
              </div>
            )) : (
              <p className="mini-store-empty">Your products show here.</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
