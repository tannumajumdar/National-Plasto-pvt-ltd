import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { Logo } from "@/components/layout/logo";
import { Separator } from "@/components/ui/separator";
import { COLLECTION_LIST, MAIN_NAV, SITE } from "@/lib/constants";
import { getContact } from "@/lib/queries/content";

export async function Footer() {
  const contact = await getContact();
  const year = new Date().getFullYear();

  return (
    <footer className="section-ink relative mt-24 overflow-hidden pb-16 lg:pb-0">
      {/* Animated gradient hairline across the top edge. */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-px overflow-hidden">
        <div className="marquee-track h-px w-[200%] bg-[linear-gradient(90deg,transparent,hsl(var(--accent)),hsl(var(--cyan)),hsl(var(--gold)),transparent)] opacity-70" />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 dot-grid opacity-30" />

      <div className="container-page relative py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          {/* Brand */}
          <div>
            <Logo onBrand />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/65">
              {SITE.description}
            </p>
          </div>

          {/* Explore */}
          <nav aria-label="Footer navigation">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
              Explore
            </h2>
            <ul className="mt-5 space-y-3">
              {MAIN_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/65 transition-colors hover:text-accent"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/products?sort=newest"
                  className="text-sm text-white/65 transition-colors hover:text-accent"
                >
                  New Arrivals
                </Link>
              </li>
            </ul>
          </nav>

          {/* Collections */}
          <nav aria-label="Collections">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
              Collections
            </h2>
            <ul className="mt-5 space-y-3">
              {COLLECTION_LIST.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/collections/${c.slug}`}
                    className="text-sm text-white/65 transition-colors hover:text-accent"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
              Get in touch
            </h2>
            <ul className="mt-5 space-y-4 text-sm text-white/65">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
                <span>
                  {contact.addressLine1}
                  <br />
                  {contact.addressLine2} {contact.pincode}
                </span>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-accent" />
                <a href={`tel:${contact.phonePrimary.replace(/\s/g, "")}`} className="hover:text-accent">
                  {contact.phonePrimary}
                </a>
              </li>
              <li className="flex gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-accent" />
                <a href={`mailto:${contact.emailGeneral}`} className="break-all hover:text-accent">
                  {contact.emailGeneral}
                </a>
              </li>
              <li className="flex gap-3">
                <Clock className="mt-0.5 size-4 shrink-0 text-accent" />
                <span>
                  {contact.hoursWeekday}
                  <br />
                  {contact.hoursWeekend}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-10 bg-white/12" />

        <div className="flex flex-col items-center justify-between gap-4 text-xs text-white/55 sm:flex-row">
          <p>
            © {year} {SITE.legalName}. All rights reserved.
          </p>
          <p>
            {SITE.city}, {SITE.state}, {SITE.country}
          </p>
        </div>
      </div>
    </footer>
  );
}
