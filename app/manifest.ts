import type { MetadataRoute } from "next";
import { BRAND, DESCRIPTION_SHORT } from "./seo";

/**
 * Web app manifest, served at /manifest.webmanifest.
 *
 * What it buys: a shopper who adds the store to their phone's home screen
 * gets the gold monogram and "WOW Lifestyle" rather than a screenshot
 * thumbnail labelled with the bare domain.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND} — Toys, RC Cars & Drones`,
    short_name: BRAND,
    description: DESCRIPTION_SHORT,
    start_url: "/",
    display: "standalone",
    background_color: "#0B0B0B",
    theme_color: "#0B0B0B",
    categories: ["shopping", "kids", "entertainment"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
