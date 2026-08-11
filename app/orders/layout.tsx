import StorefrontShell from "@/app/components-home/StorefrontShell";

/** Orders screens supply their own compact mobile header, so the site header steps aside below `lg`. */
export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return <StorefrontShell hideHeaderBelowLg>{children}</StorefrontShell>;
}
