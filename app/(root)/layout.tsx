import StorefrontShell from "@/app/components-home/StorefrontShell";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <StorefrontShell>{children}</StorefrontShell>;
}
