"use client";

import { create } from "zustand";

/**
 * Shared open/close state for the admin mobile drawer, so the trigger can
 * live in the topbar while the drawer itself lives in the sidebar component.
 */
interface AdminNavState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

export const useAdminNav = create<AdminNavState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
}));
