import "server-only";

import { cache } from "react";

import prisma from "@/lib/db/prisma";
import { safeRead } from "@/lib/db/safe";
import type { JobOpeningDTO } from "@/types";

/**
 * Open roles, newest-first within the order an admin set.
 *
 * Only published roles ever leave this file — a draft is written over several
 * sittings and must not appear on the site before it is ready.
 */
export const getJobOpenings = cache(async (): Promise<JobOpeningDTO[]> =>
  safeRead(async () => {
    const rows = await prisma.jobOpening.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        location: true,
        employment: true,
        department: true,
        summary: true,
        description: true,
        createdAt: true,
      },
    });

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      location: r.location,
      employment: r.employment,
      department: r.department,
      summary: r.summary,
      description: r.description,
      postedAt: r.createdAt.toISOString(),
    }));
  }, []),
);

export const getJobOpeningBySlug = cache(
  async (slug: string): Promise<JobOpeningDTO | null> =>
    safeRead(async () => {
      const r = await prisma.jobOpening.findUnique({
        where: { slug },
        select: {
          id: true,
          title: true,
          slug: true,
          location: true,
          employment: true,
          department: true,
          summary: true,
          description: true,
          isPublished: true,
          createdAt: true,
        },
      });
      if (!r || !r.isPublished) return null;

      return {
        id: r.id,
        title: r.title,
        slug: r.slug,
        location: r.location,
        employment: r.employment,
        department: r.department,
        summary: r.summary,
        description: r.description,
        postedAt: r.createdAt.toISOString(),
      };
    }, null),
);
