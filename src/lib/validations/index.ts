import { z } from "zod";

import { INDIAN_STATES } from "@/lib/constants";

/* ------------------------------------------------------------------
   Shared field rules
   ------------------------------------------------------------------ */

const email = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address")
  .max(160)
  .toLowerCase();

/** Accepts 10-digit Indian mobiles, optionally with +91 / 0 prefix. */
const phone = z
  .string()
  .trim()
  .regex(/^(?:\+?91[-\s]?|0)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[a-z]/, "Include at least one lowercase letter")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/\d/, "Include at least one number");

const pincode = z
  .string()
  .trim()
  .regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit pincode");

/* ------------------------------------------------------------------
   Auth
   ------------------------------------------------------------------ */

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
    email,
    phone: phone.optional().or(z.literal("")),
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  phone: phone.optional().or(z.literal("")),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/* ------------------------------------------------------------------
   Addresses & checkout
   ------------------------------------------------------------------ */

export const addressSchema = z.object({
  label: z.string().trim().max(30).default("Home"),
  fullName: z.string().trim().min(2, "Full name is required").max(80),
  phone,
  line1: z.string().trim().min(5, "Address is required").max(240),
  line2: z.string().trim().max(240).optional().or(z.literal("")),
  city: z.string().trim().min(2, "City is required").max(80),
  state: z.enum(INDIAN_STATES as unknown as [string, ...string[]], {
    errorMap: () => ({ message: "Select a state" }),
  }),
  pincode,
  isDefault: z.boolean().default(false),
});

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "Full name is required").max(80),
  customerEmail: email,
  customerPhone: phone,
  line1: z.string().trim().min(5, "Address is required").max(240),
  line2: z.string().trim().max(240).optional().or(z.literal("")),
  city: z.string().trim().min(2, "City is required").max(80),
  state: z.enum(INDIAN_STATES as unknown as [string, ...string[]], {
    errorMap: () => ({ message: "Select a state" }),
  }),
  pincode,
  paymentMethod: z.enum(["COD", "RAZORPAY"]).default("COD"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/* ------------------------------------------------------------------
   Contact
   ------------------------------------------------------------------ */

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  email,
  phone: phone.optional().or(z.literal("")),
  subject: z.string().trim().min(3, "Subject is required").max(120),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000),
});

/* ------------------------------------------------------------------
   Reviews
   ------------------------------------------------------------------ */

export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1, "Choose a rating").max(5),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  body: z.string().trim().max(2000).optional().or(z.literal("")),
});

/* ------------------------------------------------------------------
   Cart
   ------------------------------------------------------------------ */

export const cartLineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(99),
});

export const cartSyncSchema = z.object({
  lines: z.array(cartLineSchema).max(100),
});

/* ------------------------------------------------------------------
   Admin — products
   ------------------------------------------------------------------ */

/** Rupees in the form; converted to paise before persisting. */
const rupeeField = z
  .union([z.coerce.number().min(0).max(10_000_000), z.literal("")])
  .optional()
  .transform((v) => (v === "" || v === undefined ? null : Math.round(Number(v) * 100)));

export const adminProductSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(160),
    slug: z
      .string()
      .trim()
      .min(1, "Slug is required")
      .max(180)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only"),
    sku: z.string().trim().min(1, "SKU is required").max(60),
    collectionId: z.string().min(1, "Choose a collection"),
    categoryId: z.string().optional().or(z.literal("")),
    shortDescription: z.string().trim().max(300).optional().or(z.literal("")),
    description: z.string().trim().max(5000).optional().or(z.literal("")),
    price: rupeeField,
    discountPrice: rupeeField,
    stock: z.coerce.number().int().min(0).max(1_000_000).default(0),
    trackStock: z.coerce.boolean().default(true),
    isFeatured: z.coerce.boolean().default(false),
    isNew: z.coerce.boolean().default(false),
    isBestSeller: z.coerce.boolean().default(false),
    isPremium: z.coerce.boolean().default(false),
    isLimitedEdition: z.coerce.boolean().default(false),
    isPublished: z.coerce.boolean().default(true),
    needsReview: z.coerce.boolean().default(false),
    metaTitle: z.string().trim().max(180).optional().or(z.literal("")),
    metaDescription: z.string().trim().max(320).optional().or(z.literal("")),
    images: z.array(z.string().min(1)).max(10).default([]),
    features: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
    specifications: z
      .array(
        z.object({
          name: z.string().trim().min(1).max(80),
          value: z.string().trim().min(1).max(300),
        }),
      )
      .max(30)
      .default([]),
  })
  .refine(
    (d) => d.discountPrice === null || d.price === null || d.discountPrice < d.price,
    { message: "Discount price must be lower than the regular price", path: ["discountPrice"] },
  )
  .refine((d) => !(d.discountPrice !== null && d.price === null), {
    message: "Set a regular price before adding a discount price",
    path: ["discountPrice"],
  });

export type AdminProductInput = z.input<typeof adminProductSchema>;
export type AdminProductOutput = z.output<typeof adminProductSchema>;

/* ------------------------------------------------------------------
   Admin — collections, orders, content
   ------------------------------------------------------------------ */

export const adminCollectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(90)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only"),
  tagline: z.string().trim().max(160).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  bannerImage: z.string().trim().optional().or(z.literal("")),
  accent: z.enum(["next", "national", "sapphire"]).default("national"),
  isActive: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const adminCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(90)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  image: z.string().trim().optional().or(z.literal("")),
  /// Empty means a top-level group; otherwise the group this heading sits under.
  parentId: z.string().trim().optional().or(z.literal("")),
  isActive: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const orderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ]),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export const heroContentSchema = z.object({
  eyebrow: z.string().trim().max(120),
  headline: z.string().trim().min(1, "Headline is required").max(200),
  subheadline: z.string().trim().max(400),
  primaryCtaLabel: z.string().trim().max(40),
  primaryCtaHref: z.string().trim().max(200),
  secondaryCtaLabel: z.string().trim().max(40),
  secondaryCtaHref: z.string().trim().max(200),
  image: z.string().trim().optional().or(z.literal("")),
});

export const aboutContentSchema = z.object({
  heading: z.string().trim().min(1).max(200),
  intro: z.string().trim().max(2000),
  vision: z.string().trim().max(1000),
  mission: z.string().trim().max(1000),
  quality: z.string().trim().max(1000),
  image: z.string().trim().optional().or(z.literal("")),
});

export const contactContentSchema = z.object({
  addressLine1: z.string().trim().max(160),
  addressLine2: z.string().trim().max(160),
  pincode: z.string().trim().max(10),
  phonePrimary: z.string().trim().max(40),
  phoneSecondary: z.string().trim().max(40).optional().or(z.literal("")),
  emailGeneral: z.string().trim().max(160),
  emailSales: z.string().trim().max(160).optional().or(z.literal("")),
  hoursWeekday: z.string().trim().max(120),
  hoursWeekend: z.string().trim().max(120),
  mapEmbedUrl: z.string().trim().max(600),
  mapLabel: z.string().trim().max(120),
});

export const statSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1).max(80),
  value: z.string().trim().max(20),
  suffix: z.string().trim().max(10).optional().or(z.literal("")),
  isPublished: z.coerce.boolean().default(false),
});

export const whyItemSchema = z.object({
  icon: z.string().trim().max(40),
  title: z.string().trim().min(1).max(80),
  body: z.string().trim().max(300),
});

export const whyContentSchema = z.object({
  heading: z.string().trim().min(1).max(160),
  subheading: z.string().trim().max(400),
  items: z.array(whyItemSchema).max(12),
});
