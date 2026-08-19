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
    <footer className="relative mt-24 overflow-hidden border-t border-border bg-primary text-primary-foreground">
      {/* Soft brand glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/4 size-[32rem] rounded-full bg-accent/12 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-52 right-0 size-[28rem] rounded-full bg-sapphire/12 blur-3xl"
      />

      <div className="container-page relative py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          {/* Brand */}
          <div>
            <Logo inverted />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-primary-foreground/70">
              {SITE.description}
            </p>
          </div>

          {/* Explore */}
          <nav aria-label="Footer navigation">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-foreground">
              Explore
            </h3>
            <ul className="mt-5 space-y-3">
              {MAIN_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-primary-foreground/70 transition-colors hover:text-accent"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/products?sort=newest"
                  className="text-sm text-primary-foreground/70 transition-colors hover:text-accent"
                >
                  New Arrivals
                </Link>
              </li>
            </ul>
          </nav>

          {/* Collections */}
          <nav aria-label="Collections">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-foreground">
              Collections
            </h3>
            <ul className="mt-5 space-y-3">
              {COLLECTION_LIST.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/collections/${c.slug}`}
                    className="text-sm text-primary-foreground/70 transition-colors hover:text-accent"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-foreground">
              Get in touch
            </h3>
            <ul className="mt-5 space-y-4 text-sm text-primary-foreground/70">
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

        <Separator className="my-10 bg-primary-foreground/12" />

        <div className="flex flex-col items-center justify-between gap-4 text-xs text-primary-foreground/55 sm:flex-row">
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
