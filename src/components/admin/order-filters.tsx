"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { ORDER_STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function OrderFilters({
  statuses,
  countByStatus,
}: {
  statuses: readonly string[];
  countByStatus: Record<string, number>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = React.useTransition();

  const [term, setTerm] = React.useState(params.get("q") ?? "");
  const debounced = useDebounce(term, 350);
  const firstRun = React.useRef(true);

  React.useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const sp = new URLSearchParams(params.toString());
    if (debounced.trim()) {
      sp.set("q", debounced.trim());
    } else {
      sp.delete("q");
    }
    sp.delete("page");
    startTransition(() => router.replace(`${pathname}?${sp.toString()}`, { scroll: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const active = params.get("status") ?? "";

  function setStatus(status: string) {
    const sp = new URLSearchParams(params.toString());
    if (status) {
      sp.set("status", status);
    } else {
      sp.delete("status");
    }
    sp.delete("page");
    startTransition(() => router.replace(`${pathname}?${sp.toString()}`, { scroll: false }));
  }

  const total = Object.values(countByStatus).reduce((a, b) => a + b, 0);

  return (
    <div className="mb-5 space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search order number, name, email or phone…"
          className="pl-10"
        />
        {isPending && (
          <Loader2 className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        <StatusChip label="All" count={total} active={active === ""} onClick={() => setStatus("")} />
        {statuses.map((status) => (
          <StatusChip
            key={status}
            label={ORDER_STATUS_META[status]?.label ?? status}
            count={countByStatus[status] ?? 0}
            active={active === status}
            onClick={() => setStatus(status)}
          />
        ))}
      </div>
    </div>
  );
}

function StatusChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-transparent bg-primary text-primary-foreground"
          : "border-border bg-card hover:bg-secondary",
      )}
      aria-pressed={active}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 text-xs tabular-nums",
          active ? "bg-white/20" : "bg-secondary",
        )}
      >
        {count}
      </span>
    </button>
  );
}
