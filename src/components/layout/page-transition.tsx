"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Route-change transition.
 *
 * Deliberately restrained: a short fade with a few pixels of rise, keyed on
 * the pathname. Anything flashier gets tiring by the third navigation, and a
 * long exit animation would delay the new page.
 *
 * Only the enter half is animated. Next's App Router swaps the tree on
 * navigation, so an exit animation would need the whole page held in an
 * AnimatePresence — which fights streaming and hurts the first paint.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  if (reduced) return <>{children}</>;

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
