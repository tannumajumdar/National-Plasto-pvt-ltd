"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface HeroVideoSource {
  /** Path under /public, e.g. "/videos/hero/moulding-line.mp4". */
  src: string;
  /** Optional first-frame image, shown until the clip has data to paint. */
  poster?: string;
}

/**
 * Continuously playing background footage for the hero.
 *
 * Two stacked <video> elements rather than one element with a swapped `src`:
 * swapping a source mid-flight flashes black for a frame, while a pair can
 * cross-fade and let the next clip buffer while the current one is still on
 * screen. With two clips configured each slot simply keeps its own, so the
 * pair alternates forever; with more, the slot that just finished is re-armed
 * with the clip after next once its fade-out is done.
 *
 * Everything here is best-effort and silent. If the files are not in place,
 * autoplay is refused, the visitor asked for less motion, or they are on a
 * metered connection, the component renders nothing and the hero keeps the
 * static gradient it has always had.
 */
export function HeroVideoBackground({
  sources,
  className,
  onActiveChange,
}: {
  sources: readonly HeroVideoSource[];
  /** Applied to each <video>; use it to tune opacity per theme. */
  className?: string;
  /** Fires true once footage is actually playing, false if it never can. */
  onActiveChange?: (active: boolean) => void;
}) {
  const count = sources.length;

  const slotA = React.useRef<HTMLVideoElement>(null);
  const slotB = React.useRef<HTMLVideoElement>(null);
  const refs = React.useMemo(() => [slotA, slotB] as const, []);

  // Which clip each slot currently holds.
  const [indices, setIndices] = React.useState<[number, number]>(() => [
    0,
    count > 1 ? 1 : 0,
  ]);
  const [active, setActive] = React.useState<0 | 1>(0);
  const [enabled, setEnabled] = React.useState(false);

  const failed = React.useRef(new Set<string>());
  const swapTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Decide once, on the client, whether footage is appropriate at all. Doing
  // this after mount also keeps the server HTML free of <video>, so there is
  // nothing to mismatch during hydration.
  React.useEffect(() => {
    if (count === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    if (connection?.saveData) return;
    setEnabled(true);
  }, [count]);

  React.useEffect(() => {
    onActiveChange?.(enabled);
  }, [enabled, onActiveChange]);

  // Start (or resume) whichever slot is on top.
  React.useEffect(() => {
    if (!enabled) return;
    const video = refs[active].current;
    if (!video) return;
    void video.play().catch(() => {
      // Autoplay refused — iOS low-power mode does this even when muted.
      setEnabled(false);
    });
  }, [enabled, active, refs]);

  React.useEffect(() => {
    return () => {
      if (swapTimer.current) clearTimeout(swapTimer.current);
    };
  }, []);

  const handleEnded = React.useCallback(
    (slot: 0 | 1) => {
      // A single clip just restarts itself.
      if (count < 2) {
        const video = refs[slot].current;
        if (video) {
          video.currentTime = 0;
          void video.play().catch(() => {});
        }
        return;
      }

      const other: 0 | 1 = slot === 0 ? 1 : 0;
      const incoming = refs[other].current;
      if (incoming) {
        incoming.currentTime = 0;
        void incoming.play().catch(() => {});
      }
      setActive(other);

      // With exactly two clips the slots never need re-arming. With more,
      // wait for the cross-fade to finish before touching the outgoing
      // element, or the swap would be visible.
      if (count > 2) {
        if (swapTimer.current) clearTimeout(swapTimer.current);
        swapTimer.current = setTimeout(() => {
          setIndices((prev) => {
            const next: [number, number] = [...prev];
            next[slot] = (prev[other] + 1) % count;
            return next;
          });
        }, 1100);
      }
    },
    [count, refs],
  );

  const handleError = React.useCallback(
    (src: string) => {
      // Missing or unplayable file. Only give up once nothing is left.
      failed.current.add(src);
      if (failed.current.size >= count) setEnabled(false);
    },
    [count],
  );

  if (!enabled || count === 0) return null;

  return (
    <>
      {([0, 1] as const).map((slot) => {
        const source = sources[indices[slot]];
        if (!source) return null;
        return (
          <video
            key={slot}
            ref={refs[slot]}
            src={source.src}
            poster={source.poster}
            muted
            playsInline
            autoPlay={slot === 0}
            preload="auto"
            // Decorative only — the hero already says what the company does.
            aria-hidden="true"
            tabIndex={-1}
            disablePictureInPicture
            onEnded={() => handleEnded(slot)}
            onError={() => handleError(source.src)}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-out",
              active === slot ? "opacity-100" : "opacity-0",
              className,
            )}
          />
        );
      })}
    </>
  );
}
