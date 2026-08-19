import type { Metadata } from "next";

import { AdminMenuButton } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { ContentEditor } from "@/components/admin/content-editor";
import prisma from "@/lib/db/prisma";
import {
  getAbout,
  getContact,
  getHero,
  getJourney,
  getWhyChooseUs,
} from "@/lib/queries/content";

export const metadata: Metadata = {
  title: "Homepage & Content",
  robots: { index: false, follow: false },
};

export default async function AdminContentPage() {
  const [hero, about, why, contact, journey, statRows] = await Promise.all([
    getHero(),
    getAbout(),
    getWhyChooseUs(),
    getContact(),
    getJourney(),
    // Every stat, including unpublished ones, so an admin can fill them in.
    prisma.stat.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const stats = statRows.map((s) => ({
    id: s.id,
    label: s.label,
    value: s.value,
    suffix: s.suffix,
    icon: s.icon,
    computed: s.computed,
    isPublished: s.isPublished,
  }));

  return (
    <>
      <AdminTopbar
        title="Homepage & Content"
        description="Edit the text and figures shown across the storefront"
        crumbs={[{ label: "Homepage" }]}
        menuSlot={<AdminMenuButton />}
      />
      <div className="p-5 sm:p-8">
        <ContentEditor
          hero={hero}
          about={about}
          why={why}
          contact={contact}
          journey={journey}
          stats={stats}
        />
      </div>
    </>
  );
}
