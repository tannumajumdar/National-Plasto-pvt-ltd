"use client";

import * as React from "react";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
}

interface SessionState {
  user: SessionUser | null;
  loading: boolean;
  refresh: () => void;
}

const SessionContext = React.createContext<SessionState>({
  user: null,
  loading: true,
  refresh: () => {},
});

/**
 * Fetches the session once on mount and shares it across the storefront.
 *
 * Keeping this on the client is what allows the store layout to stay free of
 * cookie access, so catalogue pages remain statically rendered and cacheable.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [nonce, setNonce] = React.useState(0);

  React.useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    fetch("/api/auth/me", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((data) => setUser(data.user ?? null))
      .catch((err) => {
        if (err?.name !== "AbortError") setUser(null);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [nonce]);

  const value = React.useMemo(
    () => ({ user, loading, refresh: () => setNonce((n) => n + 1) }),
    [user, loading],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return React.useContext(SessionContext);
}
