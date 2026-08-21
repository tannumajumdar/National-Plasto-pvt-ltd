"use client";

import * as React from "react";
import { AlertTriangle, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { updatePrice } from "@/lib/actions/products";
import { cn, formatINR } from "@/lib/utils";

/**
 * Inline price editor for the admin products table.
 *
 * Every seeded product ships with no price, which is what keeps it out of the
 * cart — so this is the fastest route from "Price on request" to a sellable
 * catalogue. Click the figure, Enter to save, Escape to cancel; clearing the
 * box and saving puts the product back to "Price on request".
 *
 * The admin types RUPEES here. Conversion to integer paise happens once, on
 * the server, in `updatePrice`.
 */
export function PriceCell({
  productId,
  productName,
  price,
  discountPrice,
}: {
  productId: string;
  productName: string;
  /** Paise, or null when unset. */
  price: number | null;
  /** Paise, or null. */
  discountPrice: number | null;
}) {
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [value, setValue] = React.useState<number | null>(price);
  const [draft, setDraft] = React.useState(price === null ? "" : String(price / 100));
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setValue(price);
    setDraft(price === null ? "" : String(price / 100));
  }, [price]);

  React.useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function cancel() {
    setDraft(value === null ? "" : String(value / 100));
    setEditing(false);
  }

  async function save() {
    const raw = draft.trim();
    const next = raw === "" ? null : Number(raw);

    if (next !== null && (!Number.isFinite(next) || next < 0)) {
      toast.error("Enter a price in rupees, or clear the box for “Price on request”.");
      inputRef.current?.select();
      return;
    }

    const nextPaise = next === null ? null : Math.round(next * 100);
    if (nextPaise === value) {
      setEditing(false);
      return;
    }

    const previous = value;
    setSaving(true);
    setValue(nextPaise); // optimistic

    try {
      const result = await updatePrice(productId, next);
      if (!result.ok) {
        setValue(previous);
        setDraft(previous === null ? "" : String(previous / 100));
        toast.error(result.message ?? "Could not update the price.");
        return;
      }
      toast.success(
        nextPaise === null
          ? `${productName} is back to “Price on request”.`
          : `${productName} priced at ${formatINR(nextPaise)}.`,
        result.message?.includes("discount") ? { description: result.message } : undefined,
      );
      setEditing(false);
    } catch {
      setValue(previous);
      setDraft(previous === null ? "" : String(previous / 100));
      toast.error("Could not update the price.");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        title="Click to edit the price"
        className={cn(
          "-mx-1.5 rounded-md px-1.5 py-0.5 text-left font-medium tabular-nums transition-colors",
          "hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
        aria-label={
          value === null
            ? `${productName} has no price. Click to set one.`
            : `${productName} costs ${formatINR(value)}. Click to edit.`
        }
      >
        {value === null ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <AlertTriangle className="size-3.5" />
            Not set
          </span>
        ) : (
          <>
            {formatINR(discountPrice ?? value)}
            {discountPrice !== null && discountPrice < value && (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground line-through">
                {formatINR(value)}
              </span>
            )}
          </>
        )}
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1">
      <span className="text-sm text-muted-foreground">₹</span>
      <input
        ref={inputRef}
        type="number"
        min={0}
        step="0.01"
        value={draft}
        disabled={saving}
        placeholder="Not set"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void save();
          } else if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
        }}
        aria-label={`Price in rupees for ${productName}`}
        className="h-8 w-24 rounded-md border border-input bg-background px-2 text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        aria-label="Save price"
        className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
      >
        {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
      </button>
      <button
        type="button"
        onClick={cancel}
        disabled={saving}
        aria-label="Cancel price edit"
        className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
      >
        <X className="size-3.5" />
      </button>
    </span>
  );
}
