import Link from "next/link";
import { Suspense } from "react";
import HubNav from "@/components/HubNav";
import type { HubTheme } from "@/lib/theme";
import type { Profile, Store } from "@/lib/types";
import HubTour from "./HubTour";
import LogoMark from "@/components/LogoMark";
import Icon from "./Icon";
import ThemeToggle from "./ThemeToggle";
import TourButton from "./TourButton";
import { storePath } from "@/lib/store-links";
import "@/app/dashboard/hub.css";

type Props = { profile: Profile; store: Store | null; theme: HubTheme; children: React.ReactNode };

/** The creator hub frame: sidebar on desktop, top bar and bottom tabs on phones. */
export default function HubShell({ profile, store, theme, children }: Props) {
  const name = profile.fullName || "Creator";
  const initial = (profile.fullName || profile.email).trim().charAt(0).toUpperCase();
  // Only active admins see the way into the admin panel.
  const isAdmin = profile.role === "admin" && !profile.suspended;

  const account = (
    <>
      <div className="app-account-who">
        <span className="app-avatar" aria-hidden="true">{initial}</span>
        <div>
          <strong>{name}</strong>
          <small>{profile.email}</small>
        </div>
      </div>
      <ThemeToggle initial={theme} />
      <Link className="app-menu-item only-phone" href="/dashboard/store">
        <Icon name="store" size={16} /> Storefront &amp; account
      </Link>
      {isAdmin && (
        <Link className="app-menu-item" href="/admin">
          <Icon name="shield" size={16} /> Admin panel
        </Link>
      )}
      <TourButton />
      <Link className="app-menu-item" href="/reset-password">
        <Icon name="key" size={16} /> Change password
      </Link>
      <form action="/auth/signout" method="post">
        <button className="app-menu-item" type="submit">
          <Icon name="logout" size={16} /> Log out
        </button>
      </form>
    </>
  );

  return (
    <div className="app" data-theme={theme}>
      <aside className="app-sidebar">
        <Link className="app-logo" href="/">
          <span className="app-logo-mark"><LogoMark size={30} /></span>
          <span>Stores for Creators</span>
        </Link>

        {store ? (
          <div className="app-store">
            <span className="app-store-thumb" style={{ background: store.background }}>
              {store.image ? <img src={store.image} alt="" /> : store.name.charAt(0)}
            </span>
            <div>
              <strong>{store.name}</strong>
              <small className={store.published ? "is-live" : ""}>{store.published ? "Live" : "Hidden"}</small>
            </div>
          </div>
        ) : (
          <Link className="app-store app-store-empty" href="/dashboard/store">
            <span className="app-store-thumb"><Icon name="plus" size={16} /></span>
            <div>
              <strong>Create your store</strong>
              <small>Takes about a minute</small>
            </div>
          </Link>
        )}

        <Suspense>
          <HubNav variant="sidebar" />
        </Suspense>

        {store && (
          <a className="app-nav-external" href={storePath(store.slug)} target="_blank" rel="noreferrer" data-tour="view-store">
            <Icon name="external" size={16} /> View storefront
          </a>
        )}

        <div className="app-sidebar-foot" data-tour="account">{account}</div>
      </aside>

      <header className="app-topbar">
        <Link className="app-logo" href="/dashboard">
          <span className="app-logo-mark"><LogoMark size={30} /></span>
          <span>{store?.name ?? "Creator hub"}</span>
        </Link>

        <div className="app-topbar-actions">
          {store && (
            <a
              className="app-icon-button"
              href={storePath(store.slug)}
              target="_blank"
              rel="noreferrer"
              aria-label="View storefront"
              data-tour="view-store"
            >
              <Icon name="external" size={18} />
            </a>
          )}
          <details className="app-account-menu" data-tour="account">
            <summary aria-label="Account menu">
              <span className="app-avatar">{initial}</span>
            </summary>
            <div className="app-menu">{account}</div>
          </details>
        </div>
      </header>

      <main className="app-main">
        <div className="app-content">{children}</div>
      </main>

      <Suspense>
        <HubNav variant="tabs" />
      </Suspense>

      <HubTour />
    </div>
  );
}
