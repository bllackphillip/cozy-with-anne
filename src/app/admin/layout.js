"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdminSidebar from "@/components/admin/AdminSidebar";

/*
  ADMIN LAYOUT — the auth gate for the whole back office.

  This nests inside the root layout, but SiteChrome already strips the public
  header/footer/cart for any /admin route, so here we only build the admin UI.

  ROUTING RULES (driven by the AuthContext login state):
  - while the session is still resolving      → show a neutral "Loading…" screen
  - on /admin (the login page) with no user    → render the login form bare
  - on /admin while already signed in          → bounce to the dashboard
  - on a protected page with no user           → bounce to the login page
  - on a protected page while signed in         → render sidebar + page content

  The redirects live in an effect (a side effect, not something to do during
  render). Until a redirect lands we render a placeholder so protected content
  never flashes for a signed-out visitor.
*/

export default function AdminLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin";

  useEffect(() => {
    if (loading) return;
    if (!user && !isLoginPage) router.replace("/admin");
    if (user && isLoginPage) router.replace("/admin/dashboard");
  }, [user, loading, isLoginPage, router]);

  // ── Auto sign-out ──────────────────────────────────────────────────────────
  // An admin session shouldn't live forever (Firebase keeps it alive across
  // browser restarts otherwise). Two guards, both easy to tune:
  //  • absolute cap — sign out 24h after login, even after closing the browser
  //    (fixes "logged in days ago, still signed in").
  //  • inactivity — sign out after 60 min with no interaction in an open tab.
  useEffect(() => {
    if (loading || !user) return;

    const KEY = "cwa-admin-login-at";
    const MAX_AGE = 24 * 60 * 60 * 1000; // 24h absolute lifetime
    const IDLE = 60 * 60 * 1000;         // 60 min inactivity

    const startedAt = Number(localStorage.getItem(KEY));
    if (!startedAt) {
      // Session restored without a recorded start (e.g. a pre-existing login) —
      // stamp it now so the cap applies from here on.
      localStorage.setItem(KEY, String(Date.now()));
    } else if (Date.now() - startedAt > MAX_AGE) {
      logout();
      return;
    }

    let timer;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => logout(), IDLE);
    };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [user, loading, logout]);

  if (loading) {
    return (
      <div data-theme="atelier" className="min-h-screen grid place-items-center admin-bg text-gray-500">
        Loading…
      </div>
    );
  }

  // Login page renders without the sidebar.
  if (isLoginPage) {
    return children;
  }

  // Protected page but not signed in: hold until the redirect effect fires.
  if (!user) {
    return (
      <div data-theme="atelier" className="min-h-screen grid place-items-center admin-bg text-gray-500">
        Redirecting…
      </div>
    );
  }

  return (
    <div data-theme="atelier" className="min-h-screen admin-bg flex text-gray-800">
      <AdminSidebar />
      <main className="flex-1 min-w-0 p-6 lg:p-10">{children}</main>
    </div>
  );
}
