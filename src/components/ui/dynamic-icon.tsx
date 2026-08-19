import {
  BadgeCheck,
  Boxes,
  CalendarClock,
  Factory,
  Gem,
  HeartHandshake,
  Layers,
  LayoutGrid,
  Package,
  Recycle,
  Ruler,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/**
 * Curated icon registry for admin-editable content.
 *
 * Content blocks store an icon *name*, so the renderer needs a lookup. This
 * is an explicit map rather than a dynamic import of all of lucide-react,
 * which would pull thousands of unused icons into the bundle.
 */
export const ICON_REGISTRY = {
  BadgeCheck,
  Boxes,
  CalendarClock,
  Factory,
  Gem,
  HeartHandshake,
  Layers,
  LayoutGrid,
  Package,
  Recycle,
  Ruler,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Users,
  Wrench,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICON_REGISTRY;

/** Names offered in the admin content editor. */
export const ICON_NAMES = Object.keys(ICON_REGISTRY) as IconName[];

export function DynamicIcon({
  name,
  className,
  fallback = "Sparkles",
}: {
  name: string | null | undefined;
  className?: string;
  fallback?: IconName;
}) {
  const Icon = ICON_REGISTRY[name as IconName] ?? ICON_REGISTRY[fallback];
  return <Icon className={className} aria-hidden />;
}
