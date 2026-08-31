"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaBand({ phone: _phone }: { phone?: string } = {}) {
  return (
    <section className="py-12 lg:py-16 bg-white dark:bg-slate-950">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50 via-slate-100/50 to-blue-50/40 p-8 sm:p-12 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
          <div className="grid items-center gap-8 lg:grid-cols-12">
            {/* Left Content */}
            <div className="lg:col-span-6 xl:col-span-7">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0b2545] dark:text-slate-100 leading-tight">
                Let&apos;s Build Something<br />
                Excellent Together
              </h2>

              <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">
                Connect with us for your plastic moulding requirements.
              </p>

              <div className="mt-6">
                <Button
                  asChild
                  className="bg-[#c8102e] hover:bg-[#a80b24] text-white font-bold text-xs uppercase tracking-wider px-7 py-3 rounded-full shadow-md"
                >
                  <Link href="/contact">
                    CONTACT US
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Image */}
            <div className="lg:col-span-6 xl:col-span-5 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md overflow-hidden rounded-xl bg-white p-2 shadow-md dark:bg-slate-900">
                <Image
                  src="/images/home/cta-products.jpg"
                  alt="NPPL Products Composite — Let's Build Something Excellent Together"
                  width={500}
                  height={250}
                  className="h-auto w-full object-cover rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
