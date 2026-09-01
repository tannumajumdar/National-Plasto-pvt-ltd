"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DISTRIBUTOR_CONTACT } from "@/lib/constants";

/** Custom WhatsApp SVG Icon */
function WhatsAppIcon({ className = "size-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" />
      <path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1" />
    </svg>
  );
}

export function FloatingWhatsApp() {
  const [showTooltip, setShowTooltip] = React.useState(false);

  // Clean WhatsApp phone number and encode pre-filled message
  const cleanNumber = DISTRIBUTOR_CONTACT.whatsappNumber.replace(/[^\d+]/g, "");
  const whatsappUrl = `https://wa.me/${cleanNumber.replace("+", "")}?text=${encodeURIComponent(
    DISTRIBUTOR_CONTACT.whatsappMessage
  )}`;

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-50 flex items-center select-none">
      {/* Hover Tooltip (Desktop) */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mr-3 hidden sm:block rounded-xl bg-slate-900/95 border border-slate-700/80 px-3.5 py-2 text-xs font-bold text-white shadow-2xl backdrop-blur-md whitespace-nowrap pointer-events-none"
          >
            Chat with us on WhatsApp
            <div className="absolute right-0 top-1/2 -mr-1 -mt-1 h-2 w-2 rotate-45 bg-slate-900 border-r border-t border-slate-700/80" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Circular WhatsApp Button */}
      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.0, type: "spring", stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        className="relative grid size-12 sm:size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-2xl shadow-[#25D366]/40 transition-colors hover:bg-[#20ba5a] active:bg-[#1da851] outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/50"
        aria-label="Chat with National Plasto on WhatsApp"
      >
        {/* Pulsing Aura Ring */}
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366] opacity-35" />

        {/* WhatsApp Icon */}
        <WhatsAppIcon className="size-6 sm:size-7" />
      </motion.a>
    </div>
  );
}

