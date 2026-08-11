import { prisma } from "@/app/server/prisma";
import { TableCard, Th, Td, EmptyRow } from "../ui";
import AdminPageHeader from "../PageHeader";
import BrandCreateForm from "./BrandCreateForm";
import NamedRowActions from "../NamedRowActions";

export default async function AdminBrandsPage() {
  const brands = await prisma.brand.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <AdminPageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Inventory", href: "/admin/products" },
          { label: "Brands" },
        ]}
        title="Brands"
        description={`${brands.length} brand${brands.length === 1 ? "" : "s"}`}
      />
      <BrandCreateForm />

      <TableCard>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th className="text-right">Products</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {brands.length === 0 ? (
            <EmptyRow colSpan={3}>No brands yet.</EmptyRow>
          ) : (
            brands.map((brand) => (
              <tr key={brand.id}>
                <Td className="font-semibold">{brand.name}</Td>
                <Td className="text-right tabular-nums">{brand._count.products}</Td>
                <Td className="text-right">
                  <NamedRowActions resource="brands" label="brand" id={brand.id} name={brand.name} />
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </TableCard>
    </div>
  );
}
