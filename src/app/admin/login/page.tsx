import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { Logo } from "@/components/layout/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth/session";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Admin Sign In",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  // An admin who is already signed in skips the form entirely.
  const user = await getCurrentUser();
  if (user?.role === "ADMIN") redirect("/admin");

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-brand px-5 py-12">
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-texture opacity-[0.08]" />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 size-[34rem] rounded-full bg-accent/20 blur-[110px] animate-aurora"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-32 size-[30rem] rounded-full bg-sapphire/20 blur-[110px] animate-aurora [animation-delay:-8s]"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo href={null} onBrand />
          <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold text-brand-foreground backdrop-blur">
            <ShieldCheck className="size-3.5 text-accent" />
            Administrator access
          </span>
        </div>

        <div className="rounded-3xl border border-white/12 bg-white/[0.06] p-7 shadow-float backdrop-blur-xl sm:p-8">
          <Suspense fallback={<Skeleton className="h-72 w-full bg-white/10" />}>
            <AdminLoginForm />
          </Suspense>
        </div>

        <p className="mt-8 text-center text-xs text-brand-foreground/45">
          © {new Date().getFullYear()} {SITE.legalName} · Authorised personnel only
        </p>
      </div>
    </div>
  );
}
