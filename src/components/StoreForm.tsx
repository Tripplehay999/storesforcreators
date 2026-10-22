"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, type CSSProperties } from "react";
import { saveStore } from "@/app/dashboard/actions";
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
      toast("Photo uploaded. Save your store to keep it.");
    } catch (error) {
      toast((error as Error).message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="studio-layout">
      <section className="editor-panel">
        <h2>Store settings</h2>

        <form action={action}>
          <div className="editor-fields">
            {store ? (
              <label className="full">
                Store URL
                <input value={`/store/${store.slug}`} disabled />
              </label>
            ) : (
              <label className="full">
                Store URL
                <input
                  {...field("slug")}
                  required
                  minLength={2}
                  maxLength={40}
                  placeholder="your-name"
                  onChange={event => set("slug", slugify(event.target.value, 40))}
                />
                <small className="hub-hint">Your store will live at /store/{values.slug || "your-name"}</small>
              </label>
            )}

            <label className="full">
              Store name
              <input {...field("name")} required placeholder="Jasmine's Financials" />
            </label>

            <label>
              Short name (on photo)
              <input {...field("short")} placeholder="jasmine's financials." />
            </label>

            <label>
              Photo badge
              <input {...field("label")} placeholder="MONEY TIPS" />
            </label>

            <label className="full">
              Category
              <input {...field("category")} placeholder="FINANCE / MONEY TIPS" />
            </label>

            <label>
              Headline
              <input {...field("headline")} />
            </label>

            <label>
              Headline (italic line)
              <input {...field("headline_em")} />
            </label>

            <label className="full">
              Short description
              <input {...field("description")} placeholder="One line about what you offer" />
            </label>

            <label className="full">
              Bio
              <textarea {...field("bio")} rows={3} />
            </label>

            <label>
              Background color
              <input {...field("background")} type="color" />
            </label>

            <label className="hub-check">
              <input
                name="published"
                type="checkbox"
                checked={values.published}
                onChange={event => set("published", event.target.checked)}
              />
              Store is public
            </label>

            <label className="full">
              Portrait image URL
              <input {...field("image")} placeholder="https://…" />
            </label>

            <label className="full">
              {uploading ? "Uploading…" : "Upload portrait (under 2 MB)"}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onUpload} disabled={uploading} />
            </label>
          </div>

          <div className="editor-footer">
            <button className="btn btn-dark" type="submit" disabled={pending || uploading}>
              {pending ? "Saving…" : store ? "Save store ↗" : "Create my store ↗"}
            </button>
            {store && (
              <Link className="btn btn-soft" href="/dashboard/products">Manage products ↗</Link>
            )}
          </div>

          {state.error && <p className="form-status form-error">{state.error}</p>}
        </form>
      </section>

      <aside className="preview-panel">
        <div className="preview-heading">
          <h2>Live preview</h2>
          {store && <Link className="small-button" href={`/store/${store.slug}`} target="_blank">Full store page ↗</Link>}
        </div>

        <div className="store-page hub-store-preview" style={{ "--store-bg": values.background } as CSSProperties}>
          <div className="store-hero">
            <div>
              <span className="eyebrow">{values.category || "YOUR CATEGORY"}</span>
              <h1>{values.headline}<br /><em>{values.headline_em}</em></h1>
              <p>{values.bio || "Your bio appears here."}</p>
            </div>
            <div className="store-hero-photo">
              {values.image && <img src={values.image} alt="Store portrait preview" />}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
