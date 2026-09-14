import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { getNewsPosts } from "@/lib/queries/news";

export const metadata: Metadata = {
  title: "News",
  description:
    "Company updates from National Plasto Pvt. Ltd. — exhibitions, product launches and milestones.",
  alternates: { canonical: "/news" },
};

// Posts are published from the admin panel, not by a deploy.
export const dynamic = "force-dynamic";

const DATE = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function NewsPage() {
  const posts = await getNewsPosts();

  return (
    <>
      <PageHeader
        eyebrow="News"
        title="What we have been up to"
        description="Exhibitions, new products, and the occasional milestone worth marking."
        crumbs={[{ label: "News" }]}
      />

      <div className="container-page py-10 lg:py-14">
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
            <Newspaper className="mx-auto size-8 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-bold tracking-tight text-foreground">
              Nothing published yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Company updates will appear here as they are posted.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article key={post.id} className="flex flex-col">
                <Link
                  href={`/news/${post.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-shadow hover:shadow-lift"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-secondary">
                    {post.image ? (
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className="grid h-full place-items-center">
                        <Newspaper className="size-7 text-muted-foreground" />
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <time
                      dateTime={post.publishedAt}
                      className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                    >
                      {DATE.format(new Date(post.publishedAt))}
                    </time>

                    <h2 className="text-base font-bold leading-snug tracking-tight text-foreground transition-colors group-hover:text-accent">
                      {post.title}
                    </h2>

                    <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {post.excerpt}
                    </p>

                    <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-xs font-bold uppercase tracking-[0.12em] text-accent">
                      Read more
                      <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
