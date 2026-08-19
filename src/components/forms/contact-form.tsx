"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { contactSchema } from "@/lib/validations";
import { EASE } from "@/components/animations/motion-primitives";

type ContactValues = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [sent, setSent] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", phone: "", subject: "", message: "" },
  });

  async function onSubmit(values: ContactValues) {
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok) {
        // Surface server-side field errors on the matching inputs.
        if (data.fields) {
          for (const [field, message] of Object.entries(data.fields)) {
            setError(field as keyof ContactValues, { message: String(message) });
          }
        }
        toast.error(data.error ?? "Could not send your message.");
        return;
      }

      setSent(true);
      reset();
      toast.success("Message received", { description: data.message });
    } catch {
      toast.error("Network error", { description: "Check your connection and try again." });
    }
  }

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="flex flex-col items-center rounded-3xl border border-border bg-card p-10 text-center shadow-soft"
      >
        <span className="grid size-16 place-items-center rounded-2xl bg-emerald-500/12">
          <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
        </span>
        <h3 className="mt-6 text-xl font-bold tracking-tight">Thank you for reaching out</h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Your message has been received and saved to our enquiry inbox. Our team in Kolkata
          will get back to you.
        </p>
        <Button variant="outline" className="mt-7" onClick={() => setSent(false)}>
          Send another message
        </Button>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8"
      noValidate
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" error={errors.name?.message} htmlFor="name">
          <Input id="name" placeholder="Your name" aria-invalid={!!errors.name} {...register("name")} />
        </Field>

        <Field label="Email" error={errors.email?.message} htmlFor="email">
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </Field>

        <Field label="Phone" error={errors.phone?.message} htmlFor="phone" optional>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            placeholder="10-digit mobile number"
            aria-invalid={!!errors.phone}
            {...register("phone")}
          />
        </Field>

        <Field label="Subject" error={errors.subject?.message} htmlFor="subject">
          <Input
            id="subject"
            placeholder="Product enquiry, bulk order…"
            aria-invalid={!!errors.subject}
            {...register("subject")}
          />
        </Field>
      </div>

      <div className="mt-5">
        <Field label="Message" error={errors.message?.message} htmlFor="message">
          <Textarea
            id="message"
            rows={6}
            placeholder="Tell us what you need — product names, quantities, delivery location…"
            aria-invalid={!!errors.message}
            {...register("message")}
          />
        </Field>
      </div>

      <Button type="submit" variant="accent" size="lg" className="mt-7 w-full sm:w-auto" loading={isSubmitting}>
        {!isSubmitting && <Send />}
        Send message
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  htmlFor,
  optional,
  children,
}: {
  label: string;
  error?: string;
  htmlFor: string;
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
