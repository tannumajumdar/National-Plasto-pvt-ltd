import { NextResponse } from "next/server";
import { z, ZodError, type ZodTypeAny } from "zod";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** Flattens a ZodError into { field: firstMessage } for form display. */
export function fieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function validationFailed(error: ZodError) {
  return NextResponse.json(
    { error: "Please correct the highlighted fields.", fields: fieldErrors(error) },
    { status: 422 },
  );
}

/**
 * Parses and validates a JSON request body.
 *
 * Generic over the schema rather than over a payload type, so `data` gets the
 * schema's OUTPUT type — transforms and `.default()` are reflected, instead of
 * collapsing to the optional input shape.
 */
export async function parseBody<S extends ZodTypeAny>(
  request: Request,
  schema: S,
): Promise<{ data: z.output<S>; error: null } | { data: null; error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { data: null, error: fail("Request body must be valid JSON.") };
  }

  const result = schema.safeParse(raw);
  if (!result.success) return { data: null, error: validationFailed(result.error) };
  return { data: result.data, error: null };
}

/**
 * Minimal fixed-window rate limiter, keyed in memory.
 *
 * Sufficient for throttling auth endpoints on a single instance. A multi-
 * instance deployment should move this to Redis or the database.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  { limit = 8, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {},
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { allowed: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfter: 0 };
}

export function clientIp(request: Request): string {
  const h = request.headers;
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

export function tooManyRequests(retryAfter: number) {
  return NextResponse.json(
    { error: `Too many attempts. Try again in ${retryAfter}s.` },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}
