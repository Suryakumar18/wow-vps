import StorefrontShell from "@/app/components-home/StorefrontShell";

/** Policy pages use the same chrome as the rest of the storefront. */
export default function RefundPolicyLayout({ children }: { children: React.ReactNode }) {
  return <StorefrontShell>{children}</StorefrontShell>;
}
