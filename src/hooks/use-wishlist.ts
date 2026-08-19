"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

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
      onRehydrateStorage: () => () => {
        useWishlist.setState({ ready: true });
      },
    },
  ),
);

export function useIsWishlisted(productId: string): boolean {
  return useWishlist((s) => s.ids.includes(productId));
}
