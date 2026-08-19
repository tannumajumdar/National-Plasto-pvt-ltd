import { NextResponse } from "next/server";

import { destroySessionCookie } from "@/lib/auth/session";
import { absoluteUrl } from "@/lib/utils";

/** GET so it can be a plain link; POST for programmatic sign-out. */
export async function GET() {
  await destroySessionCookie();
  return NextResponse.redirect(absoluteUrl("/"), { status: 303 });
}

export async function POST() {
  await destroySessionCookie();
  return NextResponse.json({ ok: true });
}
