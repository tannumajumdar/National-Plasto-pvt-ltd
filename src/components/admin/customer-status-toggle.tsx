"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { setCustomerActive } from "@/lib/actions/misc";

export function CustomerStatusToggle({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const result = await setCustomerActive({ id, isActive: !isActive });
      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      router.refresh();
    } catch {
      toast.error("Could not update the account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-muted-foreground">
        {isActive
          ? "Deactivating prevents this customer from signing in. Their orders and history are kept."
          : "Reactivating restores this customer's ability to sign in."}
      </p>
      <Button
        variant={isActive ? "destructive" : "accent"}
        className="w-full"
        loading={busy}
        onClick={toggle}
      >
        {isActive ? "Deactivate account" : "Reactivate account"}
      </Button>
    </div>
  );
}
