import type { Metadata } from "next";
import { Clock, Info, Mail, MapPin, Phone } from "lucide-react";

import { ContactForm } from "@/components/forms/contact-form";
import { PageHeader } from "@/components/layout/page-header";
import { Reveal } from "@/components/animations/motion-primitives";
import { SITE } from "@/lib/constants";
import { getContact } from "@/lib/queries/content";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Get in touch with ${SITE.legalName} in Kolkata for product enquiries, pricing and bulk orders.`,
  alternates: { canonical: "/contact" },
};

export const revalidate = 3600;

export default async function ContactPage() {
  const contact = await getContact();

  // Placeholder details are all zeros/example domains until the business
  // supplies real ones; flag that plainly rather than presenting them as fact.
  const isPlaceholder =
    contact.phonePrimary.replace(/\D/g, "").replace(/0/g, "") === "" ||
    contact.emailGeneral.endsWith("@nationalplasto.com");

  const details = [
    {
      icon: MapPin,
      label: "Visit us",
      lines: [contact.addressLine1, contact.addressLine2, contact.pincode].filter(Boolean),
    },
    {
      icon: Phone,
      label: "Call us",
      lines: [contact.phonePrimary, contact.phoneSecondary].filter(Boolean),
      href: `tel:${contact.phonePrimary.replace(/\s/g, "")}`,
    },
    {
      icon: Mail,
      label: "Email us",
      lines: [contact.emailGeneral, contact.emailSales].filter(Boolean),
      href: `mailto:${contact.emailGeneral}`,
    },
    {
      icon: Clock,
      label: "Business hours",
      lines: [contact.hoursWeekday, contact.hoursWeekend].filter(Boolean),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Talk to our team"
        description="Questions about a product, pricing, availability or a bulk order? Send us a message and we'll get back to you."
        crumbs={[{ label: "Contact" }]}
      />

      <div className="container-page py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.25fr] lg:gap-16">
          {/* Details */}
          <div>
            <div className="space-y-4">
              {details.map((detail, i) => (
                <Reveal key={detail.label} delay={i * 0.08}>
                  <div className="group flex gap-5 rounded-2xl border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent/18 to-accent/5 text-accent transition-transform duration-300 group-hover:scale-110">
                      <detail.icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {detail.label}
                      </p>
                      <div className="mt-2 space-y-0.5">
                        {detail.lines.map((line) => (
                          <p key={line} className="break-words text-sm text-foreground/90">
                            {detail.href ? (
                              <a href={detail.href} className="hover:text-accent">
                                {line}
                              </a>
                            ) : (
                              line
                            )}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            {isPlaceholder && (
              <Reveal delay={0.3}>
                <div className="mt-5 flex gap-3 rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/8 p-5">
                  <Info className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground">Placeholder details.</span>{" "}
                    The phone number, email addresses and street address above are
                    placeholders. Update them from{" "}
                    <span className="font-medium">Admin → Content → Contact</span> before
                    going live.
                  </p>
                </div>
              </Reveal>
            )}
          </div>

          {/* Form */}
          <Reveal delay={0.15}>
            <ContactForm />
          </Reveal>
        </div>
      </div>

      {/* Map */}
      <section className="container-page pb-20">
        <Reveal>
          <div className="overflow-hidden rounded-3xl border border-border shadow-soft">
            <div className="flex items-center gap-3 border-b border-border bg-card px-6 py-4">
              <MapPin className="size-4 text-accent" />
              <p className="text-sm font-medium">{contact.mapLabel}</p>
            </div>
            <iframe
              src={contact.mapEmbedUrl}
              title={`Map showing ${contact.mapLabel}`}
              className="h-[26rem] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Map location is editable from Admin → Content → Contact.
          </p>
        </Reveal>
      </section>
    </>
  );
}
