import type { Metadata } from "next";

import { AddressManager, type Address } from "@/components/account/address-manager";
import prisma from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Saved Addresses",
  robots: { index: false, follow: false },
};

export default async function AddressesPage() {
  const user = await requireUser("/account/addresses");

  const rows = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  const addresses: Address[] = rows.map((a) => ({
    id: a.id,
    label: a.label,
    fullName: a.fullName,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2 ?? "",
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    isDefault: a.isDefault,
  }));

  return <AddressManager addresses={addresses} />;
}
