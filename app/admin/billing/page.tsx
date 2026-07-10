import { redirect } from "next/navigation";

export default function BillingIndex() {
  redirect("/admin/billing/dashboard");
}
