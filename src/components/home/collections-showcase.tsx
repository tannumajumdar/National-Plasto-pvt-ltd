"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CollectionDTO, ProductCardDTO } from "@/types";

const CATEGORIES = [
  {
    title: "FURNITURE",
    subtitle: "Chairs, Tables, Stools & more.",
    image: "/images/home/cat-furniture.jpg",
    href: "/products?category=furniture",
  },
  {
    title: "CRATES & BINS",
    subtitle: "Storage & handling solutions.",
    image: "/images/home/cat-crates.jpg",
    href: "/products?category=crates",
  },
  {
    title: "HOUSEHOLD PRODUCTS",
    subtitle: "Buckets, Mugs, Dustbins & much more.",
    image: "/images/home/cat-household.jpg",
    href: "/products?category=household",
  },
  {
    title: "INDUSTRIAL COMPONENTS",
    subtitle: "Precision components for various applications.",
    image: "/images/home/cat-industrial.jpg",
    href: "/products?category=industrial",
  },
  {
    title: "PALLETS",
    subtitle: "Strong & durable pallets for industrial use.",
    image: "/images/home/cat-pallets.jpg",
    href: "/products?category=pallets",
  },
];

export function CollectionsShowcase({
  collections: _collections,
  previews: _previews,
}: {
  collections?: CollectionDTO[];
  previews?: Record<string, ProductCardDTO | undefined>;
} = {}) {
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

        {/* 5 Cards Grid */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {CATEGORIES.map((cat, idx) => (
            <Link
              key={idx}
              href={cat.href}
              className="group flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                  <Image
                    src={cat.image}
                    alt={cat.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 20vw"
                    className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                <h3 className="mt-4 text-xs font-bold uppercase tracking-wider text-[#0b2545] dark:text-slate-100 group-hover:text-[#c8102e] transition-colors">
                  {cat.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2 dark:text-slate-400">
                  {cat.subtitle}
                </p>
              </div>

              <div className="mt-4 flex justify-end">
                <span className="grid size-7 place-items-center rounded-full border border-slate-200 text-slate-400 group-hover:border-[#c8102e] group-hover:bg-[#c8102e] group-hover:text-white transition-colors dark:border-slate-700">
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
