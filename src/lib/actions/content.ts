"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import prisma from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import {
  aboutContentSchema,
  contactContentSchema,
  heroContentSchema,
  statSchema,
  whyContentSchema,
} from "@/lib/validations";
import { fieldErrors } from "@/lib/api";
import type { ActionResult } from "@/lib/actions/products";

function revalidateContent() {
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/admin/content");
}

async function writeSetting(key: string, value: unknown) {
  await prisma.siteSetting.upsert({
    where: { key },
    update: { value: value as object },
    create: { key, value: value as object },
  });
}

export async function saveHero(raw: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = heroContentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Please correct the highlighted fields.", fields: fieldErrors(parsed.error) };
  }
  const d = parsed.data;

  await writeSetting("hero", {
    eyebrow: d.eyebrow,
    headline: d.headline,
    subheadline: d.subheadline,
    primaryCta: { label: d.primaryCtaLabel, href: d.primaryCtaHref },
    secondaryCta: { label: d.secondaryCtaLabel, href: d.secondaryCtaHref },
    image: d.image || null,
  });

  revalidateContent();
  return { ok: true, message: "Homepage hero updated." };
}

export async function saveAbout(raw: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = aboutContentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Please correct the highlighted fields.", fields: fieldErrors(parsed.error) };
  }

  await writeSetting("about", { ...parsed.data, image: parsed.data.image || null });

  revalidateContent();
  return { ok: true, message: "About section updated." };
}

export async function saveWhyChooseUs(raw: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = whyContentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Please correct the highlighted fields.", fields: fieldErrors(parsed.error) };
  }

  await writeSetting("whyChooseUs", parsed.data);

  revalidateContent();
  return { ok: true, message: "Why Choose Us updated." };
}

export async function saveContact(raw: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = contactContentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Please correct the highlighted fields.", fields: fieldErrors(parsed.error) };
  }

  await writeSetting("contact", parsed.data);

  revalidateContent();
  return { ok: true, message: "Contact details updated." };
}

const journeySchema = z.object({
  heading: z.string().trim().min(1).max(160),
  subheading: z.string().trim().max(400),
  milestones: z
    .array(
      z.object({
        year: z.string().trim().max(20),
        title: z.string().trim().min(1).max(120),
        body: z.string().trim().max(400),
      }),
    )
    .max(20),
});

export async function saveJourney(raw: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = journeySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Please correct the highlighted fields.", fields: fieldErrors(parsed.error) };
  }

  await writeSetting("journey", parsed.data);

  revalidateContent();
  return { ok: true, message: "Company journey updated." };
}

/**
 * Statistics.
 *
 * "Products" and "Collections" resolve live from the database, so their value
 * is not editable — only whether they are shown. Figures we were never given
 * (years of experience, customer count) stay hidden until an admin enters a
 * real number.
 */
export async function saveStats(raw: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = z.object({ stats: z.array(statSchema).max(12) }).safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Please correct the highlighted fields.", fields: fieldErrors(parsed.error) };
  }

  for (const stat of parsed.data.stats) {
    const existing = await prisma.stat.findUnique({
      where: { id: stat.id },
      select: { computed: true },
    });
    if (!existing) continue;

    // A stat with no real figure cannot be published.
    const publishable = Boolean(existing.computed) || stat.value.trim() !== "";

    await prisma.stat.update({
      where: { id: stat.id },
      data: {
        label: stat.label,
        value: stat.value,
        suffix: stat.suffix || null,
        isPublished: stat.isPublished && publishable,
      },
    });
  }

  revalidateContent();
  return { ok: true, message: "Statistics updated." };
}
