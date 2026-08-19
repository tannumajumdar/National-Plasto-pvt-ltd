"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EASE } from "@/components/animations/motion-primitives";
import { INDIAN_STATES } from "@/lib/constants";
import { addressSchema } from "@/lib/validations";

type AddressValues = z.infer<typeof addressSchema>;

export interface Address extends AddressValues {
  id: string;
}

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<Address | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<Address | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function remove(address: Address) {
    setBusy(true);
    try {
      const res = await fetch(`/api/account/addresses/${address.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Could not remove the address.");
        return;
      }
      toast.success("Address removed");
      setDeleting(null);
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {addresses.length} of 10 addresses saved
        </p>
        <Button variant="accent" size="sm" onClick={() => setCreating(true)}>
          <Plus />
          Add address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card">
          <EmptyState
            icon={MapPin}
            title="No saved addresses"
            description="Save an address to check out faster next time."
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {addresses.map((address) => (
              <motion.div
                key={address.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="relative rounded-2xl border border-border bg-card p-5 shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{address.label}</span>
                    {address.isDefault && (
                      <Badge variant="accent">
                        <Star className="size-3 fill-current" />
                        Default
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditing(address)}
                      className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      aria-label={`Edit ${address.label} address`}
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleting(address)}
                      className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Delete ${address.label} address`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                <address className="mt-3 text-sm not-italic leading-relaxed text-muted-foreground">
                  <span className="block font-medium text-foreground">{address.fullName}</span>
                  {address.line1}
                  {address.line2 && (
                    <>
                      <br />
                      {address.line2}
                    </>
                  )}
                  <br />
                  {address.city}, {address.state} {address.pincode}
                  <br />
                  {address.phone}
                </address>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AddressDialog
        open={creating || editing !== null}
        address={editing}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
        onSaved={() => {
          setCreating(false);
          setEditing(null);
          router.refresh();
        }}
      />

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove this address?</DialogTitle>
            <DialogDescription>
              {deleting?.label} — {deleting?.line1}, {deleting?.city}. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={busy}
              onClick={() => deleting && remove(deleting)}
            >
              Remove address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AddressDialog({
  open,
  address,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  address: Address | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const isEdit = address !== null;

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: "Home",
      fullName: "",
      phone: "",
      line1: "",
      line2: "",
      city: "",
      state: "West Bengal",
      pincode: "",
      isDefault: false,
    },
  });

  // Load the selected address into the form each time the dialog opens.
  React.useEffect(() => {
    if (!open) return;
    reset(
      address ?? {
        label: "Home",
        fullName: "",
        phone: "",
        line1: "",
        line2: "",
        city: "",
        state: "West Bengal",
        pincode: "",
        isDefault: false,
      },
    );
  }, [open, address, reset]);

  async function onSubmit(values: AddressValues) {
    try {
      const res = await fetch(
        isEdit ? `/api/account/addresses/${address.id}` : "/api/account/addresses",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );
      const data = await res.json();

      if (!res.ok) {
        if (data.fields) {
          for (const [f, m] of Object.entries(data.fields)) {
            setError(f as keyof AddressValues, { message: String(m) });
          }
        }
        toast.error(data.error ?? "Could not save the address.");
        return;
      }

      toast.success(isEdit ? "Address updated" : "Address saved");
      onSaved();
    } catch {
      toast.error("Network error. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit address" : "Add a new address"}</DialogTitle>
          <DialogDescription>
            Used to pre-fill the delivery details at checkout.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldWrap label="Label" htmlFor="label" error={errors.label?.message}>
              <Input id="label" placeholder="Home, Office…" {...register("label")} />
            </FieldWrap>
            <FieldWrap label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
              <Input id="fullName" {...register("fullName")} />
            </FieldWrap>
          </div>

          <FieldWrap label="Phone" htmlFor="phone" error={errors.phone?.message}>
            <Input id="phone" type="tel" inputMode="tel" placeholder="10-digit mobile" {...register("phone")} />
          </FieldWrap>

          <FieldWrap label="Address" htmlFor="line1" error={errors.line1?.message}>
            <Input id="line1" placeholder="House / flat, building, street" {...register("line1")} />
          </FieldWrap>

          <FieldWrap label="Landmark / area" htmlFor="line2" error={errors.line2?.message} optional>
            <Input id="line2" {...register("line2")} />
          </FieldWrap>

          <div className="grid gap-4 sm:grid-cols-3">
            <FieldWrap label="City" htmlFor="city" error={errors.city?.message}>
              <Input id="city" {...register("city")} />
            </FieldWrap>

            <FieldWrap label="State" htmlFor="state" error={errors.state?.message}>
              <Controller
                control={control}
                name="state"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="state">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FieldWrap>

            <FieldWrap label="Pincode" htmlFor="pincode" error={errors.pincode?.message}>
              <Input id="pincode" inputMode="numeric" maxLength={6} {...register("pincode")} />
            </FieldWrap>
          </div>

          <Controller
            control={control}
            name="isDefault"
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <Checkbox
                  id="isDefault"
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                />
                <Label htmlFor="isDefault" className="cursor-pointer font-normal">
                  Set as my default address
                </Label>
              </div>
            )}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" loading={isSubmitting}>
              {isEdit ? "Save changes" : "Add address"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FieldWrap({
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
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
