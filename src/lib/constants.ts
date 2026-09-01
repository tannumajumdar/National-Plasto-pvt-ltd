export const SITE = {
  name: "National Plasto Pvt. Ltd.",
  shortName: "National Plasto",
  legalName: "National Plasto Private Limited",
  tagline: "Quality Plastic Products Designed for Modern Living",
  description:
    "National Plasto Pvt. Ltd. manufactures durable, thoughtfully designed plastic furniture and household products from Kolkata, West Bengal — across the NEXT, NATIONAL and NATIONAL SAPPHIRE collections.",
  city: "Kolkata",
  state: "West Bengal",
  country: "India",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

/**
 * Contact details are placeholders until the business supplies real ones.
 * Every field here is overridable from Admin → Content → Contact.
 */
export const CONTACT_DEFAULTS = {
  addressLine1: "19 Sukeas Lane",
  addressLine2: "Kolkata, West Bengal",
  pincode: "700001",
  phonePrimary: "+91 98300 12345",
  phoneSecondary: "+91 33 2282 5555",
  emailGeneral: "info@nationalplasto.com",
  emailSales: "sales@nationalplasto.com",
  hoursWeekday: "Monday – Saturday, 10:00 AM – 7:00 PM",
  hoursWeekend: "Sunday — Closed",
  mapEmbedUrl:
    "https://www.google.com/maps?q=19%20Sukeas%20Lane,Kolkata,West%20Bengal,India,700001&output=embed",
  mapLabel: "19 Sukeas Lane, Kolkata, West Bengal 700001, India",
} as const;

/**
 * Centralized Distributor / Business Partnership Contact Configuration.
 * Edit values here or set NEXT_PUBLIC_WHATSAPP_NUMBER / NEXT_PUBLIC_CONTACT_EMAIL in .env.
 */
export const DISTRIBUTOR_CONTACT = {
  // Replace with actual WhatsApp number (with country code, e.g. "+919830012345"):
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+919830012345",

  // Replace with actual email address:
  emailAddress: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@nationalplasto.com",

  // Pre-filled WhatsApp message for distributor enquiries:
  whatsappMessage:
    "Hello National Plasto Team,\nI am interested in becoming a distributor/business partner. Please share the details and requirements.",

  // Pre-filled Email subject & body for distributor enquiries:
  emailSubject: "Distributor / Business Partnership Enquiry",
  emailBody:
    "Hello National Plasto Team,\n\nI am interested in becoming a distributor/business partner with National Plasto Pvt. Ltd.\n\nPlease share the distributor requirements and further details.\n\nRegards",
} as const;

/* ------------------------------------------------------------------
   Collections — the three brand lines
   ------------------------------------------------------------------ */

export type CollectionSlug = "next" | "national" | "national-sapphire";

export interface CollectionTheme {
  slug: CollectionSlug;
  name: string;
  accent: "next" | "national" | "sapphire";
  /** Tailwind-ready gradient stops using the collection's theme tokens. */
  gradient: string;
  ring: string;
  text: string;
  bgSoft: string;
  tagline: string;
  description: string;
}

export const COLLECTIONS: Record<CollectionSlug, CollectionTheme> = {
  next: {
    slug: "next",
    name: "NEXT",
    accent: "next",
    gradient: "from-next-deep via-next to-next",
    ring: "ring-next/35",
    text: "text-next",
    bgSoft: "bg-next/10",
    tagline: "Contemporary designs for the way people live now",
    description:
      "The NEXT collection brings a modern, everyday sensibility to plastic furniture and storage — clean lines, practical formats and a range built for compact urban homes.",
  },
  national: {
    slug: "national",
    name: "NATIONAL",
    accent: "national",
    gradient: "from-national-deep via-national to-national",
    ring: "ring-national/35",
    text: "text-national",
    bgSoft: "bg-national/10",
    tagline: "The flagship range that carries our name",
    description:
      "NATIONAL is our broadest collection — the dependable, everyday range that established National Plasto in homes and businesses across eastern India.",
  },
  "national-sapphire": {
    slug: "national-sapphire",
    name: "NATIONAL SAPPHIRE",
    accent: "sapphire",
    gradient: "from-sapphire-deep via-sapphire to-sapphire",
    ring: "ring-sapphire/35",
    text: "text-sapphire",
    bgSoft: "bg-sapphire/10",
    tagline: "Our premium tier, finished to a higher standard",
    description:
      "NATIONAL SAPPHIRE is the elevated line — a focused selection of premium pieces for customers who want a more refined finish and presence.",
  },
};

export const COLLECTION_LIST = Object.values(COLLECTIONS);

/** Map a stored accent token to its theme, for products loaded from the DB. */
export function themeForAccent(accent: string): CollectionTheme {
  return (
    COLLECTION_LIST.find((c) => c.accent === accent) ?? COLLECTIONS.national
  );
}

/* ------------------------------------------------------------------
   Navigation
   ------------------------------------------------------------------ */

export const MAIN_NAV = [
  { label: "HOME", href: "/" },
  { label: "ABOUT US", href: "/about" },
  { label: "PRODUCTS", href: "/products" },
  { label: "INDUSTRIES", href: "/#industries" },
  { label: "QUALITY", href: "/about#quality" },
  { label: "INFRASTRUCTURE", href: "/about#infrastructure" },
  { label: "CONTACT US", href: "/contact" },
] as const;

export const ACCOUNT_NAV = [
  { label: "Profile", href: "/account", icon: "User" },
  { label: "My Orders", href: "/account/orders", icon: "Package" },
  { label: "Wishlist", href: "/wishlist", icon: "Heart" },
  { label: "Addresses", href: "/account/addresses", icon: "MapPin" },
] as const;

export const ADMIN_NAV = [
  { label: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
  { label: "Products", href: "/admin/products", icon: "Package" },
  { label: "Collections", href: "/admin/collections", icon: "Layers" },
  { label: "Orders", href: "/admin/orders", icon: "ShoppingBag" },
  { label: "Customers", href: "/admin/customers", icon: "Users" },
  { label: "Reviews", href: "/admin/reviews", icon: "Star" },
  { label: "Homepage", href: "/admin/content", icon: "LayoutTemplate" },
  { label: "Settings", href: "/admin/settings", icon: "Settings" },
] as const;

/* ------------------------------------------------------------------
   Catalogue behaviour
   ------------------------------------------------------------------ */

export const PRODUCTS_PER_PAGE = 12;
export const ADMIN_PAGE_SIZE = 15;

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest first" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top rated" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const ORDER_STATUS_FLOW = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
] as const;

export const ORDER_STATUS_META: Record<
  string,
  { label: string; className: string; dot: string }
> = {
  PENDING: {
    label: "Pending",
    className: "bg-amber-500/12 text-amber-700 dark:text-amber-400 border-amber-500/25",
    dot: "bg-amber-500",
  },
  CONFIRMED: {
    label: "Confirmed",
    className: "bg-blue-500/12 text-blue-700 dark:text-blue-400 border-blue-500/25",
    dot: "bg-blue-500",
  },
  PROCESSING: {
    label: "Processing",
    className: "bg-violet-500/12 text-violet-700 dark:text-violet-400 border-violet-500/25",
    dot: "bg-violet-500",
  },
  SHIPPED: {
    label: "Shipped",
    className: "bg-cyan-500/12 text-cyan-700 dark:text-cyan-400 border-cyan-500/25",
    dot: "bg-cyan-500",
  },
  DELIVERED: {
    label: "Delivered",
    className: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
    dot: "bg-emerald-500",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-rose-500/12 text-rose-700 dark:text-rose-400 border-rose-500/25",
    dot: "bg-rose-500",
  },
};

/** Free shipping above this order value (paise). Configurable in settings. */
export const FREE_SHIPPING_THRESHOLD = 200000; // ₹2,000
export const FLAT_SHIPPING_RATE = 9900; // ₹99

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry",
] as const;
