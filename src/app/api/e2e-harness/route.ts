/**
 * TEMPORARY end-to-end test harness route — DELETE BEFORE DEPLOYING.
 *
 * Server actions cannot be invoked over plain HTTP, so this route calls them
 * with a real cookie-backed admin session, exercising the true production
 * code path (including requireAdmin) rather than a re-implementation.
 *
 * Refuses to run unless E2E_HARNESS=1 is set in the environment.
 */
import { requireAdmin } from "@/lib/auth/session";
import { fail, ok } from "@/lib/api";
import {
  bulkUpdateProducts,
  createProduct,
  deleteProduct,
  updateProduct,
  updateStock,
  updatePrice,
} from "@/lib/actions/products";
import { updateOrderStatus } from "@/lib/actions/orders";
import {
  deleteCategory,
  saveCategory,
  toggleCategoryActive,
} from "@/lib/actions/categories";
import { moderateReview, setCustomerActive } from "@/lib/actions/misc";

const ACTIONS: Record<string, (...a: never[]) => Promise<unknown>> = {
  createProduct,
  updateProduct,
  deleteProduct,
  bulkUpdateProducts,
  updateStock,
  updatePrice,
  updateOrderStatus,
  saveCategory,
  deleteCategory,
  toggleCategoryActive,
  moderateReview,
  setCustomerActive,
};

export async function POST(request: Request) {
  // Fails closed twice over: off unless explicitly enabled, and never
  // reachable in a production build even if the flag leaks into that env.
  if (process.env.NODE_ENV === "production") return fail("Not found.", 404);
  if (process.env.E2E_HARNESS !== "1") return fail("Harness disabled.", 404);
  await requireAdmin();

  const { action, args } = (await request.json()) as { action: string; args: unknown[] };
  const fn = ACTIONS[action];
  if (!fn) return fail(`Unknown action "${action}".`, 400);

  try {
    const result = await fn(...(args as never[]));
    return ok({ result });
  } catch (err) {
    return ok({
      threw: true,
      name: (err as Error).name,
      message: (err as Error).message,
    });
  }
}
