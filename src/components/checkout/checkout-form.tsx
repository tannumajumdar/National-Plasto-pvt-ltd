"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { AlertCircle, Banknote, CreditCard, Lock, MapPin, User } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductVisual } from "@/components/products/product-visual";
import { EASE } from "@/components/animations/motion-primitives";
import { useCart } from "@/hooks/use-cart";
import { INDIAN_STATES } from "@/lib/constants";
import { checkoutSchema } from "@/lib/validations";
import { cn, formatINR } from "@/lib/utils";
import type { CartLineDTO, CartTotals } from "@/types";
import type { PaymentConfig } from "@/lib/payments";
import { payWithRazorpay } from "@/lib/razorpay-checkout";

type CheckoutValues = z.infer<typeof checkoutSchema>;

export interface SavedAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
}

export function CheckoutForm({
  user,
  addresses,
  paymentConfig,
}: {
  user: { name: string; email: string; phone: string | null };
  addresses: SavedAddress[];
  paymentConfig: PaymentConfig;
}) {
  const router = useRouter();
  const ready = useCart((s) => s.ready);
  const lines = useCart((s) => s.lines);
  const clearCart = useCart((s) => s.clear);

  const [resolved, setResolved] = React.useState<CartLineDTO[]>([]);
  const [totals, setTotals] = React.useState<CartTotals | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saveAddress, setSaveAddress] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: user.phone ?? "",
      line1: "",
      line2: "",
      city: "",
      state: "West Bengal",
      pincode: "",
      paymentMethod: "COD",
      notes: "",
    },
  });

  const signature = React.useMemo(
    () => lines.map((l) => `${l.productId}:${l.quantity}`).sort().join("|"),
    [lines],
  );

  React.useEffect(() => {
    if (!ready) return;
    if (lines.length === 0) {
      setResolved([]);
      setTotals(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetch("/api/cart/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines }),
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("resolve failed"))))
      .then((data) => {
        setResolved(data.lines ?? []);
        setTotals(data.totals ?? null);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") toast.error("Could not load your cart.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, signature]);

  function applyAddress(address: SavedAddress) {
    setValue("customerName", address.fullName, { shouldValidate: true });
    setValue("customerPhone", address.phone, { shouldValidate: true });
    setValue("line1", address.line1, { shouldValidate: true });
    setValue("line2", address.line2 ?? "");
    setValue("city", address.city, { shouldValidate: true });
    setValue("state", address.state, { shouldValidate: true });
    setValue("pincode", address.pincode, { shouldValidate: true });
  }

  async function onSubmit(values: CheckoutValues) {
    setSubmitError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, lines, saveAddress }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.fields) {
          for (const [field, message] of Object.entries(data.fields)) {
            setError(field as keyof CheckoutValues, { message: String(message) });
          }
        }
        setSubmitError(data.error ?? "Could not place your order.");
        toast.error(data.error ?? "Could not place your order.");
        return;
      }

      // The order now exists and stock is committed, so the cart is spent
      // whichever way payment goes.
      clearCart();

      if (!data.requiresPayment) {
        toast.success("Order placed", { description: `Order ${data.order.orderNumber}` });
        router.push(`/order-confirmation/${data.order.orderNumber}`);
        return;
      }

      // Online payment. If Razorpay could not be opened, say so plainly rather
      // than pretending the order is complete.
      if (!data.razorpay) {
        toast.warning("Order recorded — payment not started", {
          description:
            data.paymentError ?? "We could not open the payment window. Our team will contact you.",
        });
        router.push(`/order-confirmation/${data.order.orderNumber}`);
        return;
      }

      const outcome = await payWithRazorpay({
        keyId: data.razorpay.keyId,
        razorpayOrderId: data.razorpay.orderId,
        amountPaise: data.razorpay.amount,
        orderNumber: data.order.orderNumber,
        customer: {
          name: values.customerName,
          email: values.customerEmail,
          phone: values.customerPhone,
        },
      });

      if (outcome.status !== "completed") {
        toast.warning(
          outcome.status === "dismissed" ? "Payment cancelled" : "Payment did not go through",
          {
            description:
              outcome.status === "failed"
                ? outcome.message
                : "Your order is saved as unpaid. You can pay on delivery instead.",
          },
        );
        router.push(`/order-confirmation/${data.order.orderNumber}`);
        return;
      }

      // Never trust the widget's word for it — the server re-derives the
      // signature before anything is marked paid.
      const verifyRes = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: data.order.id,
          razorpayOrderId: outcome.response.razorpay_order_id,
          razorpayPaymentId: outcome.response.razorpay_payment_id,
          signature: outcome.response.razorpay_signature,
        }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        toast.error("Payment could not be verified", {
          description: verifyData.error ?? "Please contact us with your order number.",
        });
      } else {
        toast.success("Payment received", { description: `Order ${data.order.orderNumber}` });
      }

      router.push(`/order-confirmation/${data.order.orderNumber}`);
    } catch {
      setSubmitError("Network error. Check your connection and try again.");
      toast.error("Network error");
    }
  }

  if (!ready || loading) {
    return (
      <div className="grid gap-10 lg:grid-cols-[1fr_24rem]">
        <div className="h-96 animate-pulse rounded-2xl bg-muted" />
        <div className="h-80 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (resolved.length === 0 || !totals) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <h2 className="text-xl font-bold">Your cart is empty</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Add some products before checking out.
        </p>
        <Button asChild variant="accent" className="mt-6">
          <Link href="/products">Browse products</Link>
        </Button>
      </div>
    );
  }

  const blocked = totals.unpricedCount > 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-10 lg:grid-cols-[1fr_24rem] xl:gap-14">
        <div className="space-y-8">
          {/* Saved addresses */}
          {addresses.length > 0 && (
            <Section icon={MapPin} title="Saved addresses" step="">
              <div className="grid gap-3 sm:grid-cols-2">
                {addresses.map((address) => (
                  <button
                    key={address.id}
                    type="button"
                    onClick={() => applyAddress(address)}
                    className="rounded-xl border border-border p-4 text-left text-sm transition-colors hover:border-accent hover:bg-secondary"
                  >
                    <span className="font-semibold">{address.label}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                      {address.fullName}, {address.line1}, {address.city}, {address.state}{" "}
                      {address.pincode}
                    </span>
                  </button>
                ))}
              </div>
            </Section>
          )}

          {/* Customer */}
          <Section icon={User} title="Customer information" step="1">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name" htmlFor="customerName" error={errors.customerName?.message}>
                <Input id="customerName" aria-invalid={!!errors.customerName} {...register("customerName")} />
              </Field>
              <Field label="Email" htmlFor="customerEmail" error={errors.customerEmail?.message}>
                <Input id="customerEmail" type="email" aria-invalid={!!errors.customerEmail} {...register("customerEmail")} />
              </Field>
              <Field label="Phone" htmlFor="customerPhone" error={errors.customerPhone?.message}>
                <Input id="customerPhone" type="tel" inputMode="tel" placeholder="10-digit mobile" aria-invalid={!!errors.customerPhone} {...register("customerPhone")} />
              </Field>
            </div>
          </Section>

          {/* Address */}
          <Section icon={MapPin} title="Delivery address" step="2">
            <div className="grid gap-5">
              <Field label="Address" htmlFor="line1" error={errors.line1?.message}>
                <Input id="line1" placeholder="House / flat, building, street" aria-invalid={!!errors.line1} {...register("line1")} />
              </Field>
              <Field label="Landmark / area" htmlFor="line2" error={errors.line2?.message} optional>
                <Input id="line2" placeholder="Locality, landmark" {...register("line2")} />
              </Field>

              <div className="grid gap-5 sm:grid-cols-3">
                <Field label="City" htmlFor="city" error={errors.city?.message}>
                  <Input id="city" aria-invalid={!!errors.city} {...register("city")} />
                </Field>

                <Field label="State" htmlFor="state" error={errors.state?.message}>
                  <Controller
                    control={control}
                    name="state"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="state" aria-invalid={!!errors.state}>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDIAN_STATES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>

                <Field label="Pincode" htmlFor="pincode" error={errors.pincode?.message}>
                  <Input id="pincode" inputMode="numeric" maxLength={6} aria-invalid={!!errors.pincode} {...register("pincode")} />
                </Field>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="saveAddress"
                  checked={saveAddress}
                  onCheckedChange={(v) => setSaveAddress(v === true)}
                />
                <Label htmlFor="saveAddress" className="cursor-pointer font-normal">
                  Save this address for future orders
                </Label>
              </div>
            </div>
          </Section>

          {/* Payment */}
          <Section icon={CreditCard} title="Payment method" step="3">
            <Controller
              control={control}
              name="paymentMethod"
              render={({ field }) => (
                <div className="space-y-3">
                  {paymentConfig.methods.map((method) => {
                    const selected = field.value === method.value;
                    return (
                      <label
                        key={method.value}
                        className={cn(
                          "flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition-all",
                          selected ? "border-accent bg-accent/5 shadow-soft" : "border-border hover:bg-secondary/50",
                          !method.available && "cursor-not-allowed opacity-60 hover:bg-transparent",
                        )}
                      >
                        <input
                          type="radio"
                          className="sr-only"
                          checked={selected}
                          disabled={!method.available}
                          onChange={() => method.available && field.onChange(method.value)}
                        />
                        <span
                          className={cn(
                            "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2",
                            selected ? "border-accent" : "border-input",
                          )}
                        >
                          {selected && <span className="size-2.5 rounded-full bg-accent" />}
                        </span>

                        <span className="flex-1">
                          <span className="flex items-center gap-2 font-semibold">
                            {method.value === "COD" ? <Banknote className="size-4" /> : <CreditCard className="size-4" />}
                            {method.label}
                          </span>
                          <span className="mt-1 block text-sm text-muted-foreground">
                            {method.description}
                          </span>
                          {!method.available && method.unavailableReason && (
                            <span className="mt-2 block text-xs font-medium text-amber-600 dark:text-amber-400">
                              {method.unavailableReason}
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            />

            <div className="mt-5">
              <Field label="Order notes" htmlFor="notes" error={errors.notes?.message} optional>
                <Textarea id="notes" rows={3} placeholder="Delivery instructions, preferred timing…" {...register("notes")} />
              </Field>
            </div>
          </Section>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-lg font-bold tracking-tight">Order summary</h2>

            <ul className="mt-5 max-h-72 space-y-4 overflow-y-auto pr-1">
              {resolved.map((line) => (
                <li key={line.productId} className="flex gap-3">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <ProductVisual name={line.name} accent={line.accent} src={line.image} sizes="56px" rounded="rounded-lg" />
                    <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {line.quantity}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-sm font-medium">{line.name}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {line.collectionName}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {line.unitPrice !== null ? formatINR(line.unitPrice * line.quantity) : "—"}
                  </span>
                </li>
              ))}
            </ul>

            <Separator className="my-5" />

            <dl className="space-y-3 text-sm">
              <SummaryRow label="Subtotal" value={formatINR(totals.subtotal)} />
              {totals.discount > 0 && (
                <SummaryRow label="Discount" value={`− ${formatINR(totals.discount)}`} valueClass="text-emerald-600 dark:text-emerald-400" />
              )}
              <SummaryRow
                label="Shipping"
                value={totals.shipping === 0 ? "Free" : formatINR(totals.shipping)}
                valueClass={totals.shipping === 0 ? "text-emerald-600 dark:text-emerald-400" : ""}
              />
            </dl>

            <Separator className="my-5" />

            <div className="flex items-baseline justify-between">
              <span className="font-semibold">Total</span>
              <span className="text-2xl font-extrabold tabular-nums">{formatINR(totals.total)}</span>
            </div>

            {blocked && (
              <div className="mt-5 flex gap-2.5 rounded-xl border border-amber-500/35 bg-amber-500/8 p-4">
                <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Your cart contains unpriced items. Remove them from the{" "}
                  <Link href="/cart" className="font-semibold text-foreground underline">cart</Link>{" "}
                  before placing the order.
                </p>
              </div>
            )}

            {submitError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive"
                role="alert"
              >
                {submitError}
              </motion.p>
            )}

            <Button type="submit" variant="accent" size="lg" className="mt-6 w-full" loading={isSubmitting} disabled={blocked}>
              {!isSubmitting && <Lock />}
              Place order
            </Button>

            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <Lock className="mt-0.5 size-3 shrink-0" />
              Your details are transmitted securely and used only to fulfil this order.
            </p>
          </div>
        </aside>
      </div>
    </form>
  );
}

function Section({
  icon: Icon,
  title,
  step,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  step: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-7"
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-linear-to-br from-accent/18 to-accent/5 text-accent">
          <Icon className="size-5" />
        </span>
        <h2 className="text-lg font-bold tracking-tight">
          {step && <span className="mr-2 text-muted-foreground">{step}.</span>}
          {title}
        </h2>
      </div>
      {children}
    </motion.section>
  );
}

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
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("font-medium tabular-nums", valueClass)}>{value}</dd>
    </div>
  );
}
