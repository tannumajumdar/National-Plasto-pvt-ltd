"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Surfaced in the server logs / browser console for diagnosis.
    console.error("[app] unhandled error:", error);
  }, [error]);

  return (
    <div className="grid min-h-[70vh] place-items-center px-5 py-16">
      <div className="mx-auto max-w-lg text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-destructive/12">
          <AlertTriangle className="size-8 text-destructive" />
        </span>

        <h1 className="mt-7 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Something went wrong
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          An unexpected error stopped this page from loading. Trying again often resolves it.
          If it keeps happening, please get in touch.
        </p>

        {error.digest && (
          <p className="mt-4 font-mono text-xs text-muted-foreground/70">
            Reference: {error.digest}
          </p>
        )}

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button variant="accent" onClick={reset}>
            <RotateCcw />
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <Home />
              Back to home
            </Link>
          </Button>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Still stuck?{" "}
          <Link href="/contact" className="font-semibold text-foreground hover:text-accent">
            Contact our team
          </Link>
        </p>
      </div>
    </div>
  );
}
