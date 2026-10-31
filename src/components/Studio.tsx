"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { deleteProduct, importProducts, saveProduct } from "@/app/dashboard/actions";
import Icon from "@/components/hub/Icon";
import { Empty } from "@/components/hub/ui";
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
    <div className="studio-preview">
      <div className="preview-image" style={{ background: product.theme }}>
        <img src={productImage(product)} alt={`${product.name} preview`} />
      </div>

      <div className="preview-copy">
        <small>{product.category}</small>
        <h3>{product.name}</h3>
        <p><strong>{productPrice(product)}</strong></p>
        {product.tagline && <p>{product.tagline}</p>}
        {product.description && <p>{product.description}</p>}
        {product.features.length > 0 && (
          <ul>
            {product.features.map((feature, index) => <li key={index}>{feature}</li>)}
          </ul>
        )}
        <span className="btn btn-primary">{product.cta}</span>
      </div>
    </div>
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
  // Phones show one pane at a time; desktop shows both.
  const [pane, setPane] = useState<"list" | "editor">(initialId ? "editor" : "list");
  const [tab, setTab] = useState<"edit" | "preview">("edit");

  function select(id: string, list = products) {
    const product = list.find(item => item.id === id) ?? null;

    setEditingId(product?.id);
    setDraft(product ? structuredClone(product) : null);
    setFormKey(key => key + 1);
    setPane(product ? "editor" : "list");
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
    link.download = "sfc-products.json";
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

  const list = (
    <section className="card card-flush product-list">
      <div className="card-head">
        <h2>Products <span className="muted">{products.length}</span></h2>
        <button className="btn btn-primary btn-sm" type="button" onClick={onNew} disabled={busy}>
          <Icon name="plus" size={14} /> New product
        </button>
      </div>

      {products.length === 0 ? (
        <Empty title="No products yet">Create your first product. You can edit everything before sharing it.</Empty>
      ) : (
        <ul className="product-items">
          {products.map(item => (
            <li key={item.id}>
              <button
                type="button"
                className={`product-item${item.id === editingId ? " active" : ""}`}
                aria-current={item.id === editingId ? "true" : undefined}
                onClick={() => (item.id === editingId ? setPane("editor") : select(item.id))}
              >
                <span className="product-thumb" style={{ background: item.theme }}>
                  <img src={productImage(item)} alt="" />
                </span>
                <div>
                  <strong>{item.name}</strong>
                  <small>{productPrice(item)}</small>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="product-list-foot">
        <button className="btn btn-ghost btn-sm" type="button" onClick={onExport} disabled={products.length === 0}>
          <Icon name="download" size={14} /> Export
        </button>
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => importRef.current?.click()} disabled={busy}>
          <Icon name="upload" size={14} /> Import
        </button>
        <input ref={importRef} type="file" accept=".json,application/json" hidden onChange={onImport} />
      </div>
    </section>
  );

  return (
    <div className="studio" data-pane={draft ? pane : "list"}>
      {list}

      <section className="card card-flush product-editor">
        {!draft ? (
          <Empty title="Pick a product to edit">Or create a new one from the list.</Empty>
        ) : (
          <>
            <div className="editor-head">
              <div>
                <button className="btn btn-ghost btn-sm editor-back" type="button" onClick={() => setPane("list")}>
                  <Icon name="left" size={14} /> Products
                </button>
                <h2>{draft.name || "Untitled product"}</h2>
              </div>
              <div>
                <div className="segmented segmented-sm" role="tablist" aria-label="Editor view">
                  <button type="button" role="tab" aria-selected={tab === "edit"} className={tab === "edit" ? "active" : ""} onClick={() => setTab("edit")}>
                    Edit
                  </button>
                  <button type="button" role="tab" aria-selected={tab === "preview"} className={tab === "preview" ? "active" : ""} onClick={() => setTab("preview")}>
                    Preview
                  </button>
                </div>
                <button className="btn btn-ghost btn-sm" type="button" onClick={onDuplicate} disabled={busy} title="Duplicate">
                  <Icon name="copy" size={15} /><span className="sr-only">Duplicate</span>
                </button>
                <button className="btn btn-ghost btn-sm btn-danger" type="button" onClick={onDelete} disabled={busy} title="Delete">
                  <Icon name="trash" size={15} /><span className="sr-only">Delete</span>
                </button>
                <Link className="btn btn-ghost btn-sm" href={`/product/${encodeURIComponent(draft.id)}`} target="_blank" title="Open product page">
                  <Icon name="external" size={15} /><span className="sr-only">Open product page</span>
                </Link>
              </div>
            </div>

            <form
              id="studio-form"
              className="editor-body"
              key={formKey}
              ref={formRef}
              hidden={tab !== "edit"}
              onInput={() => setDraft(readForm())}
              onSubmit={event => {
                event.preventDefault();
                onSave();
              }}
            >
              <div className="form-section">
                <div className="form-section-head">
                  <h2>Basics</h2>
                </div>

                <label className="field full">
                  Product name
                  <input name="name" defaultValue={draft.name} required />
                </label>

                <label className="field">
                  Category
                  <input name="category" defaultValue={draft.category} placeholder="Digital planner" />
                </label>

                <label className="field">
                  Short headline
                  <input name="tagline" defaultValue={draft.tagline} placeholder="One line that sells it" />
                </label>

                <label className="field full">
                  Description
                  <textarea name="description" rows={4} defaultValue={draft.description} />
                </label>
              </div>

              <div className="form-section">
                <div className="form-section-head">
                  <h2>Pricing</h2>
                </div>

                <label className="field">
                  Price
                  <span className="input-prefix">
                    <span>$</span>
                    <input name="price" type="number" min="0" max="9999" step="0.01" inputMode="decimal" defaultValue={draft.price} />
                  </span>
                  <span className="field-hint">What customers pay, in USD.</span>
                </label>

                <label className="field">
                  Price shown on page
                  <input name="priceLabel" defaultValue={draft.priceLabel} placeholder="From $19 USD" />
                  <span className="field-hint">Leave blank to show the price above.</span>
                </label>

                <label className="field">
                  Badge
                  <input name="badge" defaultValue={draft.badge} placeholder="Bestseller" />
                </label>

                <label className="field">
                  Button text
                  <input name="cta" defaultValue={draft.cta} />
                </label>
              </div>

              <div className="form-section">
                <div className="form-section-head">
                  <h2>Images</h2>
                </div>

                <div className="field full">
                  Cover image
                  <div className="media-field">
                    <span className="media-thumb" style={{ background: draft.theme }}>
                      <img src={productImage(draft)} alt="" />
                    </span>
                    <div>
                      <label className="btn btn-secondary btn-sm">
                        <Icon name="upload" size={14} /> {busy ? "Working…" : "Upload cover"}
                        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onUpload} disabled={busy} hidden />
                      </label>
                      <span className="field-hint">PNG, JPG or WebP, under 2 MB.</span>
                    </div>
                  </div>
                </div>

                <label className="field full">
                  Or paste an image link
                  <input name="image" defaultValue={draft.image} placeholder="https://…" inputMode="url" />
                </label>

                <label className="field full">
                  Gallery images
                  <textarea name="gallery" rows={3} defaultValue={draft.gallery.join("\n")} placeholder="One image link per line" />
                </label>
              </div>

              <div className="form-section">
                <div className="form-section-head">
                  <h2>Product page</h2>
                </div>

                <label className="field full">
                  What&apos;s included
                  <textarea name="features" rows={5} defaultValue={draft.features.join("\n")} />
                  <span className="field-hint">One item per line.</span>
                </label>

                <label className="field full">
                  FAQs
                  <textarea name="faqs" rows={4} defaultValue={draft.faqs.map(pair => pair.join(" | ")).join("\n")} />
                  <span className="field-hint">One per line, as: Question | Answer</span>
                </label>

                <label className="field">
                  Page colour
                  <span className="color-field">
                    <input name="theme" type="color" defaultValue={draft.theme} />
                    <code>{draft.theme}</code>
                  </span>
                </label>

                <label className="field">
                  Layout
                  <select name="layout" defaultValue={draft.layout}>
                    <option value="split">Gallery beside details</option>
                    <option value="center">Centred editorial</option>
                  </select>
                </label>

                {stores.length > 1 && (
                  <label className="field full">
                    Store
                    <select name="store" defaultValue={draft.store}>
                      {stores.map(store => (
                        <option key={store.slug} value={store.slug}>
                          {store.slug === ownStore ? `${store.name} (my store)` : store.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            </form>

            {tab === "preview" && (
              <div className="editor-body">
                <Preview product={draft} />
              </div>
            )}

            <div className="editor-foot">
              <button className="btn btn-primary" type="submit" form="studio-form" disabled={busy}>
                {busy ? "Saving…" : "Save"}
              </button>
              <span className="muted">Saved changes go live on your store right away.</span>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
