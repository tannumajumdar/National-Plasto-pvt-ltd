import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { updateProfileSchema } from "@/lib/validations";
import { fail, ok, parseBody } from "@/lib/api";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("Not signed in.", 401);

  const { data, error } = await parseBody(request, updateProfileSchema);
  if (error) return error;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { name: data.name, phone: data.phone || null },
    select: { id: true, name: true, email: true, phone: true },
  });

  return ok({ user: updated });
}
