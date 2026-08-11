import type { Metadata } from "next";
import AdminPageHeader from "../PageHeader";
import ImportClient from "./ImportClient";

export const metadata: Metadata = { title: "Import products" };

export default function ImportPage() {
  return (
    <>
      <AdminPageHeader
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Import products" }]}
        title="Import products"
        description="Load a supplier CSV or JSON export into the catalogue. Always dry-run an unfamiliar file first."
      />
      <ImportClient />
    </>
  );
}
