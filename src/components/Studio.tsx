"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { deleteProduct, importProducts, saveProduct } from "@/app/dashboard/actions";
import { newProductId, normalizeProduct, productImage, productPrice, safeImage } from "@/lib/catalog";
import { toast } from "@/lib/ui";
import { uploadImage } from "@/lib/upload";
import type { Product } from "@/lib/types";

type Props = {
  initialProducts: Product[];
  stores: { slug: string; name: string }[];
  initialId?: string;
  ownStore: string | null;
  userId: string;
};

function blankProduct(store: string): Product {
  return normalizeProduct({
    id: newProductId(),
    store,
    name: "New digital product",
    category: "DIGITAL PRODUCT",
    tagline: "",
    description: "",
    price: 29,
    priceLabel: "$29 USD",
    badge: "NEW PRODUCT",
    theme: "#f0e0ed",
    layout: "split",
    cta: "Explore product",
    features: ["Feature one", "Feature two"],
    faqs: []
  });
}

function Preview({ product }: { product: Product }) {
  return (
    <>
      <div className="preview-image" style={{ background: product.theme }}>
        <img src={productImage(product)} alt={`${product.name} preview`} />
      </div>

      <div className="preview-copy">
        <span className="eyebrow">{product.category}</span>
        <h3>{product.name}</h3>
        <p><strong>{productPrice(product)}</strong></p>
        <p>{product.tagline}</p>
        <p>{product.description}</p>
        <ul>
          {product.features.map((feature, index) => <li key={index}>{feature}</li>)}
        </ul>
        <button className="btn btn-dark" data-buy>{product.cta} ↗</button>
      </div>
    </>
  );
}

export default function Studio({ initialProducts, stores, initialId, ownStore, userId }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState(initialProducts);
  // Open the requested product, otherwise the first product in your own store.
  const [editingId, setEditingId] = useState<string | undefined>(
    initialProducts.some(product => product.id === initialId)
      ? initialId
      : (initialProducts.find(product => product.store === ownStore) ?? initialProducts[0])?.id
  );
  const [draft, setDraft] = useState<Product | null>(
    initialProducts.find(product => product.id === editingId) ?? null
  );
  // Bumped whenever the form should re-mount with fresh default values.
  const [formKey, setFormKey] = useState(0);
  const [busy, setBusy] = useState(false);

  function select(id: string, list = products) {
    const product = list.find(item => item.id === id) ?? null;

    setEditingId(product?.id);
    setDraft(product ? structuredClone(product) : null);
    setFormKey(key => key + 1);
    const params = new URLSearchParams({
      // Keep ?store= when an admin is editing someone else's store.
      ...(stores[0] && stores[0].slug !== ownStore ? { store: stores[0].slug } : {}),
      ...(product ? { product: product.id } : {})
    });
    router.replace(`/dashboard/products${params.size ? `?${params}` : ""}`, { scroll: false });
  }

  function readForm(): Product | null {
    const form = formRef.current;

    if (!form || !draft) return draft;

    const data = new FormData(form);
    const enteredImage = String(data.get("image") || "").trim();

    return normalizeProduct({
      ...draft,
      name: String(data.get("name") ?? ""),
      price: Number(data.get("price")),
      priceLabel: String(data.get("priceLabel") ?? ""),
      category: String(data.get("category") ?? ""),
      tagline: String(data.get("tagline") ?? ""),
      description: String(data.get("description") ?? ""),
      badge: String(data.get("badge") ?? ""),
      cta: String(data.get("cta") ?? ""),
      theme: String(data.get("theme") ?? ""),
      layout: data.get("layout") === "center" ? "center" : "split",
      store: String(data.get("store") ?? draft.store),
      image: enteredImage ? safeImage(enteredImage) : draft.image,
      gallery: String(data.get("gallery") || "")
        .split("\n")
        .map(safeImage)
        .filter(Boolean),
      features: String(data.get("features") || "")
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean),
      faqs: String(data.get("faqs") || "")
        .split("\n")
        .map(line => line.split("|").map(item => item.trim()))
        .filter(pair => pair.length >= 2 && pair[0] && pair[1])
        .map(pair => [pair[0], pair[1]] as [string, string])
    });
  }

  async function persist(product: Product, message: string) {
    setBusy(true);
    const result = await saveProduct(product);
    setBusy(false);

    if (!result.ok) {
      toast(result.error);
      return false;
    }

    toast(message);
    return true;
  }

  async function onSave() {
    const product = readForm();
    if (!product) return;

    if (await persist(product, "Product saved. It's live on your store.")) {
      setProducts(list => list.map(item => item.id === product.id ? product : item));
      setDraft(product);
    }
  }

  async function onNew() {
    const product = blankProduct(ownStore ?? draft?.store ?? stores[0].slug);

    if (await persist(product, "New product created.")) {
      const list = [...products, product];
      setProducts(list);
      select(product.id, list);
    }
  }

  async function onDuplicate() {
    const current = readForm();
    if (!current) return;

    const product = { ...structuredClone(current), id: newProductId(), name: current.name + " (copy)" };

    if (await persist(product, "Product duplicated.")) {
      const list = [...products, product];
      setProducts(list);
      select(product.id, list);
    }
  }

  async function onDelete() {
    if (!draft) return;
    if (!confirm(`Delete “${draft.name}” from your store? This can't be undone.`)) return;

    setBusy(true);
    const result = await deleteProduct(draft.id, draft.store);
    setBusy(false);

    if (!result.ok) {
      toast(result.error);
      return;
    }

    const list = products.filter(item => item.id !== draft.id);
    setProducts(list);
    select(list[0]?.id ?? "", list);
    toast("Product deleted.");
  }

  function onExport() {
    const current = readForm();
    const catalog = products.map(product => product.id === current?.id ? current : product);
    const url = URL.createObjectURL(new Blob([JSON.stringify(catalog, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");

    link.href = url;
    link.download = "btg-products.json";
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Product catalog exported.");
  }

  async function onImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    let imported: Product[];

    try {
      imported = JSON.parse(await file.text());
    } catch {
      toast("Import failed. Choose a valid product JSON file.");
      return;
    }

    setBusy(true);
    const result = await importProducts(imported);
    setBusy(false);

    if (!result.ok) {
      toast(result.error);
      return;
    }

    toast("Product catalog imported.");
    window.location.reload();
  }

  async function onUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !draft) return;

    setBusy(true);
    try {
      const url = await uploadImage(file, userId);
      const current = readForm() ?? draft;

      setDraft({ ...current, image: url });
      const input = formRef.current?.elements.namedItem("image") as HTMLInputElement | null;
      if (input) input.value = url;

      toast("Cover uploaded. Save to keep it.");
    } catch (error) {
      toast((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const toolbar = (
    <div className="editor-actions">
      <button className="small-button" type="button" onClick={onNew} disabled={busy}>+ New product</button>
      <button className="small-button" type="button" onClick={onDuplicate} disabled={busy || !draft}>Duplicate</button>
      <button className="small-button" type="button" onClick={onDelete} disabled={busy || !draft}>Delete</button>
    </div>
  );

  if (!draft) {
    return (
      <div className="studio-layout">
        <section className="editor-panel">
          <h2>Product settings</h2>
          {toolbar}
          <p className="hub-empty">Your collection is empty. Create your first product to get started.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="studio-layout">
      <section className="editor-panel">
        <h2>Product settings</h2>

        {toolbar}

        <form
          id="studio-form"
          key={formKey}
          ref={formRef}
          onInput={() => setDraft(readForm())}
          onSubmit={event => {
            event.preventDefault();
            onSave();
          }}
        >
          <div className="editor-fields">
            <label className="full">
              Choose product
              <select value={editingId} onChange={event => select(event.target.value)}>
                {stores.length > 1
                  ? stores.map(store => (
                      <optgroup key={store.slug} label={store.slug === ownStore ? `${store.name} (my store)` : store.name}>
                        {products.filter(item => item.store === store.slug).map(item => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </optgroup>
                    ))
                  : products.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
              </select>
            </label>

            <label className="full">
              Product name
              <input name="name" defaultValue={draft.name} />
            </label>

            <label>
              Price (USD)
              <input name="price" type="number" min="0" max="9999" defaultValue={draft.price} />
            </label>

            <label>
              Display price
              <input name="priceLabel" defaultValue={draft.priceLabel} placeholder="From $19 USD" />
            </label>

            <label className="full">
              Category
              <input name="category" defaultValue={draft.category} />
            </label>

            <label className="full">
              Short headline
              <input name="tagline" defaultValue={draft.tagline} />
            </label>

            <label className="full">
              Description
              <textarea name="description" rows={4} defaultValue={draft.description} />
            </label>

            <label>
              Product badge
              <input name="badge" defaultValue={draft.badge} />
            </label>

            <label>
              Button text
              <input name="cta" defaultValue={draft.cta} />
            </label>

            <label>
              Background color
              <input name="theme" type="color" defaultValue={draft.theme} />
            </label>

            <label>
              Page layout
              <select name="layout" defaultValue={draft.layout}>
                <option value="split">Gallery and details</option>
                <option value="center">Centered editorial</option>
              </select>
            </label>

            {stores.length > 1 && (
              <label className="full">
                Assign to store
                <select name="store" defaultValue={draft.store}>
                  {stores.map(store => (
                    <option key={store.slug} value={store.slug}>
                      {store.slug === ownStore ? `${store.name} (my store)` : store.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="full">
              Cover image URL
              <input name="image" defaultValue={draft.image} placeholder="https://… or /templates/student-money-planner.png" />
            </label>

            <label className="full">
              Upload cover image (under 2 MB)
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onUpload} disabled={busy} />
            </label>

            <label className="full">
              Gallery images — one URL per line
              <textarea name="gallery" rows={4} defaultValue={draft.gallery.join("\n")} />
            </label>

            <label className="full">
              Features — one per line
              <textarea name="features" rows={5} defaultValue={draft.features.join("\n")} />
            </label>

            <label className="full">
              FAQs — Question | Answer, one per line
              <textarea name="faqs" rows={5} defaultValue={draft.faqs.map(pair => pair.join(" | ")).join("\n")} />
            </label>
          </div>

          <div className="editor-footer">
            <button className="btn btn-dark" type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save & publish ↗"}
            </button>
            <button className="btn btn-soft" type="button" onClick={onExport}>Export JSON ↓</button>
            <button className="small-button" type="button" onClick={() => importRef.current?.click()} disabled={busy}>
              Import JSON ↑
            </button>
            <input ref={importRef} type="file" accept=".json,application/json" hidden onChange={onImport} />
          </div>
        </form>

        <div className="editor-warning">
          ✳ Saved changes go live on your public storefront immediately.
          Checkout and digital delivery are not connected yet.
        </div>
      </section>

      <aside className="preview-panel">
        <div className="preview-heading">
          <h2>Live preview</h2>
          <Link className="small-button" href={`/product/${encodeURIComponent(draft.id)}`} target="_blank">
            Full product page ↗
          </Link>
        </div>

        <div id="editor-preview">
          <Preview product={draft} />
        </div>
      </aside>
    </div>
  );
}
