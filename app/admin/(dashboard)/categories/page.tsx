import { prisma } from "@/app/server/prisma";
import { TableCard, Th, Td, Tr, EmptyRow } from "../ui";
import AdminPageHeader from "../PageHeader";
import CategoryCreateForm from "./CategoryCreateForm";
import NamedRowActions from "../NamedRowActions";
import SubcategoryManager from "./SubcategoryManager";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { products: true } },
      subcategories: {
        orderBy: { position: "asc" },
        include: { _count: { select: { products: true } } },
      },
    },
    orderBy: { position: "asc" },
  });

  const subcategoryTotal = categories.reduce((n, c) => n + c.subcategories.length, 0);

  return (
    <div>
      <AdminPageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Inventory", href: "/admin/products" },
          { label: "Categories" },
        ]}
        title="Categories"
        description={`${categories.length} categor${categories.length === 1 ? "y" : "ies"} · ${subcategoryTotal} subcategor${subcategoryTotal === 1 ? "y" : "ies"}`}
      />
      <CategoryCreateForm />

      <TableCard>
        <thead>
          <tr>
            <Th>Category</Th>
            <Th>Slug</Th>
            <Th>Subcategories</Th>
            <Th className="text-right">Products</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {categories.length === 0 ? (
            <EmptyRow colSpan={5}>No categories yet.</EmptyRow>
          ) : (
            categories.map((category) => (
              <Tr key={category.id}>
                <Td className="font-semibold align-top">{category.name}</Td>
                <Td className="text-slate-500 align-top">{category.slug}</Td>
                <Td className="align-top">
                  <SubcategoryManager
                    categoryId={category.id}
                    categoryName={category.name}
                    initial={category.subcategories.map((sub) => ({
                      id: sub.id,
                      name: sub.name,
                      slug: sub.slug,
                      productCount: sub._count.products,
                    }))}
                  />
                </Td>
                <Td className="text-right tabular-nums align-top">{category._count.products}</Td>
                <Td className="text-right align-top">
                  <NamedRowActions
                    resource="categories"
                    label="category"
                    id={category.id}
                    name={category.name}
                  />
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </TableCard>
    </div>
  );
}
