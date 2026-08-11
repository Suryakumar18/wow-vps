import type { NextConfig } from "next";

/**
 * Extra image hosts, from `IMAGE_HOSTS`.
 *
 * A catalogue of three thousand products rarely has all its photography on one
 * origin — some comes from the supplier, some from whatever CDN gets set up
 * later. Adding a host shouldn't mean a code change and a redeploy of this
 * file, so the list is environment-driven:
 *
 *   IMAGE_HOSTS="cdn.example.com,https://res.cloudinary.com,*.supabase.co"
 *
 * Bare hostnames are assumed to be HTTPS. Anything unparseable is dropped with
 * a warning rather than failing the build, because a typo here should not be
 * able to take a deploy down.
 */
function envImageHosts(): { protocol: "http" | "https"; hostname: string }[] {
  return (process.env.IMAGE_HOSTS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .flatMap((entry) => {
      try {
        const url = new URL(entry.includes("://") ? entry : `https://${entry}`);
        const protocol = url.protocol.replace(":", "");
        if (protocol !== "http" && protocol !== "https") throw new Error("unsupported protocol");
        return [{ protocol, hostname: url.hostname }];
      } catch {
        console.warn(`next.config: ignoring unparseable IMAGE_HOSTS entry "${entry}"`);
        return [];
      }
    });
}

/**
 * Headers applied to every response.
 *
 * No Content-Security-Policy here on purpose. A useful one for this app needs
 * per-request nonces threaded through Next's own inline bootstrap scripts via
 * middleware; a hand-written static policy would either be loose enough to be
 * decorative or tight enough to break checkout on a page nobody retested. The
 * headers below are the ones that are unambiguously safe to set globally.
 */
const securityHeaders = [
  // Stops a browser from second-guessing a declared Content-Type — the usual
  // route from "user uploaded a file" to "browser executed a script".
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Nothing here is meant to be framed; this is the clickjacking defence.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Send the full URL to ourselves, only the origin to anyone else, so product
  // and order URLs don't leak into third-party analytics as referrers.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The storefront asks for none of these.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  // Two years, subdomains included. Only ever honoured over HTTPS, so it's
  // inert during local development.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // Hostinger VPS uploads — nginx serves /var/www/uploads at /uploads/*.
      //
      // Note this is plain HTTP from a bare IP: once the storefront is served
      // over HTTPS, browsers will block these as mixed content, and there's no
      // CDN in front of them. Put the VPS behind a domain with TLS, or move
      // product images to a CDN and add it via IMAGE_HOSTS.
      { protocol: "http", hostname: "200.97.164.140" },
      // The store's own domain — nginx serves /uploads/* there over TLS, and
      // the upload API hands out these https URLs in production.
      { protocol: "https", hostname: "wowlifestyle.online" },
      ...envImageHosts(),
    ],
    // AVIF first, WebP second, original as the fallback. On a page of 24
    // product tiles this is the single largest byte saving available.
    formats: ["image/avif", "image/webp"],
    // Optimised derivatives are immutable in practice — a product photo that
    // changes gets a new URL. The default 60s means re-optimising the same
    // three thousand images over and over.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Trimmed to the widths this design actually requests. Every entry left in
    // is another derivative the optimiser may be asked to generate and store.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [96, 160, 256, 384],
    // Product imagery is remote and untrusted; SVG can carry script.
    dangerouslyAllowSVG: false,
  },

  // ssh2 ships a native binary (sshcrypto.node) that webpack can't bundle —
  // keep it a real Node `require()` at runtime rather than pushing it through
  // the webpack module graph, or `next build` fails.
  serverExternalPackages: ["ssh2"],

  experimental: {
    // lucide-react exports a thousand icons from one barrel file. Without this
    // a single icon import pulls the whole barrel into the module graph.
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },

  /**
   * Build output directory.
   *
   * Overridable so a verification build can be run against `.next-verify`
   * without clobbering the `.next` that a running `npm run dev` is serving from
   * — otherwise checking that the app builds takes the dev server down.
   */
  distDir: process.env.NEXT_DIST_DIR || ".next",

  compress: true,
  // Nothing gains from advertising the framework and version.
  poweredByHeader: false,
  // Trailing-slash redirects cost a round trip on a cold link.
  skipTrailingSlashRedirect: true,

  /**
   * Set `BUILD_STANDALONE=1` to emit `.next/standalone` — a self-contained
   * server plus only the node_modules it actually uses. That's what a Docker
   * image or the Hostinger VPS needs; Vercel builds fine either way, so this
   * stays opt-in rather than costing every build the extra trace.
   */
  output: process.env.BUILD_STANDALONE === "1" ? "standalone" : undefined,

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Next's own hashed build assets are content-addressed and safe to
        // cache forever.
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
