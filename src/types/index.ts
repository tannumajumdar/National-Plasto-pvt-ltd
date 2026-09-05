import type { AccentToken } from "@/lib/placeholder";

/**
 * Plain, serialisable shapes passed from Server Components into Client
 * Components. Prisma rows are mapped into these at the query boundary so no
 * Date/Decimal instances ever cross into client code.
 */

export interface ProductImageDTO {
  id: string;
  url: string;
  alt: string | null;
}

export interface ProductCardDTO {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string | null;
  /** Paise, or null when an admin has not set a price yet. */
  price: number | null;
  discountPrice: number | null;
  stock: number;
  trackStock: boolean;
  images: ProductImageDTO[];
  collection: { name: string; slug: string; accent: AccentToken };
  category: { name: string; slug: string } | null;
  isFeatured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  /** Set from the source catalogue's PREMIUM / DELUXE / HEAVY GUARANTEE headings. */
  isPremium: boolean;
  /** Editorial — an admin marks a short-run piece by hand. */
  isLimitedEdition: boolean;
  ratingAvg: number;
  reviewCount: number;
  needsReview: boolean;
}

export interface ProductDetailDTO extends ProductCardDTO {
  description: string | null;
  features: { id: string; label: string }[];
  specifications: { id: string; name: string; value: string }[];
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
}

export interface ReviewDTO {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string;
  author: { name: string };
}

export interface CollectionDTO {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  bannerImage: string | null;
  accent: AccentToken;
  isActive: boolean;
  productCount: number;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

/** One node of the Brand → Category → Sub-category tree. */
export interface CategoryNodeDTO extends CategoryDTO {
  description: string | null;
  /** Sub-categories that actually hold products in the current scope. */
  children: CategoryDTO[];
  /** Products hanging off this node directly, not off a child. */
  directCount: number;
}

/** A brand and the slice of the category tree its products occupy. */
export interface BrandCatalogueDTO {
  brand: CollectionDTO;
  groups: CategoryNodeDTO[];
}

/** Compact shape for the header menu: brand plus its top-level groups. */
export interface CatalogueNavBrand {
  name: string;
  slug: string;
  accent: AccentToken;
  productCount: number;
  groups: { name: string; slug: string; productCount: number }[];
}

/* ---------------- Cart ---------------- */

export interface CartLineDTO {
  productId: string;
  name: string;
  slug: string;
  sku: string;
  image: string | null;
  accent: AccentToken;
  collectionName: string;
  /** Paise. Null means unpriced — such a line cannot be checked out. */
  unitPrice: number | null;
  listPrice: number | null;
  quantity: number;
  stock: number;
  trackStock: boolean;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  /** Lines that cannot be ordered because no price is set. */
  unpricedCount: number;
}

/* ---------------- Orders ---------------- */

export interface OrderItemDTO {
  id: string;
  name: string;
  slug: string;
  collectionName: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderDTO {
  id: string;
  orderNumber: string;
  status: OrderStatusValue;
  paymentStatus: string;
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shipLine1: string;
  shipLine2: string | null;
  shipCity: string;
  shipState: string;
  shipPincode: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  items: OrderItemDTO[];
  events: { id: string; status: OrderStatusValue; note: string | null; createdAt: string }[];
  createdAt: string;
}

export type OrderStatusValue =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

/* ---------------- Catalogue querying ---------------- */

export interface ProductFilters {
  q?: string;
  collection?: string[];
  category?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  isNew?: boolean;
  bestSeller?: boolean;
  premium?: boolean;
  limitedEdition?: boolean;
  sort?: string;
  page?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/* ---------------- Site content ---------------- */

export interface HeroContent {
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  image: string | null;
}

export interface AboutContent {
  heading: string;
  intro: string;
  vision: string;
  mission: string;
  quality: string;
  image: string | null;
}

export interface WhyChooseUsContent {
  heading: string;
  subheading: string;
  items: { icon: string; title: string; body: string }[];
}

export interface ContactContent {
  addressLine1: string;
  addressLine2: string;
  pincode: string;
  phonePrimary: string;
  phoneSecondary: string;
  emailGeneral: string;
  emailSales: string;
  hoursWeekday: string;
  hoursWeekend: string;
  mapEmbedUrl: string;
  mapLabel: string;
  note?: string;
}

export interface JourneyContent {
  heading: string;
  subheading: string;
  milestones: { year: string; title: string; body: string }[];
}

export interface StatDTO {
  id: string;
  label: string;
  value: string;
  suffix: string | null;
  icon: string | null;
  computed: string | null;
  isPublished: boolean;
}
