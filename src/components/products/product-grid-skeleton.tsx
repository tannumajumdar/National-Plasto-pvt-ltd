import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ProductGridSkeleton({
  count = 12,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4", className)}
      aria-busy="true"
      aria-label="Loading products"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-3xl bg-card ring-1 ring-border/70 shadow-soft">
          <Skeleton className="aspect-[4/5] rounded-none" />
          <div className="space-y-2.5 p-5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="mt-1 h-5 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
