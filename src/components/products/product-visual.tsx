import Image from "next/image";

import { cn } from "@/lib/utils";
import { placeholderConfig, type AccentToken } from "@/lib/placeholder";

/**
 * Renders a product's photograph when one has been uploaded, and a stable,
 * collection-tinted graphic when one has not.
 *
 * The source product list supplied names only, so most of the catalogue has
 * no photography yet. The generated artwork is deterministic (same product =
 * same graphic) so the grid looks designed rather than broken, and it
 * disappears the moment an admin uploads a real image.
 */
export function ProductVisual({
  name,
  accent,
  src,
  alt,
  className,
  sizes = "(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw",
  priority = false,
  rounded = "rounded-2xl",
}: {
  name: string;
  accent: AccentToken;
  src?: string | null;
  alt?: string | null;
  className?: string;
  sizes?: string;
  priority?: boolean;
  rounded?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt ?? name}
        fill
        sizes={sizes}
        priority={priority}
        className={cn("object-cover", rounded, className)}
      />
    );
  }

  const { stops, variant, rotation, initials } = placeholderConfig(name, accent);
  const uid = `${accent}-${variant}-${initials || "np"}`;

  const shapes = [
    <g key="0">
      <rect x="230" y="250" width="340" height="300" rx="42" />
      <rect x="268" y="188" width="264" height="96" rx="34" />
    </g>,
    <g key="1">
      <rect x="212" y="300" width="376" height="70" rx="34" />
      <rect x="248" y="366" width="42" height="188" rx="20" />
      <rect x="510" y="366" width="42" height="188" rx="20" />
    </g>,
    <g key="2">
      <rect x="240" y="180" width="320" height="384" rx="38" />
      <rect x="286" y="248" width="228" height="20" rx="10" opacity=".45" />
      <rect x="286" y="330" width="228" height="20" rx="10" opacity=".45" />
      <rect x="286" y="412" width="228" height="20" rx="10" opacity=".45" />
    </g>,
    <g key="3">
      <circle cx="400" cy="330" r="132" />
      <rect x="352" y="430" width="96" height="150" rx="44" />
    </g>,
  ][variant];

  return (
    <div
      className={cn("absolute inset-0 overflow-hidden", rounded, className)}
      role="img"
      aria-label={`${name} — image coming soon`}
    >
      <svg viewBox="0 0 800 800" className="size-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={stops[0]} />
            <stop offset="55%" stopColor={stops[1]} />
            <stop offset="100%" stopColor={stops[2]} />
          </linearGradient>
          <linearGradient id={`fg-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity=".95" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity=".62" />
          </linearGradient>
        </defs>

        <rect width="800" height="800" fill={`url(#bg-${uid})`} />
        <circle cx="640" cy="150" r="210" fill="#ffffff" opacity=".10" />
        <circle cx="140" cy="690" r="180" fill="#000000" opacity=".08" />

        <g transform={`rotate(${rotation} 400 380)`} fill={`url(#fg-${uid})`}>
          {shapes}
        </g>
      </svg>

      <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/25 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-white/90 backdrop-blur-sm">
        Image coming soon
      </span>
    </div>
  );
}
