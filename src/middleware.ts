import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifySession } from "@/lib/auth/jwt";

/**
 * Edge-level route protection.
 *
 * This is a fast first gate that redirects unauthenticated traffic before it
 * reaches a page. It is NOT the only check — every protected page and admin
 * action re-verifies the session server-side via requireUser/requireAdmin,
 * because middleware alone cannot confirm the user still exists or is active.
 */

const USER_PROTECTED = ["/account", "/checkout"];
const ADMIN_PREFIX = "/admin";
const ADMIN_PUBLIC = ["/admin/login"];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isAdminRoute =
    pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`);
  const isAdminPublic = ADMIN_PUBLIC.some((p) => pathname === p);
  const isUserProtected = USER_PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (!isAdminRoute && !isUserProtected) return NextResponse.next();
  if (isAdminRoute && isAdminPublic) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (isAdminRoute) {
    if (!session) {
      const url = new URL("/admin/login", request.url);
      url.searchParams.set("next", pathname + search);
      return NextResponse.redirect(url);
    }
    if (session.role !== "ADMIN") {
      const url = new URL("/admin/login", request.url);
      url.searchParams.set("error", "forbidden");
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/account/:path*",
    "/checkout/:path*",
    "/admin/:path*",
  ],
};
