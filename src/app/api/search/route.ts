import { searchProducts } from "@/lib/queries/products";
import { ok } from "@/lib/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const limit = Math.min(Number(searchParams.get("limit")) || 8, 20);

  const products = await searchProducts(q, limit);

  return ok(
    { products },
    { headers: { "Cache-Control": "private, max-age=30" } },
  );
}
