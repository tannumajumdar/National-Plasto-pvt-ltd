import { ProductGridSkeleton } from "@/components/products/product-grid-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsLoading() {
  return (
    <>
      <div className="border-b border-border bg-secondary/40 py-14">
        <div className="container-page">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mt-5 h-10 w-64" />
          <Skeleton className="mt-4 h-4 w-full max-w-2xl" />
        </div>
      </div>

      <div className="container-page py-10 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[16rem_1fr] xl:gap-12">
          <div className="hidden space-y-6 lg:block">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            ))}
          </div>
          <div>
            <div className="mb-7 flex items-center justify-between">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-11 w-52 rounded-xl" />
            </div>
            <ProductGridSkeleton />
          </div>
        </div>
      </div>
    </>
  );
}
