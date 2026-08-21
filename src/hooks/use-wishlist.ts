"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { markReadyOnHydration } from "@/hooks/use-persist-ready";

interface WishlistState {
  ids: string[];
  ready: boolean;
  toggle: (productId: string) => boolean;
  add: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
  replace: (ids: string[]) => void;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      ready: false,

      toggle: (productId) => {
        const has = get().ids.includes(productId);
        set((s) => ({
          ids: has ? s.ids.filter((id) => id !== productId) : [...s.ids, productId],
        }));
        return !has;
      },

      add: (productId) =>
        set((s) => (s.ids.includes(productId) ? s : { ids: [...s.ids, productId] })),

      remove: (productId) => set((s) => ({ ids: s.ids.filter((id) => id !== productId) })),

      clear: () => set({ ids: [] }),

      replace: (ids) => set({ ids }),
    }),
    {
      name: "np-wishlist",
      version: 1,
      partialize: (s) => ({ ids: s.ids }),
      onRehydrateStorage: () => (_state, error) => {
        // Do NOT touch `useWishlist` here — persist hydrates synchronously
        // inside create(), so the binding above does not exist yet.
        if (error) {
          console.warn("[wishlist] could not restore the saved wishlist:", error);
        }
      },
    },
  ),
);

markReadyOnHydration(useWishlist);

export function useIsWishlisted(productId: string): boolean {
  return useWishlist((s) => s.ids.includes(productId));
}
