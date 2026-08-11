import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/app/server/auth";
import AdminShell from "./AdminShell";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  // One portal: a signed-out visitor and a signed-in customer both land on the
  // same /login, which then routes an admin back here.
  if (!admin) redirect("/login");

  return <AdminShell admin={admin}>{children}</AdminShell>;
}
