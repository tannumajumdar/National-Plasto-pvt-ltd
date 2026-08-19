import type { Metadata } from "next";
import { Suspense } from "react";

import { ForgotPasswordForm } from "@/components/forms/auth-forms";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Forgot Password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<Skeleton className="h-72 w-full" />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
