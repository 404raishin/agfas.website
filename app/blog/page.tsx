import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { decodeEntities, getPosts } from "@/lib/wp";
import { formatDate } from "@/lib/format";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Safety notes",
  description: "Guidance on gas leak detection, detector placement and fire safety from AGFAS.",
};

export default async function BlogPage() {
  const posts = await getPosts(12);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="eyebrow">
        <span className="status-dot" />
        Safety notes
      </p>
      <h1 className="mt-4 text-4xl sm:text-5xl">Guidance worth reading before you buy</h1>
      <p className="mt-5 max-w-xl text-base leading-relaxed text-steel sm:text-lg">
        Placement, testing and what to do when an alarm actually sounds.
      </p>

      {posts.length > 0 ? (
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const media = post._embedded?.["wp:featuredmedia"]?.[0];
            return (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line transition-all hover:border-ink/20 hover:shadow-[0_18px_40px_-28px_rgba(22,25,29,0.45)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-mist">
                  {media?.source_url && (
                    <Image
                      src={media.source_url}
                      alt={media.alt_text || ""}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <time className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-steel">
                    {formatDate(post.date)}
                  </time>
                  <h2 className="mt-2 text-lg leading-snug font-semibold">
                    {decodeEntities(post.title.rendered)}
                  </h2>
                  <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-steel">
                    {decodeEntities(post.excerpt.rendered)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-14 rounded-[var(--radius-card)] border border-dashed border-line bg-mist p-12 text-center">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-steel">
            No posts yet
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">
            Posts published in WordPress appear here automatically.
          </p>
        </div>
      )}
    </div>
  );
}
