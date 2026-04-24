import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { fetchChapter, fetchChapterVerses } from "@/lib/gita-api.functions";
import { extractVerseTexts } from "@/lib/verse-utils";

const chapterQuery = (id: number) =>
  queryOptions({
    queryKey: ["chapter", id],
    queryFn: () => fetchChapter({ data: { id } }),
  });

const versesQuery = (id: number) =>
  queryOptions({
    queryKey: ["chapter-verses", id],
    queryFn: () => fetchChapterVerses({ data: { id } }),
  });

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/chapter/$id")({
  validateSearch: zodValidator(searchSchema),
  loader: async ({ params, context: { queryClient } }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id < 1 || id > 18) throw notFound();
    await Promise.all([
      queryClient.ensureQueryData(chapterQuery(id)),
      queryClient.ensureQueryData(versesQuery(id)),
    ]);
    return { id };
  },
  head: ({ params }) => ({
    meta: [
      { title: `Chapter ${params.id} — Bhagavad Gita` },
      {
        name: "description",
        content: `Read all verses of Bhagavad Gita Chapter ${params.id} with Sanskrit, transliteration and translations.`,
      },
      {
        property: "og:title",
        content: `Chapter ${params.id} — Bhagavad Gita`,
      },
    ],
  }),
  component: ChapterPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <p className="font-sanskrit text-4xl text-saffron">ॐ</p>
      <h1 className="mt-4 text-2xl font-bold">Chapter not found</h1>
      <p className="mt-2 text-muted-foreground">
        The Gita has 18 chapters (1–18).
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-md bg-gradient-saffron px-5 py-2.5 text-sm font-medium text-primary-foreground"
      >
        All Chapters
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Could not load chapter</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
});

function ChapterPage() {
  const { id } = Route.useLoaderData();
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: chapter } = useSuspenseQuery(chapterQuery(id));
  const { data: verses } = useSuspenseQuery(versesQuery(id));

  const filtered = q
    ? verses.filter((v) => {
        const haystack = [
          v.slok,
          v.transliteration,
          ...extractVerseTexts(v).map((t) => t.text),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q.toLowerCase());
      })
    : verses;

  return (
    <div>
      {/* Chapter header */}
      <section className="border-b border-border/60 bg-card/50">
        <div className="mx-auto max-w-4xl px-4 py-12 md:py-16">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground hover:text-saffron mb-6"
          >
            ← All Chapters
          </Link>
          <div className="flex items-start gap-6">
            <div className="hidden sm:flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-saffron text-primary-foreground font-display font-bold text-3xl shadow-elegant">
              {chapter.chapter_number}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.3em] text-saffron font-semibold">
                Adhyaya {chapter.chapter_number} · {chapter.verses_count} verses
              </p>
              <p className="font-sanskrit text-3xl md:text-4xl mt-3">
                {chapter.name}
              </p>
              <h1 className="font-display text-3xl md:text-5xl font-semibold mt-2">
                {chapter.transliteration}
              </h1>
              <p className="mt-2 text-lg italic text-saffron-deep">
                "{chapter.meaning.en}"
              </p>
            </div>
          </div>
          <p className="mt-6 text-muted-foreground leading-relaxed max-w-prose">
            {chapter.summary.en}
          </p>
        </div>
      </section>

      {/* Search filter */}
      <section className="mx-auto max-w-4xl px-4 pt-8">
        <div className="relative">
          <input
            type="search"
            value={q}
            onChange={(e) =>
              navigate({
                search: (prev) => ({ ...prev, q: e.target.value }),
                replace: true,
              })
            }
            placeholder="Filter verses by text, transliteration, or translation…"
            className="w-full rounded-lg border border-border bg-card px-4 py-3 pl-11 text-sm shadow-soft focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20 transition"
          />
          <svg
            className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Showing {filtered.length} of {verses.length} verses
        </p>
      </section>

      {/* Verses list */}
      <section className="mx-auto max-w-4xl px-4 py-8 space-y-4">
        {filtered.map((v) => (
          <Link
            key={v.verse}
            to="/verse/$chapter/$verse"
            params={{
              chapter: String(v.chapter),
              verse: String(v.verse),
            }}
            className="group block rounded-xl border border-border bg-card p-6 shadow-soft hover:shadow-elegant hover:border-saffron/50 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-saffron">
                Verse {v.chapter}.{v.verse}
              </span>
              <span className="text-xs text-muted-foreground group-hover:text-saffron transition">
                Read →
              </span>
            </div>
            <p className="font-sanskrit text-lg text-foreground whitespace-pre-line line-clamp-3">
              {v.slok}
            </p>
            <p className="mt-2 text-sm italic text-muted-foreground line-clamp-2">
              {v.transliteration}
            </p>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            No verses match your filter.
          </div>
        )}
      </section>
    </div>
  );
}
