import StorefrontShell from "@/app/components-home/StorefrontShell";

/** Cart supplies its own compact mobile header, so the site header steps aside below `lg`. */
export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <StorefrontShell hideHeaderBelowLg>{children}</StorefrontShell>;
}
