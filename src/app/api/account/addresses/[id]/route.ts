import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { addressSchema } from "@/lib/validations";
import { fail, ok, parseBody } from "@/lib/api";

/** Confirms the address belongs to the signed-in user before any mutation. */
async function ownedAddress(userId: string, id: string) {
  return prisma.address.findFirst({ where: { id, userId }, select: { id: true } });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return fail("Not signed in.", 401);

  const { id } = await params;
  if (!(await ownedAddress(user.id, id))) return fail("Address not found.", 404);

  const { data, error } = await parseBody(request, addressSchema);
  if (error) return error;

  const address = await prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }
    return tx.address.update({
      where: { id },
      data: {
        label: data.label,
        fullName: data.fullName,
        phone: data.phone,
        line1: data.line1,
        line2: data.line2 || null,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        isDefault: data.isDefault,
      },
    });
  });

  return ok({ address });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return fail("Not signed in.", 401);

  const { id } = await params;
  if (!(await ownedAddress(user.id, id))) return fail("Address not found.", 404);

  await prisma.address.delete({ where: { id } });

  // Promote another address so the user always has a default.
  const remaining = await prisma.address.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, isDefault: true },
  });
  if (remaining && !remaining.isDefault) {
    await prisma.address.update({ where: { id: remaining.id }, data: { isDefault: true } });
  }

  return ok({ message: "Address removed." });
}
