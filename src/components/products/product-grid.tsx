"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { PackageSearch } from "lucide-react";

import { ProductCard } from "@/components/products/product-card";
import { QuickViewDialog } from "@/components/products/quick-view-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { EASE } from "@/components/animations/motion-primitives";
import { cn } from "@/lib/utils";
import type { ProductCardDTO } from "@/types";

export function ProductGrid({
  products,
  className,
  emptyTitle = "No products match those filters",
  emptyDescription = "Try widening your price range or clearing a filter or two.",
}: {
  products: ProductCardDTO[];
  className?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const [quickView, setQuickView] = React.useState<ProductCardDTO | null>(null);

  if (products.length === 0) {
    return (
      <EmptyState
        icon={PackageSearch}
        title={emptyTitle}
        description={emptyDescription}
        action={{ label: "View all products", href: "/products" }}
      />
    );
  }

  return (
    <>
      <div
        className={cn(
          "grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4",
          className,
        )}
      >
        {products.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.45,
              // Stagger only the first screenful; later rows appear immediately
              // so deep pagination never feels sluggish.
              delay: Math.min(i, 7) * 0.05,
              ease: EASE,
            }}
          >
            <ProductCard product={product} onQuickView={setQuickView} priority={i < 4} />
          </motion.div>
        ))}
      </div>

      <QuickViewDialog
        product={quickView}
        open={quickView !== null}
        onOpenChange={(open) => !open && setQuickView(null)}
      />
    </>
  );
}
