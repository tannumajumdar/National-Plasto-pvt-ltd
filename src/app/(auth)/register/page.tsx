import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/forms/auth-forms";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a National Plasto account to save your wishlist and track orders.",
  robots: { index: false, follow: true },
};

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/account");

  return (
    <Suspense fallback={<Skeleton className="h-[32rem] w-full" />}>
      <RegisterForm />
    </Suspense>
  );
}
