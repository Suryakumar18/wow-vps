import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./components-home/lib/CartContext";

const inter = Inter({ subsets: ["latin"] });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://wowlifestyle.online";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "WOW Lifestyle Thuriur | Premium Toys & Collectibles",
    template: "%s | WOW Lifestyle Thuriur",
  },
  description:
    "WOW Lifestyle Thuriur – India's premier destination for premium toys, diecast models, RC cars, drones, LEGO, collectibles, and more. Shop online and get fast delivery across India.",
  keywords: [
    "WOW Lifestyle Thuriur",
    "premium toys India",
    "diecast models",
    "RC cars India",
    "LEGO India",
    "toy store Thuriur",
    "collectible toys",
    "Hot Wheels India",
    "drones India",
    "STEM toys",
  ],
  authors: [{ name: "WOW Lifestyle Thuriur" }],
  creator: "WOW Lifestyle Thuriur",
  publisher: "WOW Lifestyle Thuriur",
  category: "shopping",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: APP_URL,
    siteName: "WOW Lifestyle Thuriur",
    title: "WOW Lifestyle Thuriur | Premium Toys & Collectibles",
    description:
      "India's premier destination for premium toys, diecast models, RC cars, drones, LEGO, collectibles, and more. Shop at WOW Lifestyle Thuriur.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "WOW Lifestyle Thuriur – Premium Toys & Collectibles",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WOW Lifestyle Thuriur | Premium Toys & Collectibles",
    description:
      "India's premier destination for premium toys, diecast models, RC cars and more. Shop at WOW Lifestyle Thuriur.",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: APP_URL,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || "",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  // The site always starts light, so the mobile browser chrome must match. Keying
  // this off the OS preference turned the status bar black over a light page.
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* JSON-LD Structured Data for Local Business */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ToyStore",
              name: "WOW Lifestyle Thuriur",
              url: APP_URL,
              logo: "http://200.97.164.140/uploads/brands/wow-logo.svg",
              description:
                "Premium toys, diecast models, RC cars, drones, LEGO, and collectibles. India's premier toy destination.",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Thuriur",
                addressRegion: "Tamil Nadu",
                addressCountry: "IN",
              },
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+919677710045",
                contactType: "customer service",
              },
              sameAs: [],
              openingHoursSpecification: [
                { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "20:00" },
                { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "10:00", closes: "18:00" },
              ],
            }),
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
