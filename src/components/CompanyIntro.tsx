"use client";

import * as React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";

/**
 * ============================================================================
 * NATIONAL PLASTO PVT. LTD. — PREMIUM CINEMATIC INTRO ANIMATION
 * ============================================================================
 *
 * ASSET PATH REFERENCE:
 * You can replace these default asset paths anytime with your custom high-res assets:
 *
 * 1. National Logo:        "/images/company/national-logo.png"
 * 2. Next to National:     "/images/company/next-national-logo.png"
 * 3. Company Factory Photo: "/images/company/company-photo.jpg"
 * ============================================================================
 */
const INTRO_ASSETS = {
  // Replace this path with your custom National logo PNG if needed:
  nationalLogo: "/images/company/national-logo.png",
  // Replace this path with your custom Next to National logo PNG if needed:
  nextLogo: "/images/company/next-national-logo.png",
  // Replace this path with your custom National Plasto Factory photo if needed:
  companyPhoto: "/images/company/company-photo.jpg",
} as const;

interface CompanyIntroProps {
  /** If true, forces the intro to play even if already seen in current session. */
  forcePlay?: boolean;
  /** Callback fired when the intro finishes or is skipped. */
  onComplete?: () => void;
}

export function CompanyIntro({ forcePlay = false, onComplete }: CompanyIntroProps) {
  // Intro stages:
  // 0: Loading / checking session
  // 1: Dark Navy Background + Dual Logos Enter (Left & Right) -> Meet in Center
  // 2: Cinematic Reveal -> Company Photo Zoom + Company Title & Tagline Overlay
  // 3: Fade Out Outro -> Unmount & Reveal Homepage
  const [stage, setStage] = React.useState<0 | 1 | 2 | 3>(0);
  const [isVisible, setIsVisible] = React.useState(true);

  const finishIntro = React.useCallback(() => {
    sessionStorage.setItem("nppl_intro_seen_v1", "true");
    document.body.style.overflow = "";
    setIsVisible(false);
    onComplete?.();
  }, [onComplete]);

  // Initialize and check session storage & motion preferences
  React.useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Check session storage
    const hasSeenIntro = sessionStorage.getItem("nppl_intro_seen_v1");

    if ((hasSeenIntro && !forcePlay) || prefersReducedMotion) {
      setIsVisible(false);
      onComplete?.();
      return;
    }

    // Lock body scroll while intro is playing
    document.body.style.overflow = "hidden";
    setStage(1);

    // Timeline Sequence (Slower & Majestic Cinematic Pace):
    // 0ms – 3200ms: Dual Logos Enter (1.6s) & Settle/Hold (1.6s)
    // 3200ms – 6800ms: Cinematic Reveal of Factory (3.6s slow zoom) & Company Name
    // 6800ms – 7600ms: Smooth Fade out overlay to existing homepage
    const timer1 = setTimeout(() => {
      setStage(2);
    }, 3200);

    const timer2 = setTimeout(() => {
      setStage(3);
    }, 6800);

    const timer3 = setTimeout(() => {
      finishIntro();
    }, 7600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      document.body.style.overflow = "";
    };
  }, [forcePlay, finishIntro, onComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {stage > 0 && stage < 3 && (
        <motion.div
          key="company-intro-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#07111F] select-none overflow-hidden font-sans"
          aria-label="National Plasto Intro Animation"
          role="dialog"
          aria-modal="true"
        >
          {/* ================================================================
              SKIP INTRO BUTTON (Top Right Corner)
              ================================================================ */}
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            onClick={finishIntro}
            className="fixed top-5 right-5 sm:top-7 sm:right-7 z-[100000] flex items-center gap-2 rounded-full bg-slate-900/80 hover:bg-slate-950 border border-slate-700/60 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-200 shadow-xl backdrop-blur-md transition-all hover:scale-105 hover:border-slate-500 active:scale-95 group"
            aria-label="Skip Intro"
          >
            <span>Skip Intro</span>
            <ChevronRight className="size-3.5 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
          </motion.button>

          {/* Background Ambient Glow Grid */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(21,94,239,0.25)_0%,transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(200,16,46,0.2)_0%,transparent_50%)]" />
          </div>

          {/* ================================================================
              STEP 1–4: DUAL LOGOS ANIMATION SEQUENCE (STAGE 1)
              - National Logo enters from LEFT
              - Next to National Logo enters from RIGHT
              - Meet near CENTER with subtle glow & pulse
              ================================================================ */}
          <AnimatePresence>
            {stage === 1 && (
              <motion.div
                key="stage-1-logos"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95, filter: "blur(8px)", transition: { duration: 0.6 } }}
                className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 px-6 text-center"
              >
                {/* 1. National Logo — Enters from LEFT */}
                <motion.div
                  initial={{ x: "-100vw", opacity: 0, scale: 0.85 }}
                  animate={{
                    x: 0,
                    opacity: 1,
                    scale: [0.85, 1.05, 1],
                  }}
                  transition={{
                    duration: 1.6,
                    ease: [0.16, 1, 0.3, 1], // Smooth custom cubic bezier
                    times: [0, 0.85, 1],
                  }}
                  className="flex items-center justify-center p-3.5 sm:p-5 rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border border-white/20"
                >
                  <div className="relative h-14 sm:h-20 w-44 sm:w-60">
                    <Image
                      src={INTRO_ASSETS.nationalLogo}
                      alt="National Plasto Logo"
                      fill
                      priority
                      className="object-contain drop-shadow-md"
                    />
                  </div>
                </motion.div>

                {/* Center Animated Divider Bar */}
                <motion.div
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.7 }}
                  className="hidden sm:block h-16 w-0.5 bg-gradient-to-b from-transparent via-slate-400 to-transparent shadow-sm"
                />

                {/* 2. Next to National Logo — Enters from RIGHT */}
                <motion.div
                  initial={{ x: "100vw", opacity: 0, scale: 0.85 }}
                  animate={{
                    x: 0,
                    opacity: 1,
                    scale: [0.85, 1.05, 1],
                  }}
                  transition={{
                    duration: 1.6,
                    delay: 0.15, // Starts slightly after or together
                    ease: [0.16, 1, 0.3, 1],
                    times: [0, 0.85, 1],
                  }}
                  className="flex items-center justify-center p-3.5 sm:p-5 rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border border-white/20"
                >
                  <div className="relative h-14 sm:h-20 w-44 sm:w-60">
                    <Image
                      src={INTRO_ASSETS.nextLogo}
                      alt="From the House of NEXT National Logo"
                      fill
                      priority
                      className="object-contain drop-shadow-md"
                    />
                  </div>
                </motion.div>

                {/* Settle Glow Ring Overlay */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: [0, 0.6, 0.25],
                    scale: [0.8, 1.15, 1.05],
                  }}
                  transition={{
                    delay: 1.5,
                    duration: 1.4,
                    ease: "easeOut",
                  }}
                  className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r from-[#155eef]/30 via-white/20 to-[#c8102e]/30 blur-2xl pointer-events-none"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ================================================================
              STEP 5–6: CINEMATIC REVEAL — COMPANY PHOTO & OVERLAY TEXT (STAGE 2)
              - Expand & slow zoom company photo
              - Dark cinematic vignette overlay
              - Typography: Company Name + Tagline
              ================================================================ */}
          <AnimatePresence>
            {stage === 2 && (
              <motion.div
                key="stage-2-reveal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.8 } }}
                className="absolute inset-0 z-20 flex items-end sm:items-center justify-center overflow-hidden"
              >
                {/* Company Factory Image with Slow Majestic Zoom */}
                <motion.div
                  initial={{ scale: 1.12, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 3.6, ease: [0.25, 1, 0.5, 1] }}
                  className="absolute inset-x-0 top-0 z-0 w-full aspect-[1024/682] sm:inset-0 sm:aspect-auto sm:h-full"
                >
                  <Image
                    src={INTRO_ASSETS.companyPhoto}
                    alt="National Plasto Corporate Headquarters & Manufacturing Facility"
                    fill
                    priority
                    sizes="100vw"
                    className="object-contain object-top sm:object-cover sm:object-center"
                  />
                  {/* Dark Vignette Gradient Overlay (desktop: full cinematic dim) */}
                  <div className="absolute inset-0 hidden sm:block bg-gradient-to-t from-[#07111F] via-[#07111F]/70 to-[#07111F]/80 mix-blend-multiply" />
                  <div className="absolute inset-0 hidden sm:block bg-black/40" />
                  {/* Mobile: keep the photo (and its logo) readable, just blend the
                      bottom edge into the navy backdrop */}
                  <div className="absolute inset-0 sm:hidden bg-gradient-to-b from-[#07111F]/25 via-transparent to-[#07111F]" />
                </motion.div>

                {/* Company Name & Tagline Overlay Typography */}
                <div className="relative z-10 w-full max-w-4xl px-6 pb-14 sm:pb-0 text-center flex flex-col items-center">
                  {/* Subtle Top Badge */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-md"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#c8102e] animate-pulse" />
                    <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-slate-200">
                      Welcome to National Plasto
                    </span>
                  </motion.div>

                  {/* Main Company Title */}
                  <motion.h1
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-4 text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-wider text-white drop-shadow-lg"
                  >
                    NATIONAL PLASTO PVT. LTD.
                  </motion.h1>

                  {/* Gold & Red Accent Line */}
                  <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="my-4 h-1 w-28 sm:w-40 rounded-full bg-gradient-to-r from-[#c8102e] via-amber-400 to-[#155eef]"
                  />

                  {/* Tagline */}
                  <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                    className="text-base sm:text-xl md:text-2xl font-bold uppercase tracking-widest text-slate-200 drop-shadow-md"
                  >
                    Excellence in Plastic Moulded Products
                  </motion.p>

                  {/* Secondary Elegance Tagline */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9, duration: 0.6 }}
                    className="mt-2 font-serif italic text-lg sm:text-2xl text-amber-300/90 font-medium"
                  >
                    Touch of Elegance
                  </motion.p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

