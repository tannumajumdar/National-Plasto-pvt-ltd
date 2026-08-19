import { resolveCart } from "@/lib/cart";
import { cartSyncSchema } from "@/lib/validations";
import { ok, parseBody } from "@/lib/api";

/**
 * Resolves client cart lines into full display data with server-authoritative
 * pricing. The client never supplies prices.
 */
export async function POST(request: Request) {
  const { data, error } = await parseBody(request, cartSyncSchema);
  if (error) return error;

  const { lines, totals } = await resolveCart(data.lines);
  return ok({ lines, totals });
}
