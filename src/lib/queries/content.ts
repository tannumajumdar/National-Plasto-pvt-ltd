import "server-only";

import { cache } from "react";

import prisma from "@/lib/db/prisma";
import type {
  AboutContent,
  ContactContent,
  HeroContent,
  JourneyContent,
  StatDTO,
  WhyChooseUsContent,
} from "@/types";

/* ------------------------------------------------------------------
   Defaults
   Every block falls back to these when the DB has no row yet, so the
   storefront renders correctly on a fresh install and an admin can
   override any field later.
   ------------------------------------------------------------------ */

export const DEFAULT_HERO: HeroContent = {
  eyebrow: "National Plasto Pvt. Ltd. · Kolkata",
  headline: "Quality Plastic Products Designed for Modern Living",
  subheadline:
    "Discover durable, stylish and reliable products from National Plasto Pvt. Ltd.",
  primaryCta: { label: "Explore Products", href: "/products" },
  secondaryCta: { label: "View Collections", href: "/collections" },
  image: null,
};

export const DEFAULT_ABOUT: AboutContent = {
  heading: "Built in Kolkata, made for everyday Indian homes",
  intro:
    "National Plasto Pvt. Ltd. is a plastic furniture and household products manufacturer based in Kolkata, West Bengal. We design and produce across three collections — NEXT, NATIONAL and NATIONAL SAPPHIRE — each built to the same standard of durability and finish.",
  vision:
    "To be recognised across eastern India as the plastic products brand that customers trust for everyday durability and honest value.",
  mission:
    "To manufacture dependable, well-finished plastic products, to keep our range wide enough to serve every home, and to stand behind everything that carries our name.",
  quality:
    "Every product is checked for finish, structural strength and consistency before it leaves our facility.",
  image: null,
};

export const DEFAULT_WHY: WhyChooseUsContent = {
  heading: "Why choose National Plasto",
  subheading:
    "Six commitments that shape how we design, manufacture and support every product.",
  items: [
    { icon: "BadgeCheck", title: "Quality Products", body: "Consistent finish and build standards applied across all three collections." },
    { icon: "ShieldCheck", title: "Durable Materials", body: "Products engineered to hold up to daily use in real Indian homes." },
    { icon: "Sparkles", title: "Modern Designs", body: "Forms and formats designed around how people actually live today." },
    { icon: "LayoutGrid", title: "Wide Product Range", body: "Three collections spanning seating, storage, tables and more." },
    { icon: "HeartHandshake", title: "Customer Satisfaction", body: "We stand behind what we make and support customers after the sale." },
    { icon: "Truck", title: "Reliable Service", body: "Dependable dispatch and clear communication from order to delivery." },
  ],
};

export const DEFAULT_CONTACT: ContactContent = {
  addressLine1: "National Plasto Pvt. Ltd.",
  addressLine2: "Kolkata, West Bengal",
  pincode: "700001",
  phonePrimary: "+91 00000 00000",
  phoneSecondary: "",
  emailGeneral: "info@nationalplasto.com",
  emailSales: "sales@nationalplasto.com",
  hoursWeekday: "Monday – Saturday, 10:00 AM – 7:00 PM",
  hoursWeekend: "Sunday — Closed",
  mapEmbedUrl: "https://www.google.com/maps?q=Kolkata,West%20Bengal,India&output=embed",
  mapLabel: "Kolkata, West Bengal",
  note: "Placeholder contact details — update from Admin → Content → Contact.",
};

export const DEFAULT_JOURNEY: JourneyContent = {
  heading: "Our journey",
  subheading: "Milestones are editable from the admin panel.",
  milestones: [
    { year: "", title: "Company founded", body: "Add the founding year and story from Admin → Content." },
    { year: "", title: "NATIONAL collection introduced", body: "Our flagship range." },
    { year: "", title: "NEXT collection launched", body: "A contemporary line for modern homes." },
    { year: "", title: "NATIONAL SAPPHIRE launched", body: "Our premium tier." },
  ],
};

const DEFAULTS = {
  hero: DEFAULT_HERO,
  about: DEFAULT_ABOUT,
  whyChooseUs: DEFAULT_WHY,
  contact: DEFAULT_CONTACT,
  journey: DEFAULT_JOURNEY,
} as const;

type SettingKey = keyof typeof DEFAULTS;

/**
 * Reads a content block, shallow-merged over its defaults so a partially
 * filled row never leaves the UI with undefined fields.
 * Falls back to defaults entirely if the database is unreachable — the
 * marketing pages should still render.
 */
export async function getSetting<K extends SettingKey>(
  key: K,
): Promise<(typeof DEFAULTS)[K]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    if (!row?.value) return DEFAULTS[key];
    return { ...DEFAULTS[key], ...(row.value as object) } as (typeof DEFAULTS)[K];
  } catch {
    return DEFAULTS[key];
  }
}

export const getHero = cache(() => getSetting("hero"));
export const getAbout = cache(() => getSetting("about"));
export const getWhyChooseUs = cache(() => getSetting("whyChooseUs"));
export const getContact = cache(() => getSetting("contact"));
export const getJourney = cache(() => getSetting("journey"));

/**
 * Published stats only. "products" and "collections" resolve live from the
 * database so those counters are always accurate; the rest show whatever an
 * admin has entered. Stats with no real figure stay hidden.
 */
export const getStats = cache(async (): Promise<StatDTO[]> => {
  const [rows, productCount, collectionCount] = await Promise.all([
    prisma.stat.findMany({ where: { isPublished: true }, orderBy: { sortOrder: "asc" } }),
    prisma.product.count({ where: { isPublished: true } }),
    prisma.collection.count({ where: { isActive: true } }),
  ]);

  return rows
    .map((s) => ({
      id: s.id,
      label: s.label,
      value:
        s.computed === "products"
          ? String(productCount)
          : s.computed === "collections"
            ? String(collectionCount)
            : s.value,
      suffix: s.computed === "collections" ? "" : s.suffix,
      icon: s.icon,
      computed: s.computed,
      isPublished: s.isPublished,
    }))
    .filter((s) => s.value.trim() !== "");
});

export const getActiveBanners = cache(async (placement = "home") => {
  const rows = await prisma.banner.findMany({
    where: { isActive: true, placement },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map((b) => ({
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    image: b.image,
    link: b.link,
    ctaLabel: b.ctaLabel,
  }));
});
