"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EASE } from "@/components/animations/motion-primitives";

export function CtaBand({ phone }: { phone: string }) {
  return (
    <section className="container-page pb-8">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.65, ease: EASE }}
        className="relative overflow-hidden rounded-3xl bg-linear-to-br from-national-deep via-national to-accent px-8 py-14 text-center shadow-float sm:px-14 sm:py-20"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 grid-texture opacity-10" />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-white/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -right-16 size-96 rounded-full bg-black/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.6rem]">
            Looking for a product, price or bulk enquiry?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/85">
            Browse the full National Plasto catalogue, or talk to our team in Kolkata about
            pricing, availability and bulk orders.
          </p>

          <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="group bg-white text-primary hover:bg-white/92">
              <Link href="/products">
                Browse Products
                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/35 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:border-white/50"
            >
              <Link href="/contact">
                <Phone />
                Contact Us
              </Link>
            </Button>
          </div>

          {phone.replace(/[^\d]/g, "").replace(/0+/g, "") !== "" && (
            <p className="mt-6 text-sm text-white/75">
              Or call us directly at{" "}
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="font-semibold underline underline-offset-4">
                {phone}
              </a>
            </p>
          )}
        </div>
      </motion.div>
    </section>
  );
}
