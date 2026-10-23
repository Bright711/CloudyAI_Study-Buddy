"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CurrentUser } from "@/lib/api";

type AppShellProps = {
  children: ReactNode;
  user: CurrentUser | null;
  authLoading: boolean;
  authError: string | null;
  onSignOut: () => void;
};

const navigation = [
  { href: "/", label: "Overview", icon: "grid" },
  { href: "/practice", label: "Practice quiz", icon: "book" },
] as const;

function NavIcon({ name }: { name: (typeof navigation)[number]["icon"] }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="nav-icon">
      {name === "grid" ? (
        <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
      ) : (
        <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v17H7.5A2.5 2.5 0 0 0 5 21.5zm0 0v17M9 7h7M9 11h7" />
      )}
    </svg>
  );
}

export function AppShell({
  children,
  user,
  authLoading,
  authError,
  onSignOut,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    setSignOutError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      onSignOut();
      router.replace("/auth");
      router.refresh();
    } catch (error) {
      setSignOutError(
        error instanceof Error ? error.message : "Could not sign out. Please retry.",
      );
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="app-frame">
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          className="mobile-scrim"
          onClick={() => setMobileOpen(false)}
          type="button"
        />
      )}
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <Link className="brand" href="/" onClick={() => setMobileOpen(false)}>
          <span className="brand-mark" aria-hidden="true">C</span>
          <span className="brand-text">
            <strong>CloudyAI</strong>
            <small>STUDY BUDDY</small>
          </span>
        </Link>

        <div className="sidebar-section-label">YOUR STUDY SPACE</div>
        <nav aria-label="Main navigation" className="side-navigation">
          {navigation.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`nav-link ${active ? "nav-link-active" : ""}`}
                href={item.href}
                key={item.href}
                onClick={() => setMobileOpen(false)}
              >
                <NavIcon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-note">
          <span className="sidebar-note-icon" aria-hidden="true">i</span>
          <p>Only features connected to your learning service are enabled.</p>
        </div>

        <div className="sidebar-account">
          <div className="account-avatar" aria-hidden="true">
            {user?.email?.slice(0, 1).toUpperCase() ?? "C"}
          </div>
          <div className="sidebar-account-copy">
            <strong>{user?.email ?? (authLoading ? "Checking account…" : "Guest learner")}</strong>
            <small>
              {user ? "Signed in" : authLoading ? "Checking account" : authError ? "Status unavailable" : "Not signed in"}
            </small>
          </div>
          {user && (
            <button
              aria-label="Sign out"
              className="icon-button"
              disabled={signingOut}
              onClick={signOut}
              title="Sign out"
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M10 17l5-5-5-5M15 12H3m9-7h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-6" />
              </svg>
            </button>
          )}
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <button
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            className="mobile-menu-button"
            onClick={() => setMobileOpen((open) => !open)}
            type="button"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <p className="topbar-context">AZ-900 certification preparation</p>
          <span className="topbar-status">
            <span aria-hidden="true" />
            {user
              ? "Account connected"
              : authLoading
                ? "Checking account"
                : authError
                  ? "Account status unavailable"
                  : "Guest mode"}
          </span>
        </header>
        <main className="main-content">
          {signOutError && (
            <div className="inline-alert" role="alert">
              {signOutError}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
