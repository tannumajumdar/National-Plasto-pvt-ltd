import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import prisma from "@/lib/db/prisma";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  verifySession,
  type SessionPayload,
} from "@/lib/auth/jwt";

/**
 * Reads and verifies the session cookie.
 * Cached per-request so multiple components share one verification.
 */
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
});

/**
 * Loads the full user record for the current session.
 * Returns null if the session is stale (user deleted or deactivated).
 */
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user || !user.isActive) return null;
  return user;
});

export async function createSessionCookie(payload: SessionPayload) {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/* ------------------------------------------------------------------
   Route guards
   ------------------------------------------------------------------ */

/** Requires any signed-in user; redirects to login preserving intent. */
export async function requireUser(returnTo = "/account") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}

/** Requires an admin; non-admins are sent to the admin login, not the store. */
export async function requireAdmin(returnTo = "/admin") {
  const user = await getCurrentUser();
  if (!user) redirect(`/admin/login?next=${encodeURIComponent(returnTo)}`);
  if (user.role !== "ADMIN") redirect("/admin/login?error=forbidden");
  return user;
}
