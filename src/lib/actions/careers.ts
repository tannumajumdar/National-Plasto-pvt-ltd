"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import prisma from "@/lib/db/prisma";
import { fieldErrors } from "@/lib/api";
import type { ActionResult } from "@/lib/actions/products";

const applicationSchema = z.object({
  /** Empty means a speculative application, not tied to an open role. */
  openingId: z.string().trim().optional().or(z.literal("")),
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().email("Please enter a valid email address"),
  phone: z
    .string()
    .trim()
    .min(7, "Please enter a phone number we can reach you on")
    .max(20),
  message: z.string().trim().max(4000).optional().or(z.literal("")),
  cvUrl: z.string().trim().url("That does not look like a link").optional().or(z.literal("")),
});

/**
 * Records an application against a role.
 *
 * The role's title is copied onto the row rather than only referenced, so the
 * inbox still reads correctly after the opening comes down — which is exactly
 * when someone goes looking through old applications.
 */
export async function submitApplication(raw: unknown): Promise<ActionResult> {
  const parsed = applicationSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fields: fieldErrors(parsed.error),
    };
  }
  const data = parsed.data;

  let roleTitle = "Speculative application";
  if (data.openingId) {
    const opening = await prisma.jobOpening.findUnique({
      where: { id: data.openingId },
      select: { title: true, isPublished: true },
    });
    if (!opening || !opening.isPublished) {
      return {
        ok: false,
        message: "That role has closed. You are welcome to apply speculatively.",
      };
    }
    roleTitle = opening.title;
  }

  await prisma.jobApplication.create({
    data: {
      openingId: data.openingId || null,
      roleTitle,
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message || null,
      cvUrl: data.cvUrl || null,
    },
  });

  revalidatePath("/admin/careers");
  revalidatePath("/admin");

  return {
    ok: true,
    message: "Thank you — your application has reached us. We will be in touch.",
  };
}
