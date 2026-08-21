/**
 * Continuously scrolling brand band.
 *
 * Pure CSS: the track is rendered twice and translated -50%, so the loop is
 * seamless with no JavaScript touching a transform every frame. Hovering
 * pauses it, and `prefers-reduced-motion` stops it entirely — both handled by
 * the `.marquee-track` utility in globals.css.
 *
 * A server component on purpose. There is no state here, so it costs the
 * client bundle nothing.
 */
const PHRASES = [
  "Premium Quality",
  "Modern Design",
  "Built to Last",
  "National Plasto",
  "Made in Kolkata",
] as const;

export function MarqueeBand() {
  // Two identical halves; the animation moves exactly one half-width.
  const half = (
    <div className="flex shrink-0 items-center" aria-hidden>
      {PHRASES.map((phrase) => (
        <span key={phrase} className="flex items-center">
          <span className="whitespace-nowrap px-8 text-lg font-extrabold uppercase tracking-[0.14em] text-white/85 sm:text-2xl sm:tracking-[0.18em]">
            {phrase}
          </span>
          <span className="text-xl text-cyan sm:text-2xl" aria-hidden>
            ✦
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <section className="section-ink relative overflow-hidden border-y border-white/8 py-7 sm:py-9">
      <div aria-hidden className="rule-fade-bright absolute inset-x-0 top-0" />

      {/* mask-fade-x dissolves both ends so the text never hard-clips. */}
      <div className="marquee mask-fade-x">
        <div className="marquee-track">
          {half}
          {half}
        </div>
      </div>

      {/* The list read out to assistive tech once, instead of twice. */}
      <span className="sr-only">
        {PHRASES.join(". ")}.
      </span>

      <div aria-hidden className="rule-fade-bright absolute inset-x-0 bottom-0" />
    </section>
  );
}
