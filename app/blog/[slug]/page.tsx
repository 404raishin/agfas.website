import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { decodeEntities, getPostBySlug } from "@/lib/wp";
import { formatDate } from "@/lib/format";

export const revalidate = 600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: decodeEntities(post.title.rendered),
    description: decodeEntities(post.excerpt.rendered).slice(0, 160),
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const media = post._embedded?.["wp:featuredmedia"]?.[0];

  return (
    <article className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
      <Link href="/blog" className="font-mono text-xs text-steel transition-colors hover:text-ink">
        ← Safety notes
      </Link>

      <time className="mt-8 block font-mono text-[0.625rem] uppercase tracking-[0.16em] text-steel">
        {formatDate(post.date)}
      </time>
      <h1 className="mt-3 text-4xl sm:text-5xl">{decodeEntities(post.title.rendered)}</h1>

      {media?.source_url && (
        <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-[var(--radius-card)] border border-line bg-mist">
          <Image
            src={media.source_url}
            alt={media.alt_text || ""}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        </div>
      )}

      <div
        className="mt-10 text-base leading-relaxed text-ink/85 [&_a]:text-flame-deep [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:border-l-2 [&_blockquote]:border-flame [&_blockquote]:pl-5 [&_blockquote]:text-steel [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:text-ink [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:text-ink [&_img]:rounded-lg [&_li]:mb-1.5 [&_ol]:mb-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-5 [&_ul]:mb-5 [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: post.content.rendered }}
      />
    </article>
  );
}
