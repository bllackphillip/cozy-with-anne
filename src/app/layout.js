import { Geist, Dancing_Script, Fraunces } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import SiteChrome from "@/components/SiteChrome";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Cozy with Anne | Original Art, Prints & Stickers",
  description:
    "Discover original oil paintings, digital art, custom prints and stickers by Anne.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Read theme from localStorage before React hydrates — prevents flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('cwa-theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}})()`,
          }}
        />
      </head>
      {/* min-h-screen = minimum full viewport height */}
      {/* flex flex-col = vertical flex so footer can stick to bottom via mt-auto */}
      <body className={`${geistSans.variable} ${dancingScript.variable} ${fraunces.variable} font-sans min-h-screen flex flex-col antialiased`}>
        <Providers>
          <SiteChrome>{children}</SiteChrome>
        </Providers>
      </body>
    </html>
  );
}
