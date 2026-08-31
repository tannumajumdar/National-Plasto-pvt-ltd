"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-slate-100/60 to-blue-50/50 py-12 lg:py-16">
      <div className="container-page">
        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Left Column Text & Action */}
          <div className="lg:col-span-6 xl:col-span-5 text-center lg:text-left">
            <span className="block text-xs sm:text-sm font-bold uppercase tracking-widest text-[#c8102e]">
              EXCELLENCE IN
            </span>

            <h1 className="mt-2 text-3xl font-black leading-none tracking-tight text-[#0b2545] sm:text-5xl lg:text-6xl uppercase">
              PLASTIC<br />
              MOULDED<br />
              PRODUCTS
            </h1>

            <p className="mt-4 max-w-lg text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300 mx-auto lg:mx-0">
              Delivering precision-engineered plastic solutions that combine
              durability, functionality and a touch of elegance.
            </p>

            <div className="mt-3 font-serif italic text-xl sm:text-2xl font-medium text-[#c8102e]">
              Touch of Elegance
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <Button
                asChild
                className="bg-[#c8102e] hover:bg-[#a80b24] text-white font-bold text-xs sm:text-sm uppercase tracking-wider px-7 py-3 rounded-full shadow-md"
              >
                <Link href="/products">
                  EXPLORE PRODUCTS
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="border-2 border-[#c8102e] text-[#c8102e] hover:bg-[#c8102e] hover:text-white font-bold text-xs sm:text-sm uppercase tracking-wider px-7 py-3 rounded-full transition-colors"
              >
                <Link href="/about">ABOUT US</Link>
              </Button>
            </div>

            {/* Pagination Dots */}
            <div className="mt-10 flex items-center justify-center lg:justify-start gap-2">
              <span className="size-2.5 rounded-full bg-[#c8102e]" />
              <span className="size-2.5 rounded-full bg-[#155eef]" />
              <span className="size-2.5 rounded-full bg-[#0b2545]" />
            </div>
          </div>

          {/* Right Column Product Image */}
          <div className="lg:col-span-6 xl:col-span-7 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white p-2 shadow-lg ring-1 ring-slate-900/5">
              <Image
                src="/images/home/hero-products.jpg"
                alt="NPPL Plastic Moulded Products — Chairs, Crates, Buckets and Trays"
                width={800}
                height={580}
                priority
                className="h-auto w-full object-cover rounded-xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
