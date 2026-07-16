import type { Metadata } from "next";
import AdminAuthGuard from "./AdminAuthGuard";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: {
    default: "Admin | WOW Lifestyle",
    template: "%s | WOW Admin",
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminAuthGuard>{children}</AdminAuthGuard>;
}
