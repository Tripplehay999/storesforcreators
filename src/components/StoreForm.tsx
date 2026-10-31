"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, type CSSProperties } from "react";
import { saveStore } from "@/app/dashboard/actions";
import Icon from "@/components/hub/Icon";
import { slugify } from "@/lib/catalog";
import { toast } from "@/lib/ui";
import { uploadImage } from "@/lib/upload";
import type { Store } from "@/lib/types";

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
  published: boolean;
};

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
    published: store?.published ?? true
  };
}

export default function StoreForm({ store, userId }: { store: Store | null; userId: string }) {
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
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(name, event.target.value)
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

  return (
    <div className="settings">
      <form className="card" action={action}>
        <div className="form-section">
          <div className="form-section-head">
            <h2>Store details</h2>
            <p>How your store is named and found.</p>
          </div>

          <label className="field full">
            Store address
            {store ? (
              <div className="input-prefix">
                <span>/store/</span>
                <input value={store.slug} disabled />
              </div>
            ) : (
              <>
                <div className="input-prefix">
                  <span>/store/</span>
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
                <span className="field-hint">Letters, numbers and dashes. This can&apos;t be changed later.</span>
              </>
            )}
          </label>

          <label className="field full">
            Store name
            <input {...field("name")} required placeholder="Jasmine's Financials" />
          </label>

          <label className="field">
            Category
            <input {...field("category")} placeholder="Finance / Money tips" />
          </label>

          <label className="field">
            One-line description
            <input {...field("description")} placeholder="What you offer, in a sentence" />
          </label>
        </div>

        <div className="form-section">
          <div className="form-section-head">
            <h2>Storefront header</h2>
            <p>The first thing visitors see on your store page.</p>
          </div>

          <label className="field">
            Headline
            <input {...field("headline")} />
          </label>

          <label className="field">
            Second line
            <input {...field("headline_em")} />
            <span className="field-hint">Shown in italics under the headline.</span>
          </label>

          <label className="field full">
            Bio
            <textarea {...field("bio")} rows={3} placeholder="A couple of sentences about you and who your products are for." />
          </label>

          <div className="field full">
            Portrait photo
            <div className="media-field">
              <span className="media-thumb">
                {values.image ? <img src={values.image} alt="" /> : <Icon name="image" size={22} />}
              </span>
              <div>
                <label className="btn btn-secondary btn-sm">
                  <Icon name="upload" size={14} /> {uploading ? "Uploading…" : values.image ? "Replace photo" : "Upload photo"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={onUpload}
                    disabled={uploading}
                    hidden
                  />
                </label>
                <span className="field-hint">PNG, JPG or WebP, under 2 MB. Portrait shots work best.</span>
              </div>
            </div>
          </div>

          <label className="field full">
            Or paste an image link
            <input {...field("image")} placeholder="https://…" inputMode="url" />
          </label>

          <label className="field">
            Name on photo
            <input {...field("short")} placeholder="jasmine's financials." />
          </label>

          <label className="field">
            Photo tag
            <input {...field("label")} placeholder="Money tips" />
          </label>
        </div>

        <div className="form-section">
          <div className="form-section-head">
            <h2>Appearance &amp; visibility</h2>
          </div>

          <label className="field full">
            Background colour
            <span className="color-field">
              <input {...field("background")} type="color" />
              <code>{values.background}</code>
            </span>
          </label>

          <label className="toggle full">
            <span>
              <strong>Store is public</strong>
              <small>{values.published ? "Anyone with the link can visit and buy." : "Hidden: only you can see it."}</small>
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
            {pending ? "Saving…" : store ? "Save changes" : "Create store"}
          </button>
          {store && <Link className="btn btn-ghost" href="/dashboard/products">Manage products</Link>}
          {state.error && <p className="form-error" role="alert">{state.error}</p>}
        </div>
      </form>

      <aside className="card settings-preview">
        <div className="card-head">
          <h2>Preview</h2>
          {store && (
            <a className="link" href={`/store/${store.slug}`} target="_blank" rel="noreferrer">Open store</a>
          )}
        </div>

        <div className="mini-store" style={{ "--store-bg": values.background } as CSSProperties}>
          <div className="mini-store-bar">
            <i /><i /><i />
            <span>/store/{values.slug || "your-name"}</span>
          </div>
          <div className="mini-store-body">
            <div>
              <small>{values.category || "Your category"}</small>
              <h3>{values.headline || "Your headline"}<br /><em>{values.headline_em}</em></h3>
              <p>{values.bio || "Your bio appears here."}</p>
            </div>
            <div className="mini-store-photo">
              {values.image ? <img src={values.image} alt="Portrait preview" /> : <Icon name="image" size={24} />}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
