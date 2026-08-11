import StorefrontShell from "@/app/components-home/StorefrontShell";

/** Category pages use the same chrome as the homepage. */
export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return <StorefrontShell>{children}</StorefrontShell>;
}
