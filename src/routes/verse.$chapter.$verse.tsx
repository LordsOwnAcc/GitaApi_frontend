import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { fetchVerse, fetchChapter } from "@/lib/gita-api.functions";
import {
  extractVerseTexts,
  filterEntries,
  getTypeLabel,
  uniqueTranslators,
} from "@/lib/verse-utils";
import { LANGUAGE_OPTIONS } from "@/lib/gita-types";

const verseQuery = (chapter: number, verse: number) =>
  queryOptions({
    queryKey: ["verse", chapter, verse],
    queryFn: () => fetchVerse({ data: { chapter, verse } }),
  });

const chapterQuery = (id: number) =>
  queryOptions({
    queryKey: ["chapter", id],
    queryFn: () => fetchChapter({ data: { id } }),
  });

const searchSchema = z.object({
  lang: fallback(
    z.enum(["all", "en", "hi", "sa"]),
    "all",
  ).default("all"),
  translator: fallback(z.string(), "all").default("all"),
  kind: fallback(
    z.enum(["all", "translation", "commentary"]),
    "all",
  ).default("all"),
});

export const Route = createFileRoute("/verse/$chapter/$verse")({
  validateSearch: zodValidator(searchSchema),
  loader: async ({ params, context: { queryClient } }) => {
    const chapter = Number(params.chapter);
    const verse = Number(params.verse);
    if (
      !Number.isInteger(chapter) ||
      !Number.isInteger(verse) ||
      chapter < 1 ||
      chapter > 18 ||
      verse < 1
    ) {
      throw notFound();
    }
    await Promise.all([
      queryClient.ensureQueryData(verseQuery(chapter, verse)),
      queryClient.ensureQueryData(chapterQuery(chapter)),
    ]);
    return { chapter, verse };
  },
  head: ({ params }) => ({
    meta: [
      {
        title: `Bhagavad Gita ${params.chapter}.${params.verse} — Verse with Translations`,
      },
      {
        name: "description",
        content: `Read Bhagavad Gita verse ${params.chapter}.${params.verse} in Sanskrit with translations and commentaries from renowned scholars.`,
      },
      {
        property: "og:title",
        content: `Bhagavad Gita ${params.chapter}.${params.verse}`,
      },
    ],
  }),
  component: VersePage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <p className="font-sanskrit text-4xl text-saffron">ॐ</p>
      <h1 className="mt-4 text-2xl font-bold">Verse not found</h1>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-md bg-gradient-saffron px-5 py-2.5 text-sm font-medium text-primary-foreground"
      >
        Home
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Could not load verse</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
});

function VersePage() {
  const { chapter, verse } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: v } = useSuspenseQuery(verseQuery(chapter, verse));
  const { data: chap } = useSuspenseQuery(chapterQuery(chapter));

  const allEntries = extractVerseTexts(v);
  const translators = uniqueTranslators(allEntries);
  const filtered = filterEntries(
    allEntries,
    search.lang,
    search.translator,
    search.kind,
  );

  const setSearch = (patch: Partial<typeof search>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  return (
    <div>
      {/* Top breadcrumb */}
      <section className="border-b border-border/60 bg-card/50">
        <div className="mx-auto max-w-4xl px-4 py-6 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Link to="/" className="hover:text-saffron">
              Gita
            </Link>
            <span>›</span>
            <Link
              to="/chapter/$id"
              params={{ id: String(chapter) }}
              className="hover:text-saffron"
            >
              Chapter {chapter}
            </Link>
            <span>›</span>
            <span className="text-foreground font-medium">Verse {verse}</span>
          </div>
          <div className="flex items-center gap-2">
            {verse > 1 && (
              <Link
                to="/verse/$chapter/$verse"
                params={{
                  chapter: String(chapter),
                  verse: String(verse - 1),
                }}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:border-saffron hover:text-saffron"
              >
                ← {chapter}.{verse - 1}
              </Link>
            )}
            {verse < chap.verses_count && (
              <Link
                to="/verse/$chapter/$verse"
                params={{
                  chapter: String(chapter),
                  verse: String(verse + 1),
                }}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:border-saffron hover:text-saffron"
              >
                {chapter}.{verse + 1} →
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Sanskrit verse */}
      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="text-center mb-2">
          <p className="text-xs uppercase tracking-[0.3em] text-saffron font-semibold">
            {chap.transliteration} · Verse {chapter}.{verse}
          </p>
        </div>

        <div className="relative rounded-2xl border border-saffron/30 bg-card p-8 md:p-12 shadow-elegant text-center my-8">
          <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-background px-4 font-sanskrit text-2xl text-saffron">
            ॥ ॐ ॥
          </span>
          <p className="font-sanskrit text-2xl md:text-3xl whitespace-pre-line text-foreground leading-relaxed">
            {v.slok}
          </p>
          <div className="om-divider my-6">
            <span className="font-sanskrit text-sm">श्लोक</span>
          </div>
          <p className="text-base md:text-lg italic text-muted-foreground whitespace-pre-line leading-relaxed">
            {v.transliteration}
          </p>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-border bg-card/60 p-5 shadow-soft mb-8">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
            Filter translations & commentaries
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <FilterGroup label="Language">
              {LANGUAGE_OPTIONS.map((opt) => (
                <FilterChip
                  key={opt.value}
                  active={search.lang === opt.value}
                  onClick={() => setSearch({ lang: opt.value })}
                >
                  {opt.label}
                </FilterChip>
              ))}
            </FilterGroup>

            <FilterGroup label="Type">
              {(
                [
                  { v: "all", l: "All" },
                  { v: "translation", l: "Translations" },
                  { v: "commentary", l: "Commentaries" },
                ] as const
              ).map((o) => (
                <FilterChip
                  key={o.v}
                  active={search.kind === o.v}
                  onClick={() => setSearch({ kind: o.v })}
                >
                  {o.l}
                </FilterChip>
              ))}
            </FilterGroup>

            <FilterGroup label="Author">
              <select
                value={search.translator}
                onChange={(e) => setSearch({ translator: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:border-saffron"
              >
                <option value="all">All authors</option>
                {translators.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.author}
                  </option>
                ))}
              </select>
            </FilterGroup>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Showing {filtered.length} of {allEntries.length} entries
          </p>
        </div>

        {/* Translations */}
        <div className="space-y-4">
          {filtered.map((e, i) => (
            <article
              key={`${e.key}-${e.type}-${i}`}
              className="rounded-xl border border-border bg-card p-6 shadow-soft hover:shadow-elegant transition-shadow"
            >
              <header className="flex items-center justify-between gap-4 mb-3 flex-wrap">
                <h3 className="font-display text-lg font-semibold text-saffron-deep">
                  {e.author}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                    {getTypeLabel(e.type)}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full bg-saffron/10 text-saffron-deep">
                    {e.language === "en"
                      ? "English"
                      : e.language === "hi"
                        ? "Hindi"
                        : "Sanskrit"}
                  </span>
                </div>
              </header>
              <p
                className={`whitespace-pre-line leading-relaxed ${
                  e.language === "hi" || e.language === "sa"
                    ? "font-sanskrit text-base"
                    : "text-base"
                }`}
              >
                {e.text}
              </p>
            </article>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
              No entries match these filters. Try widening them.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-all border ${
        active
          ? "bg-gradient-saffron text-primary-foreground border-transparent shadow-soft"
          : "bg-background border-border text-foreground hover:border-saffron hover:text-saffron"
      }`}
    >
      {children}
    </button>
  );
}
