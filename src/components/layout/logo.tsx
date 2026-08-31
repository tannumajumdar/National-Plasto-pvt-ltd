"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "@/hooks/use-theme";

import { cn } from "@/lib/utils";

const LIGHT_SRC = "/logo/national-plasto.png";
const DARK_SRC = "/logo/national-plasto-dark.png";
const LOGO_W = 486;
const LOGO_H = 236;

export function Logo({
  className,
  href = "/",
  compact = false,
  onBrand = false,
  priority = false,
}: {
  className?: string;
  href?: string | null;
  compact?: boolean;
  onBrand?: boolean;
  priority?: boolean;
}) {
  const { resolvedTheme, mounted } = useTheme();

  const isDark = onBrand || (mounted && resolvedTheme === "dark");
  const sizeClass = compact ? "h-8 sm:h-9" : "h-11 sm:h-13 xl:h-15";
  const src = isDark ? DARK_SRC : LIGHT_SRC;

  const mark = (
    <Image
      src={src}
      width={LOGO_W}
      height={LOGO_H}
      alt="National Plasto Pvt. Ltd."
      priority={priority}
      sizes="260px"
      className={cn("w-auto object-contain shrink-0", sizeClass, className)}
    />
  );

  if (!href) return mark;

  return (
    <Link href={href} aria-label="National Plasto — home" className="shrink-0 flex items-center">
      {mark}
    </Link>
  );
}

const NEXT_LIGHT_SRC = "/logo/next-nppl.png";
const NEXT_DARK_SRC = "/logo/next-nppl-dark.png";

export function NextBrandLogo({
  className,
  onBrand = false,
}: {
  className?: string;
  onBrand?: boolean;
}) {
  const { resolvedTheme, mounted } = useTheme();

  const isDark = onBrand || (mounted && resolvedTheme === "dark");
  const sizeClass = "h-9 sm:h-11 xl:h-13";
  const src = isDark ? NEXT_DARK_SRC : NEXT_LIGHT_SRC;

  return (
    <Image
      src={src}
      width={436}
      height={189}
      alt="NEXT — from the house of National Plasto"
      priority
      sizes="200px"
      className={cn("w-auto object-contain shrink-0", sizeClass, className)}
    />
  );
}
