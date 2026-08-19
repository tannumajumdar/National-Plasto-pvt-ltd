"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn } from "lucide-react";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema } from "@/lib/validations";

type LoginValues = z.infer<typeof loginSchema>;

export function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [showPassword, setShowPassword] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(
    params.get("error") === "forbidden"
      ? "That account does not have administrator access."
      : null,
  );

  const next = (() => {
    const raw = params.get("next");
    // Only same-site admin paths are honoured as a redirect target.
    if (!raw || !raw.startsWith("/admin") || raw.startsWith("//")) return "/admin";
    return raw;
  })();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error ?? "Could not sign you in.");
        return;
      }

      // Authenticating is not enough — this entrance is admin-only.
      if (data.user.role !== "ADMIN") {
        await fetch("/api/auth/logout", { method: "POST" });
        setFormError("That account does not have administrator access.");
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setFormError("Network error. Check your connection and try again.");
    }
  }

  return (
    <>
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-primary-foreground">
          Sign in to the admin panel
        </h1>
        <p className="mt-1.5 text-sm text-primary-foreground/60">
          Manage products, orders, customers and site content.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-primary-foreground/85">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="admin@nationalplasto.com"
            aria-invalid={!!errors.email}
            className="border-white/15 bg-white/10 text-primary-foreground placeholder:text-primary-foreground/40 focus-visible:border-accent"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs font-medium text-rose-300">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-primary-foreground/85">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Your password"
              aria-invalid={!!errors.password}
              className="border-white/15 bg-white/10 pr-11 text-primary-foreground placeholder:text-primary-foreground/40 focus-visible:border-accent"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-primary-foreground/60 transition-colors hover:bg-white/10 hover:text-primary-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs font-medium text-rose-300">{errors.password.message}</p>
          )}
        </div>

        {formError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-rose-400/30 bg-rose-500/15 p-3 text-sm font-medium text-rose-200"
            role="alert"
          >
            {formError}
          </motion.p>
        )}

        <Button type="submit" variant="accent" size="lg" className="w-full" loading={isSubmitting}>
          {!isSubmitting && <LogIn />}
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-primary-foreground/50">
        Not an administrator?{" "}
        <Link href="/login" className="font-semibold text-primary-foreground hover:text-accent">
          Customer sign in
        </Link>
      </p>
    </>
  );
}
