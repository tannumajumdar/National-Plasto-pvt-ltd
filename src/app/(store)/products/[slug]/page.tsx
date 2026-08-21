import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { ProductDetailsTabs } from "@/components/products/product-details-tabs";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductRail } from "@/components/home/product-rail";
import { PurchasePanel } from "@/components/products/purchase-panel";
import { RatingStars } from "@/components/products/rating-stars";
import { SITE } from "@/lib/constants";
import { absoluteUrl, effectivePrice } from "@/lib/utils";
import {
  getProductBySlug,
  getProductReviews,
  getRelatedProducts,
} from "@/lib/queries/products";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Product not found", robots: { index: false, follow: false } };
  }

  const title = product.metaTitle || `${product.name} — ${product.collection.name} Collection`;
  const description =
    product.metaDescription ||
    product.shortDescription ||
    `${product.name} from the ${product.collection.name} collection by ${SITE.name}, Kolkata. SKU ${product.sku}.`;

  const image = product.images[0]?.url;

  return {
    title,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: absoluteUrl(`/products/${product.slug}`),
      siteName: SITE.name,
      ...(image ? { images: [{ url: image, alt: product.name }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const [reviews, related] = await Promise.all([
    getProductReviews(product.id),
    getRelatedProducts(product.id, product.collection.slug, 10),
  ]);

  const price = effectivePrice(product.price, product.discountPrice);
  const inStock = !product.trackStock || product.stock > 0;

  /* Product structured data. Offers are only emitted when a real price
     exists — publishing a fabricated price would be invalid markup. */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description:
      product.description || product.shortDescription || `${product.name} by ${SITE.name}.`,
    brand: { "@type": "Brand", name: product.collection.name },
    manufacturer: { "@type": "Organization", name: SITE.legalName },
    url: absoluteUrl(`/products/${product.slug}`),
    ...(product.images.length
      ? { image: product.images.map((i) => absoluteUrl(i.url)) }
      : {}),
    ...(price !== null
      ? {
          offers: {
            "@type": "Offer",
            price: (price / 100).toFixed(2),
            priceCurrency: "INR",
            availability: inStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            url: absoluteUrl(`/products/${product.slug}`),
            seller: { "@type": "Organization", name: SITE.legalName },
          },
        }
      : {}),
    ...(product.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.ratingAvg.toFixed(1),
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHeader
        title={product.name}
        crumbs={[
          { label: "Products", href: "/products" },
          { label: product.collection.name, href: `/collections/${product.collection.slug}` },
          { label: product.name },
        ]}
        className="py-8 sm:py-10"
      >
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link href={`/collections/${product.collection.slug}`}>
            <Badge variant={product.collection.accent as "next" | "national" | "sapphire"}>
              {product.collection.name}
            </Badge>
          </Link>
          {product.isNew && <Badge variant="accent">New</Badge>}
          {product.isBestSeller && <Badge>Best Seller</Badge>}
          <RatingStars value={product.ratingAvg} count={product.reviewCount} size="sm" />
          <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
        </div>
      </PageHeader>

      <div className="section-soft container-page py-12 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-20">
          {/* Gallery scrolls; the buying panel stays put beside it. */}
          <div className="lg:sticky lg:top-28">
            <ProductGallery
              name={product.name}
              accent={product.collection.accent}
              images={product.images}
            />
          </div>

          <div className="lg:pt-2">
            <h1 className="display-3 sm:text-4xl">
              {product.name}
            </h1>

            {product.shortDescription ? (
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                {product.shortDescription}
              </p>
            ) : (
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Part of the {product.collection.name} collection from {SITE.name}, Kolkata.
              </p>
            )}

            <div className="mt-8">
              <PurchasePanel product={product} />
            </div>
          </div>
        </div>

        <div className="mt-20 lg:mt-28">
          {/* Review eligibility is resolved client-side so this page stays
              statically cached for SEO rather than becoming per-request. */}
          <ProductDetailsTabs product={product} reviews={reviews} />
        </div>
      </div>

      {related.length > 0 && (
        <ProductRail
          eyebrow={`More from ${product.collection.name}`}
          title="Related products"
          products={related}
          viewAllHref={`/collections/${product.collection.slug}`}
        />
      )}
    </>
  );
}
