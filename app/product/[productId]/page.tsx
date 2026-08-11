import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductDb, getRelatedDb } from "@/app/server/catalog";
import ProductDetailClient from "./ProductDetailClient";
import { BRAND } from "@/app/seo";

interface Props {
  params: Promise<{ productId: string }>;
}

/**
 * Product detail.
 *
 * The product and its "You May Also Like" strip are both resolved on the
 * server. Previously the page shipped a skeleton, hydrated, fetched the
 * product, and only then fetched the related strip — a three-step waterfall
 * before anything was readable, and an empty document for a crawler indexing
 * three thousand product pages.
 *
 * `getProductDb` is wrapped in React's `cache()`, so the lookup below and the
 * one in `generateMetadata` are a single query per request rather than two.
 *
 * There is deliberately no `loading.tsx` for this route. It would wrap the
 * whole segment in a Suspense boundary, flushing the response status before the
 * page knows whether the product exists — so a dead product URL would render
 * the not-found page under an HTTP 200. Across three thousand products that
 * matters: a soft 404 keeps a removed product indexed and burns crawl budget.
 * The two queries run concurrently instead, which is where the wait went.
 */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productId } = await params;
  const product = await getProductDb(productId);

  if (!product) {
    return { title: "Product not found", robots: { index: false, follow: false } };
  }

  // A product with no copy of its own still needs a description that says
  // what it is and where it ships from, or the search result is a bare title.
  const description = product.description.trim()
    ? product.description.slice(0, 160)
    : `Buy ${product.title} by ${product.brand} at ${BRAND}, Texvalley, Erode. ` +
      `Genuine stock, fast delivery across Tamil Nadu and India.`;

  return {
    title: product.title,
    description,
    alternates: { canonical: `/product/${productId}` },
    openGraph: {
      type: "website",
      title: `${product.title} — ${BRAND}`,
      description,
      url: `/product/${productId}`,
      ...(product.images[0]
        ? { images: [{ url: product.images[0], width: 1000, height: 750, alt: product.title }] }
        : {}),
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { productId } = await params;

  // Concurrent, not sequential: `getRelatedDb` resolves the slug itself and
  // returns nothing for an unknown one, so it doesn't need to wait to find out
  // whether the product exists. Awaiting them in series cost a full extra round
  // trip on every product view.
  const [product, related] = await Promise.all([
    getProductDb(productId),
    getRelatedDb(productId, 8),
  ]);
  if (!product) notFound();

  return (
    <>
      <ProductDetailClient key={productId} product={product} related={related} />
      {/*
        Product structured data. With three thousand products this is what lets
        price, availability and rating appear in a search result rather than a
        bare blue link — and it costs one script tag because the page already
        has every value on the server.
      */}
      <script
        type="application/ld+json"
        // The payload is built here from typed database values, not from
        // anything a visitor supplied.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.title,
            description: product.description,
            image: product.images,
            sku: productId,
            category: product.categoryId,
            brand: { "@type": "Brand", name: product.brand },
            ...(product.numReviews > 0 && product.rating > 0
              ? {
                  aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: product.rating,
                    reviewCount: product.numReviews,
                  },
                }
              : {}),
            offers: {
              "@type": "Offer",
              price: product.price,
              priceCurrency: "INR",
              itemCondition: "https://schema.org/NewCondition",
              url: `/product/${productId}`,
              availability:
                product.totalStock > 0
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
              // Named seller: this is what ties a product result back to the
              // shop entity declared in the root layout.
              seller: { "@type": "Organization", name: BRAND },
            },
          }),
        }}
      />
    </>
  );
}
