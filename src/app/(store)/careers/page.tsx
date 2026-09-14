import type { Metadata } from "next";
import { Briefcase, MapPin } from "lucide-react";

import { ApplyDialog } from "@/components/careers/apply-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getJobOpenings } from "@/lib/queries/careers";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Open roles at National Plasto Pvt. Ltd. — a plastic furniture and household products manufacturer in Kolkata, West Bengal.",
  alternates: { canonical: "/careers" },
};

// Openings change without a deploy, and an advertised role that has closed is
// worse than a slow page.
export const dynamic = "force-dynamic";

export default async function CareersPage() {
  const openings = await getJobOpenings();

  return (
    <>
      <PageHeader
        eyebrow="Careers"
        title="Work with us"
        description="We manufacture in Kolkata and sell across eastern India. When we are hiring, the roles are listed here — and we read every speculative application too."
        crumbs={[{ label: "Careers" }]}
      />

      <div className="container-page py-10 lg:py-14">
        {openings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
            <Briefcase className="mx-auto size-8 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-bold tracking-tight text-foreground">
              No openings right now
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Nothing is advertised at the moment. If you think you would be a fit
              for the factory, the office or the road, send your details and we
              will keep them on file.
            </p>
            <ApplyDialog
              roleTitle="Speculative application"
              trigger={
                <Button variant="accent" className="mt-6">
                  Send your details
                </Button>
              }
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              {openings.length} {openings.length === 1 ? "open role" : "open roles"}
            </p>

            {openings.map((role) => (
              <article
                key={role.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-lift sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold tracking-tight text-foreground">
                      {role.title}
                    </h2>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="size-3.5" />
                        {role.location}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Briefcase className="size-3.5" />
                        {role.employment}
                      </span>
                      {role.department && <span>{role.department}</span>}
                    </div>
                  </div>

                  <ApplyDialog
                    openingId={role.id}
                    roleTitle={role.title}
                    trigger={
                      <Button variant="accent" size="sm">
                        Apply
                      </Button>
                    }
                  />
                </div>

                <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
                  {role.summary}
                </p>

                {role.description && (
                  <div className="whitespace-pre-line border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
                    {role.description}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
