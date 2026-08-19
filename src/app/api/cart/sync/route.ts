import { getCurrentUser } from "@/lib/auth/session";
import { mergeCartForUser } from "@/lib/cart";
import { cartSyncSchema } from "@/lib/validations";
import { fail, ok, parseBody } from "@/lib/api";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("Not signed in.", 401);

  const { data, error } = await parseBody(request, cartSyncSchema);
  if (error) return error;

  const lines = await mergeCartForUser(user.id, data.lines);
  return ok({ lines });
}
