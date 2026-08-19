import Link from "next/link";
import { Home, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";

export default function NotFound() {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-5 py-16">
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-texture opacity-40 mask-fade-b" />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 size-[30rem] rounded-full bg-accent/15 blur-[100px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-24 size-[26rem] rounded-full bg-sapphire/15 blur-[100px]"
      />

      <div className="relative mx-auto max-w-lg text-center">
        <Logo className="justify-center" />

        <p className="mt-12 text-[7rem] font-extrabold leading-none tracking-tighter text-gradient-brand sm:text-[9rem]">
          404
        </p>

        <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
          We couldn&apos;t find that page
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          The page you were looking for may have been moved, or the product may no longer be
          part of our catalogue.
        </p>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="accent">
            <Link href="/">
              <Home />
              Back to home
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/products">
              <Package />
              Browse products
            </Link>
          </Button>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          <Link href="/collections" className="text-muted-foreground hover:text-accent">
            Collections
          </Link>
          <Link href="/about" className="text-muted-foreground hover:text-accent">
            About us
          </Link>
          <Link href="/contact" className="text-muted-foreground hover:text-accent">
            Contact
          </Link>
        </div>
      </div>
    </div>
  );
}
