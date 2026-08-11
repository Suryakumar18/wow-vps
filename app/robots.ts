import type { MetadataRoute } from "next";
import { isPubliclyIndexable, siteUrl } from "@/app/server/env";

/**
 * Robots policy.
 *
 * Preview and localhost deployments are disallowed outright — a staging copy of
 * three thousand product pages getting indexed alongside the real store is
 * duplicate content that's tedious to undo.
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();

  if (!isPubliclyIndexable()) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          // Session-specific pages with nothing to index, and search result
          // pages, which are thin duplicates of the departments they draw from.
          "/cart",
          "/checkout",
          "/orders",
          "/wishlist",
          "/login",
          "/register",
          "/*?q=",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
