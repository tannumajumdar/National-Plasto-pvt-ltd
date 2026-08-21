"use client";

import * as React from "react";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { updateStock } from "@/lib/actions/products";
import { cn } from "@/lib/utils";

/**
 * Inline stock editor for the admin products table.
 *
 * Click the figure to edit, Enter or ✓ to save, Escape or ✗ to cancel. The
 * displayed value updates optimistically and rolls back if the server rejects
 * it, so the table never shows a number the database does not hold.
 */
export function StockCell({
  productId,
  productName,
  stock,
  trackStock,
}: {
  productId: string;
  productName: string;
  stock: number;
  trackStock: boolean;
}) {
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [value, setValue] = React.useState(stock);
  const [draft, setDraft] = React.useState(String(stock));
  const inputRef = React.useRef<HTMLInputElement>(null);

  // A refresh or a filter change can hand us a new server value.
  React.useEffect(() => {
    setValue(stock);
    setDraft(String(stock));
  }, [stock]);

  React.useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  if (!trackStock) {
    return <span className="text-xs text-muted-foreground">Not tracked</span>;
  }

  function cancel() {
    setDraft(String(value));
    setEditing(false);
  }

  async function save() {
    const next = Number(draft);

    if (draft.trim() === "" || !Number.isFinite(next) || next < 0) {
      toast.error("Enter a stock figure of 0 or more.");
      inputRef.current?.select();
      return;
    }
    if (next === value) {
      setEditing(false);
      return;
    }

    const previous = value;
    setSaving(true);
    setValue(next); // optimistic

    try {
      const result = await updateStock(productId, next);
      if (!result.ok) {
        setValue(previous);
        setDraft(String(previous));
        toast.error(result.message ?? "Could not update stock.");
        return;
      }
      toast.success(`${productName} stock set to ${next}.`);
      setEditing(false);
    } catch {
      setValue(previous);
      setDraft(String(previous));
      toast.error("Could not update stock.");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        title="Click to edit stock"
        className={cn(
          "-mx-1.5 rounded-md px-1.5 py-0.5 font-medium tabular-nums transition-colors",
          "hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          value === 0 && "text-rose-600 dark:text-rose-400",
          value > 0 && value <= 5 && "text-amber-600 dark:text-amber-400",
        )}
        aria-label={`Stock for ${productName} is ${value}. Click to edit.`}
      >
        {value}
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1">
      <input
        ref={inputRef}
        type="number"
        min={0}
        max={1000000}
        value={draft}
        disabled={saving}
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
        aria-label={`Stock for ${productName}`}
        className="h-8 w-20 rounded-md border border-input bg-background px-2 text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        aria-label="Save stock"
        className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
      >
        {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
      </button>
      <button
        type="button"
        onClick={cancel}
        disabled={saving}
        aria-label="Cancel stock edit"
        className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
      >
        <X className="size-3.5" />
      </button>
    </span>
  );
}
