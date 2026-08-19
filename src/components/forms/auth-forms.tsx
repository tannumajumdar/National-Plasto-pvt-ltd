"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { CheckCircle2, Eye, EyeOff, Mail } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validations";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------
   Shared pieces
   ------------------------------------------------------------------ */

function Field({
  label,
  htmlFor,
  error,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>
        {label}
        {optional && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
      </Label>
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-medium text-destructive"
          role="alert"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

function PasswordInput({
  id,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  const [visible, setVisible] = React.useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        className="pr-11"
        aria-invalid={error}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        aria-label={visible ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

/** Safely resolves the post-login redirect; only same-site paths are honoured. */
function safeNext(raw: string | null): string {
  if (!raw) return "/account";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/account";
  return raw;
}

/* ------------------------------------------------------------------
   Login
   ------------------------------------------------------------------ */

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
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
        if (data.fields) {
          for (const [f, m] of Object.entries(data.fields)) {
            setError(f as keyof LoginValues, { message: String(m) });
          }
        }
        setFormError(data.error ?? "Could not sign you in.");
        return;
      }

      toast.success(`Welcome back, ${data.user.name.split(" ")[0]}`);
      router.push(data.user.role === "ADMIN" && next === "/account" ? "/admin" : next);
      router.refresh();
    } catch {
      setFormError("Network error. Check your connection and try again.");
    }
  }

  return (
    <>
      <AuthHeading title="Welcome back" subtitle="Sign in to your National Plasto account." />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="Your password"
            error={!!errors.password}
            {...register("password")}
          />
        </Field>

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-accent hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {formError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive"
            role="alert"
          >
            {formError}
          </motion.p>
        )}

        <Button type="submit" variant="accent" size="lg" className="w-full" loading={isSubmitting}>
          Sign in
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-foreground hover:text-accent">
          Create one
        </Link>
      </p>
    </>
  );
}

/* ------------------------------------------------------------------
   Register
   ------------------------------------------------------------------ */

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", phone: "", password: "", confirmPassword: "" },
  });

  const password = watch("password");

  async function onSubmit(values: RegisterValues) {
    setFormError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.fields) {
          for (const [f, m] of Object.entries(data.fields)) {
            setError(f as keyof RegisterValues, { message: String(m) });
          }
        }
        setFormError(data.error ?? "Could not create your account.");
        return;
      }

      toast.success("Account created", { description: `Welcome, ${data.user.name}.` });
      router.push("/account");
      router.refresh();
    } catch {
      setFormError("Network error. Check your connection and try again.");
    }
  }

  return (
    <>
      <AuthHeading
        title="Create your account"
        subtitle="Save your wishlist, track orders and check out faster."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Field label="Full name" htmlFor="name" error={errors.name?.message}>
          <Input id="name" autoComplete="name" placeholder="Your name" aria-invalid={!!errors.name} {...register("name")} />
        </Field>

        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} {...register("email")} />
        </Field>

        <Field label="Phone" htmlFor="phone" error={errors.phone?.message} optional>
          <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="10-digit mobile" aria-invalid={!!errors.phone} {...register("phone")} />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput id="password" autoComplete="new-password" placeholder="At least 8 characters" error={!!errors.password} {...register("password")} />
          <PasswordStrength value={password} />
        </Field>

        <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
          <PasswordInput id="confirmPassword" autoComplete="new-password" placeholder="Re-enter your password" error={!!errors.confirmPassword} {...register("confirmPassword")} />
        </Field>

        {formError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive"
            role="alert"
          >
            {formError}
          </motion.p>
        )}

        <Button type="submit" variant="accent" size="lg" className="w-full" loading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-foreground hover:text-accent">
          Sign in
        </Link>
      </p>
    </>
  );
}

function PasswordStrength({ value }: { value: string }) {
  if (!value) return null;

  const checks = [
    value.length >= 8,
    /[a-z]/.test(value),
    /[A-Z]/.test(value),
    /\d/.test(value),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-rose-500", "bg-rose-500", "bg-amber-500", "bg-lime-500", "bg-emerald-500"];

  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i < score ? colors[score] : "bg-border",
            )}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{labels[score]}</p>
    </div>
  );
}

/* ------------------------------------------------------------------
   Forgot password
   ------------------------------------------------------------------ */

type ForgotValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [sent, setSent] = React.useState(false);
  const [devLink, setDevLink] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotValues) {
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      setSent(true);
      if (data.devResetLink) setDevLink(data.devResetLink);
    } catch {
      toast.error("Network error. Please try again.");
    }
  }

  if (sent) {
    return (
      <>
        <div className="flex flex-col items-center text-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-emerald-500/12">
            <Mail className="size-8 text-emerald-600 dark:text-emerald-400" />
          </span>
          <h1 className="mt-6 text-2xl font-extrabold tracking-tight">Check your email</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            If an account exists for that address, a password reset link has been issued and
            is valid for one hour.
          </p>
        </div>

        {/* Development aid — no email provider is configured in this project. */}
        {devLink && (
          <div className="mt-6 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/8 p-4">
            <p className="text-xs font-semibold text-foreground">
              Development mode — no email was sent
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              No email provider is configured, so use this link directly:
            </p>
            <Link
              href={devLink.replace(/^https?:\/\/[^/]+/, "")}
              className="mt-2 block break-all text-xs font-medium text-accent hover:underline"
            >
              {devLink}
            </Link>
          </div>
        )}

        <Button asChild variant="outline" className="mt-7 w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <AuthHeading
        title="Forgot your password?"
        subtitle="Enter your email and we'll issue a reset link."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} {...register("email")} />
        </Field>

        <Button type="submit" variant="accent" size="lg" className="w-full" loading={isSubmitting}>
          Send reset link
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-foreground hover:text-accent">
          Sign in
        </Link>
      </p>
    </>
  );
}

/* ------------------------------------------------------------------
   Reset password
   ------------------------------------------------------------------ */

type ResetValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [formError, setFormError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetValues) {
    setFormError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, token }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error ?? "Could not reset your password.");
        return;
      }

      setDone(true);
      toast.success("Password updated");
      setTimeout(() => router.push("/login"), 1800);
    } catch {
      setFormError("Network error. Please try again.");
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">Invalid reset link</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This link is missing its token. Request a new password reset.
        </p>
        <Button asChild variant="accent" className="mt-7 w-full">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center text-center">
        <span className="grid size-16 place-items-center rounded-2xl bg-emerald-500/12">
          <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
        </span>
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight">Password updated</h1>
        <p className="mt-3 text-sm text-muted-foreground">Redirecting you to sign in…</p>
      </div>
    );
  }

  return (
    <>
      <AuthHeading title="Set a new password" subtitle="Choose a strong password you don't use elsewhere." />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <input type="hidden" {...register("token")} value={token} />

        <Field label="New password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput id="password" autoComplete="new-password" placeholder="At least 8 characters" error={!!errors.password} {...register("password")} />
        </Field>

        <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
          <PasswordInput id="confirmPassword" autoComplete="new-password" placeholder="Re-enter your password" error={!!errors.confirmPassword} {...register("confirmPassword")} />
        </Field>

        {formError && (
          <p className="rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive" role="alert">
            {formError}
          </p>
        )}

        <Button type="submit" variant="accent" size="lg" className="w-full" loading={isSubmitting}>
          Update password
        </Button>
      </form>
    </>
  );
}
