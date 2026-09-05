"use client";

import * as React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";

import { INTRO_ATTRIBUTE, INTRO_STORAGE_KEY } from "@/lib/intro";

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

/**
 * Hydrating the homepage and animating the intro both want the main thread,
 * and hydration wins — the logos fly in while React is still mounting the
 * page underneath, which is what made the first second stutter. The backdrop
 * is already on screen by then (painted by the script in <head>), so holding
 * the motion back a beat costs nothing visually and buys a clean run.
 */
const SETTLE_MS = 260;

export function CompanyIntro({ forcePlay = false, onComplete }: CompanyIntroProps) {
  // Intro stages:
  // 0: Loading / checking session
  // 1: Dark Navy Background + Dual Logos Enter (Left & Right) -> Meet in Center
  // 2: Cinematic Reveal -> Company Photo Zoom + Company Title & Tagline Overlay
  // 3: Fade Out Outro -> Unmount & Reveal Homepage
  const [stage, setStage] = React.useState<0 | 1 | 2 | 3>(0);
  const [isVisible, setIsVisible] = React.useState(true);

  /**
   * Starts the outro. Stage 3 empties the overlay, which lets AnimatePresence
   * fade it out and unmount it — so this is also what the Skip button calls,
   * and skipping gets the same soft landing as letting it run.
   */
  const closeIntro = React.useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_STORAGE_KEY, "true");
    } catch {
      // Private mode throws on write. The intro simply plays again next load.
    }
    // Dropped as the fade begins, not after it. This navy sheet is the same
    // colour as the overlay, so leaving it up would have the fade reveal an
    // identical rectangle and then cut to the page. It also releases the
    // scroll lock.
    document.documentElement.removeAttribute(INTRO_ATTRIBUTE);
    setStage(3);
    onComplete?.();
  }, [onComplete]);

  React.useEffect(() => {
    const root = document.documentElement;

    // The script in <head> already decided this, weighing session storage and
    // prefers-reduced-motion before the first paint. Reading its answer keeps
    // the two in step — deciding again here could disagree with what is
    // already on screen.
    const shouldPlay = forcePlay || root.getAttribute(INTRO_ATTRIBUTE) === "play";

    if (!shouldPlay) {
      root.removeAttribute(INTRO_ATTRIBUTE);
      setIsVisible(false);
      onComplete?.();
      return;
    }

    root.setAttribute(INTRO_ATTRIBUTE, "play");

    // Timeline, measured from the end of the settle above:
    //    0ms – 3200ms: dual logos enter (1.6s), then hold
    // 3200ms – 6800ms: factory reveal, 3.6s slow zoom, name and tagline
    // 6800ms onwards: closeIntro hands over to the overlay's own 0.8s exit
    const timers = [
      setTimeout(() => setStage(1), SETTLE_MS),
      setTimeout(() => setStage(2), SETTLE_MS + 3200),
      setTimeout(closeIntro, SETTLE_MS + 6800),
    ];

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [forcePlay, closeIntro, onComplete]);

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
            onClick={closeIntro}
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
                  style={{ willChange: "transform, opacity" }}
                  className="flex items-center justify-center p-3.5 sm:p-5 rounded-2xl bg-white shadow-2xl border border-white/20"
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
                  style={{ willChange: "transform, opacity" }}
                  className="flex items-center justify-center p-3.5 sm:p-5 rounded-2xl bg-white shadow-2xl border border-white/20"
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

                {/* Settle Glow Ring Overlay.

                    Opacity only. Scaling a blur-2xl layer means the browser
                    re-blurs it every frame, right while both logos are flying
                    across the viewport — it was the most expensive thing on
                    screen and the least visible. */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.6, 0.25] }}
                  transition={{
                    delay: 1.5,
                    duration: 1.4,
                    ease: "easeOut",
                  }}
                  className="absolute inset-0 -z-10 scale-105 rounded-3xl bg-gradient-to-r from-[#155eef]/30 via-white/20 to-[#c8102e]/30 blur-2xl pointer-events-none"
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
          {/* ================================================================
              COMPANY FACTORY PHOTO (revealed at STAGE 2)

              Mounted from the first frame rather than when stage 2 arrives.
              A 340 KB photograph that only starts downloading at the moment it
              is meant to appear will still be decoding when the zoom begins —
              that hitch 3.2 seconds in was the worst of the stutter. Here it
              loads alongside the logos, sits at opacity 0, and stage 2 only
              has to fade it up.
              ================================================================ */}
          <motion.div
            initial={false}
            animate={{ opacity: stage >= 2 ? 1 : 0, scale: stage >= 2 ? 1 : 1.12 }}
            transition={{
              // The fade is quick; the zoom is the slow, majestic part.
              opacity: { duration: 0.9, ease: "easeOut" },
              scale: { duration: 3.6, ease: [0.25, 1, 0.5, 1] },
            }}
            style={{ willChange: "transform, opacity" }}
            className="absolute inset-x-0 top-0 z-20 w-full aspect-[1024/682] sm:inset-0 sm:aspect-auto sm:h-full"
          >
            <Image
              src={INTRO_ASSETS.companyPhoto}
              alt="National Plasto Corporate Headquarters & Manufacturing Facility"
              fill
              priority
              sizes="100vw"
              className="object-contain object-top sm:object-cover sm:object-center"
            />
            {/* Dark Vignette Gradient Overlay (desktop: full cinematic dim).
                Plain alpha rather than mix-blend-multiply: a blend mode over a
                scaling image forces the compositor to re-blend the whole
                viewport every frame of the zoom. */}
            <div className="absolute inset-0 hidden sm:block bg-gradient-to-t from-[#07111F] via-[#07111F]/85 to-[#07111F]/90" />
            {/* Mobile: keep the photo (and its logo) readable, just blend the
                bottom edge into the navy backdrop */}
            <div className="absolute inset-0 sm:hidden bg-gradient-to-b from-[#07111F]/25 via-transparent to-[#07111F]" />
          </motion.div>

          <AnimatePresence>
            {stage === 2 && (
              <motion.div
                key="stage-2-reveal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.8 } }}
                className="absolute inset-0 z-30 flex items-end sm:items-center justify-center overflow-hidden"
              >
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

