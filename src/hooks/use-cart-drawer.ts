"use client";

import { create } from "zustand";

/**
 * Open/closed state for the slide-over cart.
 *
 * Kept separate from `useCart` on purpose: that store is persisted to
 * localStorage, and a drawer that reopened itself on every page load would be
 * infuriating. This one is deliberately in-memory only.
 */
interface CartDrawerState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

export const useCartDrawer = create<CartDrawerState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
}));
