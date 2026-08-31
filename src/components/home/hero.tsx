"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-white via-[#f4f5f8] to-[#e8ebf0] pt-10 pb-14 lg:pt-14 lg:pb-16">
      {/* Background Graphic - Matching Architectural Factory Glass Window Structure */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        {/* Soft background base matching hero image studio lighting */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-[#f3f5f8] to-[#e6eaf0]" />

        {/* Diagonal Architectural Window Lines */}
        <svg
          className="absolute inset-0 h-full w-full opacity-60"
          preserveAspectRatio="none"
          viewBox="0 0 1440 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 140 L1440 90 L1440 340 L0 380 Z"
            fill="url(#arch_factory_band)"
            opacity="0.4"
          />
          <line x1="300" y1="60" x2="180" y2="440" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.5" />
          <line x1="540" y1="60" x2="420" y2="440" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.4" />
          <line x1="780" y1="60" x2="660" y2="440" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.4" />
          <line x1="1020" y1="60" x2="900" y2="440" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.3" />
          <line x1="1260" y1="60" x2="1140" y2="440" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.3" />
          <line x1="0" y1="140" x2="1440" y2="90" stroke="#94a3b8" strokeWidth="1.5" opacity="0.35" />
          <line x1="0" y1="380" x2="1440" y2="340" stroke="#94a3b8" strokeWidth="1.5" opacity="0.35" />

          <defs>
            <linearGradient id="arch_factory_band" x1="0" y1="100" x2="1440" y2="300" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="0.5" stopColor="#e2e8f0" stopOpacity="0.5" />
              <stop offset="1" stopColor="#f1f5f9" stopOpacity="0.6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Studio Floor reflection blend at bottom */}
        <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-[#cbd5e1]/40 via-[#f1f5f9]/20 to-transparent" />
      </div>

      <div className="container-page relative z-10">
        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left Column Text & Action */}
          <div className="lg:col-span-5 xl:col-span-5 text-center lg:text-left z-10">
            <span className="block text-xs sm:text-sm font-bold uppercase tracking-widest text-[#c8102e]">
              EXCELLENCE IN
            </span>

            <h1 className="mt-1.5 text-3xl sm:text-4xl lg:text-[48px] xl:text-[54px] font-black leading-[1.04] tracking-tight text-[#0b2545] uppercase">
              PLASTIC<br />
              MOULDED<br />
              PRODUCTS
            </h1>

            <p className="mt-3.5 max-w-md text-xs sm:text-sm leading-relaxed text-slate-600 mx-auto lg:mx-0 font-medium">
              Delivering precision-engineered plastic solutions that combine
              durability, functionality and a touch of elegance.
            </p>

            <div className="mt-3 font-serif italic text-lg sm:text-xl font-medium text-[#c8102e]">
              Touch of Elegance
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <Button
                asChild
                className="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-extrabold text-xs uppercase tracking-wider px-7 py-3 rounded-lg shadow-md hover:shadow-lg transition-all border border-[#dc2626]"
              >
                <Link href="/products">
                  EXPLORE PRODUCTS
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="border-2 border-[#1b365d] text-[#1b365d] bg-white hover:bg-slate-50 font-extrabold text-xs uppercase tracking-wider px-7 py-3 rounded-lg transition-all shadow-sm"
              >
                <Link href="/about">ABOUT US</Link>
              </Button>
            </div>

            {/* Pagination Dots positioned inside left text column matching reference design */}
            <div className="mt-8 flex items-center justify-center lg:justify-start gap-2">
              <span className="size-2.5 rounded-full bg-[#c8102e]" />
              <span className="size-2.5 rounded-sm bg-[#155eef]" />
              <span className="size-2.5 rounded-full bg-[#0b2545]" />
            </div>
          </div>

          {/* Right Column Product Image — Zoomed in while maintaining 100% background merge */}
          <div className="lg:col-span-7 xl:col-span-7 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-xl lg:max-w-2xl xl:max-w-3xl transform-gpu scale-105 sm:scale-110 lg:scale-115 origin-center lg:origin-right">
              <Image
                src="/images/home/hero-products-feathered.png"
                alt="NPPL Plastic Moulded Products — Chairs, Crates, Buckets and Trays"
                width={900}
                height={650}
                priority
                className="h-auto w-full object-contain mix-blend-multiply"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
