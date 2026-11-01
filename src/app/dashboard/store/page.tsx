import { PageHeader } from "@/components/hub/ui";
import StoreLinkCard from "@/components/hub/StoreLinkCard";
import ProfileForm from "@/components/ProfileForm";
import StoreForm from "@/components/StoreForm";
import { productImage, productPrice } from "@/lib/catalog";
import { getCheckoutMode } from "@/lib/checkout";
import { getProducts, requireSession } from "@/lib/data";
import { siteUrl } from "@/lib/site";

export default async function StoreSettingsPage() {
  const { profile, store } = await requireSession();

  const [products, site, checkout] = store
    ? await Promise.all([getProducts(store.slug), siteUrl(), getCheckoutMode(store.slug)])
    : [[], "", "off" as const];

  const previewProducts = products.map(product => ({
    id: product.id,
    name: product.name,
    price: productPrice(product),
    image: productImage(product),
    theme: product.theme
  }));

  return (
    <>
      <PageHeader
        title={store ? "Storefront" : "Create your store"}
        description={store
          ? "Your store's look and link. Changes go live as soon as you save."
          : "Pick a web address and a look. You can change everything except the address later."}
      />

      {store && (
        <StoreLinkCard
          url={`${site}/store/${store.slug}`}
          storeName={store.name}
          image={store.image}
          background={store.background}
          published={store.published}
          checkout={checkout}
        />
      )}

      <StoreForm store={store} userId={profile.id} products={previewProducts} />

      <div className="settings settings-account">
        <ProfileForm profile={profile} />
      </div>
    </>
  );
}
