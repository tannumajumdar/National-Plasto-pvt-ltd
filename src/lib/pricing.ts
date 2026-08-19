/**
 * Denormalised pricing sort keys.
 *
 * MySQL cannot express NULLS LAST, and catalogue sorting must respect the
 * discounted price a customer actually pays. Both are precomputed on write
 * so every read path is a plain indexed comparison.
 *
 * Call this from every code path that writes price or discountPrice.
 */
export function pricingFields(
  price: number | null | undefined,
  discountPrice: number | null | undefined,
): { hasPrice: boolean; sortPrice: number } {
  const base = price ?? null;
  const promo = discountPrice ?? null;

  if (base === null) return { hasPrice: false, sortPrice: 0 };

  const effective = promo !== null && promo > 0 && promo < base ? promo : base;
  return { hasPrice: true, sortPrice: effective };
}
