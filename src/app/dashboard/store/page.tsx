import { PageHeader } from "@/components/hub/ui";
import ProfileForm from "@/components/ProfileForm";
import StoreForm from "@/components/StoreForm";
import { requireSession } from "@/lib/data";

export default async function StoreSettingsPage() {
  const { profile, store } = await requireSession();

  return (
    <>
      <PageHeader
        title={store ? "Storefront" : "Create your store"}
        description={store
          ? "Changes go live on your public store as soon as you save."
          : "Pick an address and a look. You can change everything except the address later."}
      />

      <StoreForm store={store} userId={profile.id} />

      <div className="settings settings-account">
        <ProfileForm profile={profile} />
      </div>
    </>
  );
}
