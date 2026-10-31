import Link from "next/link";
import { Suspense } from "react";
import HubNav from "@/components/HubNav";
import type { Profile, Store } from "@/lib/types";
import Icon from "./Icon";
import "@/app/dashboard/hub.css";

/** The creator hub frame: sidebar on desktop, top bar and bottom tabs on phones. */
export default function HubShell({ profile, store, children }: { profile: Profile; store: Store | null; children: React.ReactNode }) {
  const name = profile.fullName || "Creator";
  const initial = (profile.fullName || profile.email).trim().charAt(0).toUpperCase();
  const isAdmin = profile.role === "admin";

  const account = (
    <>
      <div className="app-account-who">
        <span className="app-avatar" aria-hidden="true">{initial}</span>
        <div>
          <strong>{name}</strong>
          <small>{profile.email}</small>
        </div>
      </div>
      {isAdmin && (
        <Link className="app-menu-item" href="/admin">
          <Icon name="shield" size={16} /> Admin panel
        </Link>
      )}
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
    <div className="app">
      <aside className="app-sidebar">
        <Link className="app-logo" href="/">
          <span className="app-logo-mark">SFC</span>
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
          <a className="app-nav-external" href={`/store/${store.slug}`} target="_blank" rel="noreferrer">
            <Icon name="external" size={16} /> View storefront
          </a>
        )}

        <div className="app-sidebar-foot">{account}</div>
      </aside>

      <header className="app-topbar">
        <Link className="app-logo" href="/dashboard">
          <span className="app-logo-mark">SFC</span>
          <span>{store?.name ?? "Creator hub"}</span>
        </Link>

        <div className="app-topbar-actions">
          {store && (
            <a className="app-icon-button" href={`/store/${store.slug}`} target="_blank" rel="noreferrer" aria-label="View storefront">
              <Icon name="external" size={18} />
            </a>
          )}
          <details className="app-account-menu">
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
    </div>
  );
}
