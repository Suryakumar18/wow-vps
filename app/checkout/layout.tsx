import StorefrontShell from "@/app/components-home/StorefrontShell";

/** Checkout supplies its own compact mobile header, so the site header steps aside below `lg`. */
export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <StorefrontShell hideHeaderBelowLg>{children}</StorefrontShell>;
}
