import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CategoryShowcaseDTO } from "@/types";

/**
 * The five groups the catalogue is actually organised into, straight from the
 * database — name, count and a photograph of a product that sits in each.
 *
 * This used to be a hardcoded row of five headings (Furniture, Crates & Bins,
 * Household, Industrial, Pallets) linking to categories that never existed, so
 * every card led to an empty result. National Plasto makes none of those:
 * the catalogue is chairs, tables, stools, baby and kids, and storage.
 *
 * A server component — nothing here is interactive, so it costs the client
 * bundle nothing.
 */
export function CollectionsShowcase({
  categories = [],
}: {
  categories?: CategoryShowcaseDTO[];
}) {
  if (categories.length === 0) return null;

  return (
    <section className="py-14 lg:py-20 bg-slate-50 dark:bg-slate-900/60">
      <div className="container-page">
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto">
          <span className="block text-xs font-bold uppercase tracking-widest text-[#c8102e]">
            OUR PRODUCTS
          </span>
          <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-[#0b2545] dark:text-slate-100">
            Engineered for Every Need
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/products?category=${category.slug}`}
              className="group flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.imageAlt ?? category.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 20vw"
                      className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span className="grid h-full place-items-center px-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Photography coming soon
                    </span>
                  )}
                </div>

                <h3 className="mt-4 text-xs font-bold uppercase tracking-wider text-[#0b2545] transition-colors group-hover:text-[#c8102e] dark:text-slate-100">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                    {category.description}
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-[11px] font-semibold tabular-nums text-slate-400 dark:text-slate-500">
                  {category.productCount} products
                </span>
                <span
                  aria-hidden
                  className="grid size-7 place-items-center rounded-full border border-slate-200 text-slate-400 transition-colors group-hover:border-[#c8102e] group-hover:bg-[#c8102e] group-hover:text-white dark:border-slate-700"
                >
                  <ArrowRight className="size-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom Button */}
        <div className="mt-10 text-center">
          <Button
            asChild
            className="bg-[#c8102e] hover:bg-[#a80b24] text-white font-bold text-xs uppercase tracking-wider px-8 py-3 rounded-full shadow-md"
          >
            <Link href="/products">
              VIEW ALL PRODUCTS
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
