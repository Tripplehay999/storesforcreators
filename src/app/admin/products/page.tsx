import Link from "next/link";
import ActionForm from "@/components/admin/ActionForm";
import { getStoreBalances } from "@/lib/admin-data";
import { productImage, productPrice } from "@/lib/catalog";
import { getProducts } from "@/lib/data";
import { deleteProductAdmin } from "../actions";

type Props = { searchParams: Promise<{ store?: string }> };

export default async function AdminProductsPage({ searchParams }: Props) {
  const { store } = await searchParams;
  const [products, stores] = await Promise.all([getProducts(store || undefined), getStoreBalances()]);
  const storeName = new Map(stores.map(item => [item.slug, item.name]));

  return (
    <>
      <div className="adm-page-head">
        <div>
          <span className="adm-crumb">Admin</span>
          <h1>Products</h1>
          <p>{products.length} products{store ? ` in ${storeName.get(store) ?? store}` : " across all stores"}.</p>
        </div>

        <form className="adm-toolbar" action="/admin/products">
          <select className="adm-select" name="store" defaultValue={store ?? ""} aria-label="Filter by store">
            <option value="">All stores</option>
            {stores.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}
          </select>
          <button className="adm-btn" type="submit">Filter</button>
        </form>
      </div>

      <section className="adm-panel">
        {products.length === 0 ? (
          <p className="adm-empty">No products.</p>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr><th></th><th>Product</th><th>Store</th><th>Category</th><th className="num">Price</th><th></th></tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id}>
                    <td style={{ width: 52 }}>
                      <img
                        src={productImage(product)}
                        alt=""
                        width={36}
                        height={36}
                        style={{ borderRadius: 6, objectFit: "cover", background: product.theme, display: "block" }}
                      />
                    </td>
                    <td>
                      {product.name}
                      <span className="adm-sub adm-mono">{product.id}</span>
                    </td>
                    <td className="adm-muted">{storeName.get(product.store) ?? product.store}</td>
                    <td className="adm-muted">{product.category}</td>
                    <td className="num">{productPrice(product)}</td>
                    <td>
                      <div className="adm-row-actions">
                        <Link className="adm-btn adm-btn-sm adm-btn-ghost" href={`/product/${product.id}`} target="_blank">View</Link>
                        <Link
                          className="adm-btn adm-btn-sm"
                          href={`/dashboard/products?store=${product.store}&product=${product.id}`}
                        >
                          Edit
                        </Link>
                        <ActionForm action={deleteProductAdmin} confirm={`Delete “${product.name}”?`}>
                          <input type="hidden" name="id" value={product.id} />
                          <button className="adm-btn adm-btn-sm adm-btn-danger" type="submit">Delete</button>
                        </ActionForm>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
