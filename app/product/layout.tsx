import StorefrontShell from "@/app/components-home/StorefrontShell";

/**
 * Product pages share the storefront chrome, but supply their own compact
 * mobile header (back / title / share / wishlist), so the site header is
 * suppressed below `lg`.
 */
export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <StorefrontShell hideHeaderBelowLg>{children}</StorefrontShell>;
}
