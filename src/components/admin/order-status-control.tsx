"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateOrderStatus } from "@/lib/actions/orders";
import { ORDER_STATUS_META } from "@/lib/constants";
import type { OrderStatusValue } from "@/types";

const STATUSES: OrderStatusValue[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export function OrderStatusControl({
  orderId,
  current,
}: {
  orderId: string;
  current: OrderStatusValue;
}) {
  const router = useRouter();
  const [status, setStatus] = React.useState<OrderStatusValue>(current);
  const [note, setNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const changed = status !== current;
  const cancelling = status === "CANCELLED" && current !== "CANCELLED";
  const uncancelling = current === "CANCELLED" && status !== "CANCELLED";

  async function save() {
    setSaving(true);
    try {
      const result = await updateOrderStatus({ orderId, status, note });
      if (!result.ok) {
        toast.error(result.message ?? "Could not update the order.");
        return;
      }
      toast.success(result.message);
      setNote("");
      router.refresh();
    } catch {
      toast.error("Could not update the order.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="order-status">Order status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as OrderStatusValue)}>
          <SelectTrigger id="order-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {ORDER_STATUS_META[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="order-note">
          Note <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="order-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Courier name, tracking reference, reason for cancellation…"
        />
        <p className="text-xs text-muted-foreground">
          Notes are recorded on the order timeline.
        </p>
      </div>

      {cancelling && (
        <p className="flex gap-2 rounded-xl border border-amber-500/35 bg-amber-500/8 p-3 text-xs leading-relaxed text-muted-foreground">
          <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          Cancelling returns every item in this order to stock.
        </p>
      )}

      {uncancelling && (
        <p className="flex gap-2 rounded-xl border border-amber-500/35 bg-amber-500/8 p-3 text-xs leading-relaxed text-muted-foreground">
          <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          Reinstating this order will deduct its items from stock again.
        </p>
      )}

      <Button variant="accent" className="w-full" disabled={!changed} loading={saving} onClick={save}>
        {!saving && <Save />}
        Update status
      </Button>
    </div>
  );
}
