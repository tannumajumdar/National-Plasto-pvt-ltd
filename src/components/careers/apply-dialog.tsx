"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitApplication } from "@/lib/actions/careers";

interface ApplyValues {
  name: string;
  email: string;
  phone: string;
  message: string;
  cvUrl: string;
}

/**
 * Applying for one role, or speculatively when `openingId` is absent.
 *
 * The CV is taken as a link rather than a file: a public upload endpoint that
 * accepts documents from anyone is a liability, and every applicant already
 * has their CV somewhere shareable.
 */
export function ApplyDialog({
  openingId,
  roleTitle,
  trigger,
}: {
  openingId?: string;
  roleTitle: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ApplyValues>({
    defaultValues: { name: "", email: "", phone: "", message: "", cvUrl: "" },
  });

  React.useEffect(() => {
    if (!open) return;
    setSent(false);
    reset({ name: "", email: "", phone: "", message: "", cvUrl: "" });
  }, [open, reset]);

  async function onSubmit(values: ApplyValues) {
    const result = await submitApplication({ ...values, openingId: openingId ?? "" });

    if (!result.ok) {
      if (result.fields) {
        for (const [field, message] of Object.entries(result.fields)) {
          setError(field as keyof ApplyValues, { message });
        }
      }
      toast.error(result.message ?? "Could not send your application.");
      return;
    }

    setSent(true);
    toast.success(result.message ?? "Application sent.");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <span onClick={() => setOpen(true)}>{trigger}</span>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply — {roleTitle}</DialogTitle>
          <DialogDescription>
            Tell us how to reach you and link your CV. We read every application.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="size-10 text-success" />
            <p className="font-semibold text-foreground">Your application has reached us</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              We will be in touch if there is a fit. Thank you for your interest in
              National Plasto.
            </p>
            <Button variant="outline" className="mt-2" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Field label="Full name" htmlFor="ap-name" error={errors.name?.message}>
              <Input
                id="ap-name"
                autoComplete="name"
                {...register("name", { required: "Please enter your name" })}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" htmlFor="ap-email" error={errors.email?.message}>
                <Input
                  id="ap-email"
                  type="email"
                  autoComplete="email"
                  {...register("email", { required: "Please enter your email" })}
                />
              </Field>

              <Field label="Phone" htmlFor="ap-phone" error={errors.phone?.message}>
                <Input
                  id="ap-phone"
                  type="tel"
                  autoComplete="tel"
                  {...register("phone", { required: "Please enter a phone number" })}
                />
              </Field>
            </div>

            <Field
              label="Link to your CV"
              htmlFor="ap-cv"
              error={errors.cvUrl?.message}
              hint="Google Drive, Dropbox or LinkedIn — make sure it is shareable."
            >
              <Input id="ap-cv" type="url" placeholder="https://" {...register("cvUrl")} />
            </Field>

            <Field
              label="Anything you would like us to know"
              htmlFor="ap-message"
              error={errors.message?.message}
              hint="Optional."
            >
              <Textarea id="ap-message" rows={4} {...register("message")} />
            </Field>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="accent" loading={isSubmitting}>
                <Send />
                Send application
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
