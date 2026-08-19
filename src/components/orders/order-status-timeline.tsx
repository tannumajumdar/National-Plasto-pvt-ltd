"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

import { ORDER_STATUS_FLOW, ORDER_STATUS_META } from "@/lib/constants";
import { cn, formatDateTime } from "@/lib/utils";
import type { OrderStatusValue } from "@/types";

/**
 * Visual order progress.
 *
 * A cancelled order is shown as a terminated track rather than being forced
 * into the linear flow, since cancellation can happen from any stage.
 */
export function OrderStatusTimeline({
  status,
  events,
  className,
}: {
  status: OrderStatusValue;
  events?: { id: string; status: OrderStatusValue; note: string | null; createdAt: string }[];
  className?: string;
}) {
  const cancelled = status === "CANCELLED";
  const currentIndex = ORDER_STATUS_FLOW.indexOf(status as (typeof ORDER_STATUS_FLOW)[number]);

  // Most recent event timestamp per status, for the caption under each node.
  const stamps = new Map<string, string>();
  for (const event of events ?? []) stamps.set(event.status, event.createdAt);

  if (cancelled) {
    const cancelEvent = (events ?? []).find((e) => e.status === "CANCELLED");
    return (
      <div className={cn("rounded-2xl border border-rose-500/30 bg-rose-500/8 p-6", className)}>
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-rose-500 text-white">
            <X className="size-5" />
          </span>
          <div>
            <p className="font-semibold text-rose-700 dark:text-rose-400">Order cancelled</p>
            {cancelEvent && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatDateTime(cancelEvent.createdAt)}
                {cancelEvent.note ? ` — ${cancelEvent.note}` : ""}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <ol className="relative flex flex-col gap-0 sm:flex-row sm:gap-0">
        {ORDER_STATUS_FLOW.map((step, i) => {
          const done = i <= currentIndex;
          const isCurrent = i === currentIndex;
          const meta = ORDER_STATUS_META[step];
          const stamp = stamps.get(step);

          return (
            <li key={step} className="relative flex flex-1 gap-4 pb-8 sm:flex-col sm:gap-3 sm:pb-0">
              {/* Connector */}
              {i < ORDER_STATUS_FLOW.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-[15px] top-9 h-[calc(100%-2.25rem)] w-0.5 bg-border sm:left-0 sm:top-[15px] sm:h-0.5 sm:w-full sm:translate-x-1/2"
                >
                  <motion.span
                    className="block h-full w-full origin-top bg-accent sm:origin-left"
                    initial={{ scaleY: 0, scaleX: 0 }}
                    animate={
                      i < currentIndex
                        ? { scaleY: 1, scaleX: 1 }
                        : { scaleY: 0, scaleX: 0 }
                    }
                    transition={{ duration: 0.5, delay: i * 0.12 }}
                  />
                </span>
              )}

              {/* Node */}
              <motion.span
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, delay: i * 0.1 }}
                className={cn(
                  "relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-2 text-xs font-bold",
                  done
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-background text-muted-foreground",
                  isCurrent && "ring-4 ring-accent/20",
                )}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </motion.span>

              <div className="sm:pr-4">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    done ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {meta.label}
                </p>
                {stamp && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(stamp)}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
