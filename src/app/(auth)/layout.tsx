import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Logo } from "@/components/layout/logo";
import { COLLECTION_LIST, SITE } from "@/lib/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Form side */}
      <div className="flex flex-col px-5 py-8 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to store
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-md">{children}</div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {SITE.legalName}
        </p>
      </div>

      {/* Brand side */}
      <aside className="relative hidden overflow-hidden bg-primary lg:block">
        <div aria-hidden className="absolute inset-0 grid-texture opacity-[0.08]" />
        <div
          aria-hidden
          className="absolute -left-32 top-0 size-[34rem] rounded-full bg-accent/25 blur-[110px] animate-aurora"
        />
        <div
          aria-hidden
          className="absolute -bottom-40 -right-20 size-[30rem] rounded-full bg-sapphire/25 blur-[110px] animate-aurora [animation-delay:-8s]"
        />

        <div className="relative flex h-full flex-col justify-between p-16">
          <div />

          <div>
            <h2 className="max-w-md text-4xl font-extrabold leading-tight tracking-tight text-primary-foreground">
              Quality plastic products, designed for modern living
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-primary-foreground/70">
              {SITE.description}
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              {COLLECTION_LIST.map((c) => (
                <span
                  key={c.slug}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold tracking-wide text-primary-foreground backdrop-blur"
                >
                  {c.name}
                </span>
              ))}
            </div>
          </div>

          <p className="text-sm text-primary-foreground/50">
            {SITE.city}, {SITE.state} · {SITE.country}
          </p>
        </div>
      </aside>
    </div>
  );
}
