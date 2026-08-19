import { getCurrentUser } from "@/lib/auth/session";
import { ok } from "@/lib/api";

/**
 * Current session, resolved per-request.
 *
 * The storefront layout deliberately does NOT read cookies: doing so would
 * force every page beneath it into dynamic rendering and discard the ISR
 * caching that the catalogue pages rely on. The header fetches this instead.
 */
export async function GET() {
  const user = await getCurrentUser();

  return ok(
    {
      user: user
        ? { id: user.id, name: user.name, email: user.email, role: user.role }
        : null,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
