import Link from "next/link";
import { SOCIAL_LINKS } from "@/data/social";

export default function Footer() {
  return (
    // mt-auto = push footer to bottom (works with min-h-screen on parent)
    // bg-gray-50 = very light gray background
    <footer className="mt-auto floral-bottom border-t border-[var(--color-border)] pb-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* grid = CSS grid layout */}
        {/* grid-cols-1 md:grid-cols-3 = 1 column on mobile, 3 on medium+ screens */}
        {/* gap-8 = spacing between grid items */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Policies */}
          <div>
            <h4 className="text-sm font-semibold text-[#FAF6F0] uppercase tracking-wider">
              Policies
            </h4>
            <div className="mt-2 flex flex-col gap-2 items-start">
              <Link
                href="/policies/shipping"
                className="text-sm text-[#E8D8D0] hover:text-[#FAF6F0] transition-colors"
              >
                Shipping Policy
              </Link>
              <Link
                href="/policies/refund"
                className="text-sm text-[#E8D8D0] hover:text-[#FAF6F0] transition-colors"
              >
                Refund Policy
              </Link>
              <Link
                href="/policies/privacy"
                className="text-sm text-[#E8D8D0] hover:text-[#FAF6F0] transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/policies/terms"
                className="text-sm text-[#E8D8D0] hover:text-[#FAF6F0] transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-[#FAF6F0] uppercase tracking-wider">
              Quick Links
            </h4>
            <div className="mt-2 flex flex-col gap-2 items-start">
              <Link
                href="/portfolio"
                className="text-sm text-[#E8D8D0] hover:text-[#FAF6F0] transition-colors"
              >
                Portfolio
              </Link>
              <Link
                href="/shop"
                className="text-sm text-[#E8D8D0] hover:text-[#FAF6F0] transition-colors"
              >
                Shop
              </Link>
              <Link
                href="/commissions"
                className="text-sm text-[#E8D8D0] hover:text-[#FAF6F0] transition-colors"
              >
                Commissions
              </Link>
              <Link
                href="/about"
                className="text-sm text-[#E8D8D0] hover:text-[#FAF6F0] transition-colors"
              >
                About
              </Link>
            </div>
          </div>

          {/* Social / Contact */}
          <div>
            <h4 className="text-sm font-semibold text-[#FAF6F0] uppercase tracking-wider">
              Connect
            </h4>
            <div className="mt-2 flex flex-col gap-2 items-start">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#E8D8D0] hover:text-[#FAF6F0] transition-colors inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d={s.iconPath} />
                  </svg>
                  {s.name}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        {/* mt-8 pt-6 = margin top + padding top with a top border for separation */}
        <div className="mt-8 pt-6 border-t border-[var(--color-border)] text-center">
          <p className="text-sm text-[#D4B896]">
            &copy; {new Date().getFullYear()} Cozy with Anne. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
