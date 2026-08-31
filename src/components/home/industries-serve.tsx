"use client";

import React from "react";
import Image from "next/image";
import { Armchair, Car, PackageCheck, ShoppingCart, Tractor } from "lucide-react";

const INDUSTRIES = [
  {
    title: "Home & Furniture",
    image: "/images/home/ind-home.jpg",
    icon: Armchair,
  },
  {
    title: "Logistics & Storage",
    image: "/images/home/ind-logistics.jpg",
    icon: PackageCheck,
  },
  {
    title: "Automotive",
    image: "/images/home/ind-automotive.jpg",
    icon: Car,
  },
  {
    title: "Retail & Distribution",
    image: "/images/home/ind-retail.jpg",
    icon: ShoppingCart,
  },
  {
    title: "Agriculture",
    image: "/images/home/ind-agriculture.jpg",
    icon: Tractor,
  },
];

export function IndustriesServe() {
  return (
    <section id="industries" className="py-14 lg:py-20 bg-white dark:bg-slate-950">
      <div className="container-page">
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto">
          <span className="block text-xs font-bold uppercase tracking-widest text-[#c8102e]">
            INDUSTRIES WE SERVE
          </span>
        </div>

        {/* 5 Cards Grid */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          {INDUSTRIES.map((ind, idx) => {
            const IconComponent = ind.icon;
            return (
              <div key={idx} className="group text-center">
                {/* Image Container with Overlay Icon */}
                <div className="relative">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100 shadow-sm dark:bg-slate-800">
                    <Image
                      src={ind.image}
                      alt={ind.title}
                      fill
                      sizes="(max-width: 768px) 50vw, 20vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* Overlapping White Circle Icon */}
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 grid size-12 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition-transform duration-300 group-hover:scale-110 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    <IconComponent className="size-6 text-[#c8102e] dark:text-red-400" />
                  </div>
                </div>

                <h3 className="mt-6 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#c8102e] transition-colors">
                  {ind.title}
                </h3>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

