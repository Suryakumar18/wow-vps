import { notFound } from "next/navigation";
import { prisma } from "@/app/server/prisma";
import AdminPageHeader from "../../PageHeader";
import ProductForm from "../ProductForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [product, categories, brands, subcategories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { position: "asc" } },
        videos: { orderBy: { position: "asc" } },
        socialVideos: { orderBy: { position: "asc" } },
        specifications: { orderBy: { position: "asc" } },
        colors: { orderBy: { position: "asc" } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.subcategory.findMany({ orderBy: { position: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div>
      <AdminPageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Inventory", href: "/admin/products" },
          { label: "Products", href: "/admin/products" },
          { label: product.title },
        ]}
        title="Edit Product"
        description={product.slug}
        backHref="/admin/products"
        showRefresh={false}
      />
      <ProductForm
        categories={categories}
        brands={brands}
        subcategories={subcategories}
        initial={{
          id: product.id,
          slug: product.slug,
          title: product.title,
          price: String(product.price),
          originalPrice: String(product.originalPrice),
          totalStock: String(product.totalStock),
          description: product.description,
          richDescription: product.richDescription,
          categoryId: product.categoryId,
          subcategoryId: product.subcategoryId ?? "",
          brandId: product.brandId,
          isPublished: product.isPublished,
          shippingFee: String(product.shippingFee),
          gstEnabled: product.gstPercent > 0,
          gstPercent: product.gstPercent > 0 ? String(product.gstPercent) : "",
          aboutFeatures: product.aboutFeatures.join("\n"),
          colors: product.colors.map((c) => ({
            name: c.name,
            hex: c.hex,
            images: c.images,
          })),
          idealFor: product.idealFor.join("\n"),
          images: product.images.map((image) => image.url),
          videos: product.videos.map((video) => video.url),
          socialVideos: product.socialVideos.map((v) => ({ url: v.url, title: v.title })),
          specifications: product.specifications.map((s) => `${s.label}: ${s.value}`).join("\n"),
        }}
      />
    </div>
  );
}
