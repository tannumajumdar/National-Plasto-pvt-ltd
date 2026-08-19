import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { addressSchema } from "@/lib/validations";
import { fail, ok, parseBody } from "@/lib/api";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return fail("Not signed in.", 401);

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return ok({ addresses });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("Not signed in.", 401);

  const { data, error } = await parseBody(request, addressSchema);
  if (error) return error;

  const count = await prisma.address.count({ where: { userId: user.id } });
  if (count >= 10) return fail("You can save up to 10 addresses.", 409);

  // The first address saved becomes the default automatically.
  const makeDefault = data.isDefault || count === 0;

  const address = await prisma.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }
    return tx.address.create({
      data: {
        userId: user.id,
        label: data.label,
        fullName: data.fullName,
        phone: data.phone,
        line1: data.line1,
        line2: data.line2 || null,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        isDefault: makeDefault,
      },
    });
  });

  return ok({ address }, { status: 201 });
}
