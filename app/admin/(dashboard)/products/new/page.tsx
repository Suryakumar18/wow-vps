import { prisma } from "@/app/server/prisma";
import AdminPageHeader from "../../PageHeader";
import ProductForm from "../ProductForm";

export default async function NewProductPage() {
  const [categories, brands, subcategories] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.subcategory.findMany({ orderBy: { position: "asc" } }),
  ]);

  return (
    <div>
      <AdminPageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Inventory", href: "/admin/products" },
          { label: "Products", href: "/admin/products" },
          { label: "Add Product" },
        ]}
        title="Add Product"
        description="Create a new catalogue entry."
        backHref="/admin/products"
        showRefresh={false}
      />
      <ProductForm
        categories={categories}
        brands={brands}
        subcategories={subcategories}
        initial={{
          slug: "",
          title: "",
          price: "",
          originalPrice: "",
          totalStock: "0",
          description: "",
          richDescription: "",
          categoryId: "",
          subcategoryId: "",
          brandId: "",
          isPublished: true,
          shippingFee: "0",
          gstEnabled: false,
          gstPercent: "",
          aboutFeatures: "",
          colors: [],
          idealFor: "",
          images: [],
          videos: [],
          socialVideos: [],
          specifications: "",
        }}
      />
    </div>
  );
}
