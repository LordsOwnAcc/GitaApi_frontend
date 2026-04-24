import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { fetchChapters } from "@/lib/gita-api.functions";
import type { Chapter } from "@/lib/gita-types";

const chaptersQuery = () =>
  queryOptions({
    queryKey: ["chapters"],
    queryFn: () => fetchChapters(),
  });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bhagavad Gita — All 18 Chapters" },
      {
        name: "description",
        content:
          "Browse all 18 chapters of the Bhagavad Gita. Read 700+ verses in Sanskrit with English and Hindi translations from renowned scholars.",
      },
      { property: "og:title", content: "Bhagavad Gita — All 18 Chapters" },
      {
        property: "og:description",
        content: "Browse all 18 chapters of the Bhagavad Gita.",
      },
    ],
  }),
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(chaptersQuery()),
  component: HomePage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <p className="font-sanskrit text-4xl text-saffron">ॐ</p>
      <h1 className="mt-4 text-2xl font-bold">Could not load chapters</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
});

function HomePage() {
  const { data: chapters } = useSuspenseQuery(chaptersQuery());
  const sorted = [...chapters].sort(
    (a, b) => a.chapter_number - b.chapter_number,
  );

  return (
    <div>
      <Hero totalVerses={sorted.reduce((s, c) => s + c.verses_count, 0)} />
      <section
        id="chapters"
        className="mx-auto max-w-6xl px-4 py-16 scroll-mt-20"
      >
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-saffron font-semibold">
            Eighteen Chapters
          </p>
          <h2 className="mt-3 text-4xl md:text-5xl font-display font-semibold">
            The Sacred Discourse
          </h2>
          <div className="om-divider mt-6 max-w-md mx-auto">
            <span className="font-sanskrit text-xl">ॐ</span>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((c) => (
            <ChapterCard key={c.chapter_number} chapter={c} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Hero({ totalVerses }: { totalVerses: number }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-30 blur-3xl bg-gradient-saffron" />
      </div>

      <div className="mx-auto max-w-4xl px-4 py-24 md:py-32 text-center">
        <p className="font-sanskrit text-6xl md:text-7xl text-saffron leading-none mb-6 select-none">
          ॐ
        </p>
        <p className="text-xs uppercase tracking-[0.4em] text-indigo-deep font-semibold">
          श्रीमद् भगवद् गीता
        </p>
        <h1 className="mt-6 text-5xl md:text-7xl font-display font-semibold leading-[1.05]">
          The eternal{" "}
          <span className="italic text-saffron-deep">song</span>
          <br />
          of the Lord
        </h1>
        <p className="mt-6 max-w-xl mx-auto text-lg text-muted-foreground leading-relaxed">
          A timeless dialogue between Krishna and Arjuna on the battlefield of
          Kurukshetra. Read 18 chapters and {totalVerses}+ verses with
          Sanskrit, transliteration, and translations from revered teachers.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
          <a
            href="#chapters"
            className="rounded-md bg-gradient-saffron px-6 py-3 text-sm font-semibold text-primary-foreground shadow-elegant hover:opacity-95 transition"
          >
            Begin Reading
          </a>
          <Link
            to="/verse/$chapter/$verse"
            params={{ chapter: "2", verse: "47" }}
            className="rounded-md border border-border bg-background/80 backdrop-blur px-6 py-3 text-sm font-semibold hover:border-saffron hover:text-saffron transition"
          >
            Famous Verse 2.47 →
          </Link>
        </div>
      </div>
    </section>
  );
}

function ChapterCard({ chapter }: { chapter: Chapter }) {
  return (
    <Link
      to="/chapter/$id"
      params={{ id: String(chapter.chapter_number) }}
      className="group relative block rounded-xl border border-border bg-card p-6 shadow-soft hover:shadow-elegant hover:border-saffron/60 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-saffron text-primary-foreground font-display font-bold text-lg shadow-soft">
          {chapter.chapter_number}
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 py-1 rounded-full bg-secondary">
          {chapter.verses_count} verses
        </span>
      </div>

      <p className="font-sanskrit text-2xl text-foreground mb-2 leading-tight">
        {chapter.name}
      </p>
      <h3 className="font-display text-xl font-semibold text-saffron-deep">
        {chapter.transliteration}
      </h3>
      <p className="text-sm text-muted-foreground mt-1 italic">
        {chapter.meaning.en}
      </p>

      <div className="mt-4 flex items-center text-sm font-medium text-indigo-deep group-hover:text-saffron transition-colors">
        Read chapter
        <span className="ml-1 transition-transform group-hover:translate-x-1">
          →
        </span>
      </div>
    </Link>
  );
}
