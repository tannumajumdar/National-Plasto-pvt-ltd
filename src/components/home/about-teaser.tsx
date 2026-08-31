"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AboutTeaser() {
  return (
    <section className="py-14 lg:py-20 overflow-hidden bg-white dark:bg-slate-950">
      <div className="container-page">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          {/* Left Text */}
          <div className="lg:col-span-5">
            <span className="block text-xs font-bold uppercase tracking-widest text-[#c8102e]">
              ABOUT NPPL
            </span>

            <h2 className="mt-2 text-3xl font-extrabold leading-tight text-[#0b2545] sm:text-4xl dark:text-slate-100">
              Shaping Ideas.<br />
              <span className="text-[#c8102e]">Moulding Excellence.</span>
            </h2>

            <p className="mt-5 text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
              National Plastic Moulded Products Limited (NPPL) is a trusted name
              in the plastic moulding industry. With decades of expertise, we
              deliver innovative and customized solutions that meet global
              standards.
            </p>

            <div className="mt-8">
              <Button
                asChild
                className="bg-[#c8102e] hover:bg-[#a80b24] text-white font-bold text-xs uppercase tracking-wider px-7 py-3 rounded-full shadow-md"
              >
                <Link href="/about">
                  KNOW MORE
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Image with diagonal left edge */}
          <div className="lg:col-span-7 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-2xl overflow-hidden rounded-xl shadow-xl">
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src="/images/home/about-building.jpg"
                  alt="NPPL Factory Building — Shaping Ideas, Moulding Excellence"
                  fill
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
