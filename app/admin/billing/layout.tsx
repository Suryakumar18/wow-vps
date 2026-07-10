import React from "react";
import BillingShell from "./BillingShell";

/*
 * Real Next.js layout for every /admin/billing/* page — the billing sidebar
 * and topbar now mount once and persist across navigations within this
 * section instead of remounting on every page change.
 */
export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return <BillingShell>{children}</BillingShell>;
}
