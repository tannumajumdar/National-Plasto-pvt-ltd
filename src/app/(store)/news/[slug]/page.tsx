import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { getNewsPostBySlug } from "@/lib/queries/news";

export const dynamic = "force-dynamic";

const DATE = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getNewsPostBySlug(slug);
  if (!post) return { title: "Not found" };

  return {
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt,
    alternates: { canonical: `/news/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      ...(post.image ? { images: [{ url: post.image }] } : {}),
    },
  };
}

export default async function NewsPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getNewsPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <PageHeader
        eyebrow={DATE.format(new Date(post.publishedAt))}
        title={post.title}
        description={post.excerpt}
        crumbs={[{ label: "News", href: "/news" }, { label: post.title }]}
      />

      <article className="container-page py-10 lg:py-14">
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          {post.image && (
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-secondary">
              <Image
                src={post.image}
                alt={post.title}
                fill
                sizes="(max-width: 1024px) 100vw, 48rem"
                priority
                className="object-cover"
              />
            </div>
          )}

          {/* Stored as plain text, so paragraph breaks are honoured rather than
              collapsed — the admin panel has no rich-text editor. */}
          {post.body && (
            <div className="whitespace-pre-line text-base leading-relaxed text-body text-muted-foreground">
              {post.body}
            </div>
          )}

          <Link
            href="/news"
            className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-accent"
          >
            <ArrowLeft className="size-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
            All news
          </Link>
        </div>
      </article>
    </>
  );
}
