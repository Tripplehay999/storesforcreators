import ProfileForm from "@/components/ProfileForm";
import StoreForm from "@/components/StoreForm";
import { requireSession } from "@/lib/data";

export default async function StoreSettingsPage() {
  const { profile, store } = await requireSession();

  return (
    <>
      <div className="studio-heading hub-page-heading">
        <span className="eyebrow">{store ? "STOREFRONT SETTINGS" : "CREATE YOUR STOREFRONT"}</span>
        <h1>A store that feels <em>like yours.</em></h1>
        <p>
          Your name, your identity, and a look that makes sense for your community.
          Changes go live on your public store as soon as you save.
        </p>
      </div>

      <StoreForm store={store} userId={profile.id} />

      <section className="editor-panel hub-profile">
        <h2>Your profile</h2>
        <ProfileForm profile={profile} />
      </section>
    </>
  );
}
