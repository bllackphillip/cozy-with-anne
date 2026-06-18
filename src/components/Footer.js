import Link from "next/link";

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
          {/* Brand Section */}
          <div>
            <h3 className="text-lg font-semibold text-[#FAF6F0]">
              Cozy with Anne
            </h3>
            <p className="mt-2 text-sm text-[#E8D8D0]">
              Original oil paintings, digital art, prints & stickers made with
              love.
            </p>
            {/* Policy links */}
            <div className="mt-4 flex flex-col gap-2 items-start">
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
              <a
                href="https://www.instagram.com/cozywith.anne?igsh=YW1mMXM1cDBlZXI2"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#E8D8D0] hover:text-[#FAF6F0] transition-colors inline-flex items-center gap-2"
              >
                {/* Instagram icon */}
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8504.6151 19.0872.32 18.2143.1197 16.9366.0633 15.6588.0069 15.2479-.0067 11.9999.0001 8.7521.0069 8.3426.0205 7.0695.0838L7.0301.084zm.2138 21.8318c-1.1752-.0539-1.8142-.2502-2.2388-.4158-.5628-.2187-.9645-.4801-1.3867-.9017-.4234-.4247-.684-.8264-.904-1.3882-.1659-.4239-.363-1.0634-.4149-2.2389-.0564-1.2709-.0681-1.6529-.0633-4.8717.0048-3.2188.0189-3.5983.0779-4.8686.0544-1.1753.2519-1.8138.417-2.2387.2192-.5631.4804-.9648.9024-1.3871.4222-.4224.8233-.6834 1.3863-.9035.4232-.1654 1.0621-.3629 2.2377-.4158 1.2708-.0571 1.6523-.069 4.8728-.0633 3.2204.0058 3.5999.0189 4.8686.0783 1.1753.0545 1.8137.2524 2.2386.4172.5629.2192.9643.4798 1.3866.9023.4226.4222.6844.823.9038 1.3862.1653.4233.3625 1.0625.4155 2.2381.0571 1.2715.0684 1.6525.0638 4.8721-.0048 3.2197-.0189 3.5988-.0784 4.8689-.0543 1.1752-.2525 1.8139-.4167 2.2389-.2188.5628-.4798.9643-.9023 1.3865-.4222.4224-.8235.6842-1.3862.9037-.4232.1654-1.0621.363-2.2374.4157-1.2704.0572-1.6523.069-4.8713.0634-3.219-.0058-3.5992-.0189-4.8692-.0784l-.0016-.0012zm9.74-17.3917a1.596 1.596 0 0 0-1.123.4652 1.596 1.596 0 0 0-.4652 1.1232 1.596 1.596 0 0 0 .4652 1.1233 1.596 1.596 0 0 0 1.123.4651 1.5968 1.5968 0 0 0 1.5884-1.5884 1.5968 1.5968 0 0 0-1.5884-1.5884zm-4.9492 1.7168c-3.299 0-5.9732 2.6743-5.9732 5.9734 0 3.2992 2.6742 5.9732 5.9732 5.9732 3.2992 0 5.9734-2.674 5.9734-5.9732s-2.6742-5.9734-5.9734-5.9734zm0 2.166a3.8074 3.8074 0 0 1 3.8074 3.8074 3.8074 3.8074 0 0 1-3.8074 3.8074 3.8074 3.8074 0 0 1-3.8074-3.8074 3.8074 3.8074 0 0 1 3.8074-3.8074z" />
                </svg>
                Instagram
              </a>
              <a
                href="https://www.tiktok.com/@cozywithanne?_r=1&_t=ZG-93zkk6p3WJl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#E8D8D0] hover:text-[#FAF6F0] transition-colors inline-flex items-center gap-2"
              >
                {/* TikTok icon */}
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
                TikTok
              </a>
              <a
                href="https://nl.pinterest.com/cozywithane/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#E8D8D0] hover:text-[#FAF6F0] transition-colors inline-flex items-center gap-2"
              >
                {/* Pinterest icon */}
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
                </svg>
                Pinterest
              </a>
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
