"use client";

import type { StoreApi, UseBoundStore } from "zustand";

/**
 * Flips a persisted store's `ready` flag once rehydration has settled.
 *
 * This exists because of a sharp edge in zustand's `persist` middleware: it
 * hydrates **synchronously, inside `create()`**. Anything you put in
 * `onRehydrateStorage` therefore runs *before* the `const` holding the store
 * has been initialised, so the obvious-looking
 *
 *     onRehydrateStorage: () => () => { useCart.setState({ ready: true }) }
 *
 * throws `ReferenceError: Cannot access 'useCart' before initialization`.
 * Zustand catches that internally and never rethrows, so the flag silently
 * stays `false` for ever and every component gated on it renders a loading
 * skeleton that never resolves.
 *
 * Call this *after* `create()`, where the binding exists.
 *
 * `ready` must never get stuck: if the stored value is corrupt or storage is
 * unavailable, hydration never "finishes" and the finish listener never fires,
 * so we mark ready anyway. A visitor with a bad localStorage entry gets an
 * empty cart, not a permanent spinner.
 */
type PersistedStore<T> = UseBoundStore<StoreApi<T>> & {
  persist?: {
    hasHydrated: () => boolean;
    onFinishHydration: (cb: () => void) => () => void;
  };
};

export function markReadyOnHydration<T extends { ready: boolean }>(
  store: PersistedStore<T>,
): void {
  // On the server `ready` stays false, which is what the components render
  // against; the client flips it before React's first paint.
  if (typeof window === "undefined") return;

  const setReady = () => store.setState({ ready: true } as Partial<T>);

  const persist = store.persist;
  if (!persist) {
    setReady();
    return;
  }

  if (persist.hasHydrated()) {
    setReady();
    return;
  }

  const unsubscribe = persist.onFinishHydration(() => {
    unsubscribe();
    setReady();
  });

  // Hydration that threw never reaches the finish listener. Do not strand
  // the UI on a skeleton because of one unreadable value.
  setReady();
}
