"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import ThemeSwitcher from "@/components/ThemeSwitcher";

/*
  SITE CHROME

  Decides whether to render the public storefront "chrome" (floral header,
  footer, cart drawer, theme switcher) around the page content.

  The admin back office (/admin/*) is a different product with its own layout,
  so it opts out of all of it — no floral bands, no cart, no theme dots.
  Everything else (the whole storefront) gets the full chrome.

  WHY A CLIENT COMPONENT: it needs usePathname() to know the current route.
  The page content itself is still passed in as `children`, so server
  components (e.g. the homepage) continue to render on the server — passing a
  server component through a client component as children does not "client-ify"
  it.
*/

export default function SiteChrome({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  // The admin area provides its own <main> (in admin/layout.js) and is locked to
  // the Atelier palette, so we render its subtree bare here — no public
  // header/footer/cart, and no theme switcher.
  if (isAdmin) {
    return children;
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
      <ThemeSwitcher />
    </>
  );
}
