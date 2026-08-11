import "server-only";

/**
 * Environment configuration, checked once at startup.
 *
 * The failure this prevents: the app boots fine without `ADMIN_AUTH_SECRET`,
 * serves the storefront, and only falls over when someone tries to log in — in
 * production, hours after the deploy looked successful. Anything the app cannot
 * function without is asserted here, at import time, so a misconfigured deploy
 * fails immediately and says what's missing.
 */

/** Required everywhere, including at build time. */
const REQUIRED = ["DATABASE_URL"] as const;

/** Required to serve traffic, but not to run `next build`. */
const REQUIRED_AT_RUNTIME = ["ADMIN_AUTH_SECRET"] as const;

/**
 * `next build` renders pages without a full runtime environment, and a build
 * machine legitimately has no session secret. Only enforce the runtime set when
 * actually serving.
 */
const isBuild = process.env.NEXT_PHASE === "phase-production-build";

function assertEnv() {
  const missing = [
    ...REQUIRED.filter((key) => !process.env[key]),
    ...(isBuild ? [] : REQUIRED_AT_RUNTIME.filter((key) => !process.env[key])),
  ];

  if (missing.length) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}.\n` +
        "Set them in .env for local development, or in the host's environment settings for a deploy.",
    );
  }

  const secret = process.env.ADMIN_AUTH_SECRET;
  if (secret && secret.length < 32 && process.env.NODE_ENV === "production") {
    throw new Error(
      "ADMIN_AUTH_SECRET is shorter than 32 characters. It signs every customer and admin " +
        "session; generate a long random value with `openssl rand -base64 48`.",
    );
  }
}

assertEnv();

/**
 * The site's public origin, used for canonical URLs, the sitemap and robots.
 *
 * Falls back to Vercel's own deployment URL, then to localhost, so none of
 * those files break before a domain is configured — but set `SITE_URL`
 * explicitly in production, or canonical tags will point at a preview
 * deployment instead of the real store.
 */
export function siteUrl(): string {
  // `NEXT_PUBLIC_APP_URL` first: it's the variable `app/layout.tsx` already
  // uses for `metadataBase`, and two different answers to "what is this site's
  // address" is how canonical tags end up disagreeing with the sitemap.
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  return "http://localhost:3000";
}

/**
 * Whether crawlers should be let in at all.
 *
 * Checked against the deployment, not just the URL: a preview build often
 * inherits the production `NEXT_PUBLIC_APP_URL` from project-level settings, so
 * trusting the URL alone would hand a preview deployment a permissive
 * robots.txt and let a second copy of the whole catalogue get indexed.
 */
export function isPubliclyIndexable(): boolean {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") return false;
  if (process.env.NODE_ENV !== "production") return false;

  const url = siteUrl();
  return !url.includes("localhost") && !url.includes(".vercel.app");
}
