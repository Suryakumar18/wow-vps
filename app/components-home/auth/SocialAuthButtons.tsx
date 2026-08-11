"use client";

/**
 * Google and Apple sign-in, side by side under an "or continue with" rule.
 *
 * The marks are inline SVG: the artifact/CSP-safe route, and it keeps the
 * buttons from depending on any external asset. There is no identity provider
 * wired up in this build, so `onSelect` is where a real OAuth redirect goes.
 */
export default function SocialAuthButtons({
  onSelect,
}: {
  onSelect?: (provider: "google" | "apple") => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        <span className="text-nano text-slate-400">or continue with</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onSelect?.("google")}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-line bg-white text-micro font-semibold text-ink transition-colors hover:border-gold-300 hover:bg-mist focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600"
        >
          <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62Z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86a5.4 5.4 0 0 1-5.07-3.73H.96v2.34A8.99 8.99 0 0 0 9 18Z" />
            <path fill="#FBBC05" d="M3.93 10.69a5.4 5.4 0 0 1 0-3.38V4.96H.96a9 9 0 0 0 0 8.08l2.97-2.35Z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A8.99 8.99 0 0 0 .96 4.96l2.97 2.35A5.4 5.4 0 0 1 9 3.58Z" />
          </svg>
          Google
        </button>

        <button
          type="button"
          onClick={() => onSelect?.("apple")}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-line bg-white text-micro font-semibold text-ink transition-colors hover:border-gold-300 hover:bg-mist focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.05 12.72c.02 2.6 2.28 3.46 2.31 3.47-.02.06-.36 1.24-1.2 2.45-.72 1.05-1.47 2.1-2.65 2.12-1.16.02-1.53-.69-2.86-.69-1.32 0-1.74.67-2.83.71-1.14.04-2.01-1.13-2.74-2.18-1.5-2.16-2.64-6.11-1.1-8.79.76-1.33 2.12-2.17 3.6-2.19 1.12-.02 2.17.75 2.86.75.68 0 1.97-.93 3.32-.79.57.02 2.16.21 3.18 1.56-.08.05-1.9 1.11-1.89 3.58M14.9 4.5c.61-.74 1.02-1.77.91-2.79-.9.04-1.98.6-2.61 1.33-.57.65-1.06 1.7-.93 2.7 1 .08 1.99-.51 2.63-1.24" />
          </svg>
          Apple
        </button>
      </div>
    </div>
  );
}
