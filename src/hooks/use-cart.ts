"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { markReadyOnHydration } from "@/hooks/use-persist-ready";

export interface CartLine {
  productId: string;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  /** True once the persisted store has rehydrated — guards SSR mismatch. */
  ready: boolean;
  /** Set after a signed-in user's cart has merged with the server. */
  synced: boolean;

  add: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  replace: (lines: CartLine[]) => void;
  markSynced: (value: boolean) => void;
}

const MAX_QTY = 99;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      ready: false,
      synced: false,

      add: (productId, quantity = 1) =>
        set((state) => {
          const existing = state.lines.find((l) => l.productId === productId);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.productId === productId
                  ? { ...l, quantity: Math.min(l.quantity + quantity, MAX_QTY) }
                  : l,
              ),
            };
          }
          return {
            lines: [...state.lines, { productId, quantity: Math.min(quantity, MAX_QTY) }],
          };
        }),

      setQuantity: (productId, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.productId !== productId)
              : state.lines.map((l) =>
                  l.productId === productId
                    ? { ...l, quantity: Math.min(quantity, MAX_QTY) }
                    : l,
                ),
        })),

      remove: (productId) =>
        set((state) => ({ lines: state.lines.filter((l) => l.productId !== productId) })),

      clear: () => set({ lines: [] }),

      replace: (lines) => set({ lines }),

      markSynced: (value) => set({ synced: value }),
    }),
    {
      name: "np-cart",
      version: 1,
      partialize: (s) => ({ lines: s.lines }),
      onRehydrateStorage: () => (_state, error) => {
        // Do NOT touch `useCart` here — persist hydrates synchronously inside
        // create(), so the binding above does not exist yet. See
        // markReadyOnHydration() for the whole story.
        if (error) {
          console.warn("[cart] could not restore the saved cart:", error);
        }
      },
    },
  ),
);

markReadyOnHydration(useCart);

/** Total number of units in the cart. */
export function useCartCount(): number {
  return useCart((s) => s.lines.reduce((n, l) => n + l.quantity, 0));
}
