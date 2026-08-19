"use client";

import * as React from "react";

import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";

/**
 * Reconciles guest state held in localStorage with the signed-in user's
 * server-side cart and wishlist.
 *
 * Runs once per sign-in: the local lines are POSTed, the server merges them
 * with whatever it already had (taking the larger quantity per product) and
 * returns the authoritative list, which replaces the local store.
 */
export function CartSync({ signedIn }: { signedIn: boolean }) {
  const cartReady = useCart((s) => s.ready);
  const synced = useCart((s) => s.synced);
  const lines = useCart((s) => s.lines);
  const replaceCart = useCart((s) => s.replace);
  const markSynced = useCart((s) => s.markSynced);

  const wishlistReady = useWishlist((s) => s.ready);
  const wishlistIds = useWishlist((s) => s.ids);
  const replaceWishlist = useWishlist((s) => s.replace);

  // Signing out clears the sync flag so the next sign-in re-merges.
  React.useEffect(() => {
    if (!signedIn) markSynced(false);
  }, [signedIn, markSynced]);

  React.useEffect(() => {
    if (!signedIn || !cartReady || !wishlistReady || synced) return;

    let cancelled = false;
    markSynced(true); // optimistic: prevents a double run in StrictMode

    (async () => {
      try {
        const [cartRes, wishRes] = await Promise.all([
          fetch("/api/cart/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lines }),
          }),
          fetch("/api/wishlist/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: wishlistIds }),
          }),
        ]);

        if (cancelled) return;

        if (cartRes.ok) {
          const data = await cartRes.json();
          if (Array.isArray(data.lines)) replaceCart(data.lines);
        }
        if (wishRes.ok) {
          const data = await wishRes.json();
          if (Array.isArray(data.ids)) replaceWishlist(data.ids);
        }
      } catch {
        // Offline or transient failure — keep local state and retry next load.
        if (!cancelled) markSynced(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Intentionally not depending on `lines`/`wishlistIds`: this runs once
    // per sign-in, not on every cart mutation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, cartReady, wishlistReady, synced]);

  return null;
}
