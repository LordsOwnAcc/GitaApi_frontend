import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { fetchAllVerses } from "@/lib/gita-api.functions";
import { extractVerseTexts } from "@/lib/verse-utils";
import { LANGUAGE_OPTIONS, type LanguageFilter } from "@/lib/gita-types";

const allVersesQuery = () =>
  queryOptions({
    queryKey: ["all-verses"],
    queryFn: () => fetchAllVerses(),
    staleTime: 1000 * 60 * 60, // 1h
  });

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  lang: fallback(
    z.enum(["all", "en", "hi", "sa"]),
    "all",
  ).default("all"),
  chapter: fallback(z.string(), "all").default("all"),
});

export const Route = createFileRoute("/search")({
  validateSearch: zodValidator(searchSchema),
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(allVersesQuery()),
  head: () => ({
    meta: [
      { title: "Search the Bhagavad Gita — Find Any Verse" },
      {
        name: "description",
        content:
          "Search every verse in the Bhagavad Gita by Sanskrit, transliteration, or translation across all 18 chapters.",
      },
    ],
  }),
  component: SearchPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Could not load verses</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
});

type Hit = {
  chapter: number;
  verse: number;
  slok: string;
  transliteration: string;
  snippet: string;
  snippetLang: "en" | "hi" | "sa" | "tr";
};

function buildSnippet(text: string, q: string): string {
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text.slice(0, 160);
  const start = Math.max(0, idx - 60);
  const end = Math.min(text.length, idx + q.length + 100);
  return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
}

function SearchPage() {
  const { q, lang, chapter } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: verses } = useSuspenseQuery(allVersesQuery());

  const setSearch = (patch: Partial<{ q: string; lang: LanguageFilter; chapter: string }>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  const trimmed = q.trim();
  const hits: Hit[] = [];

  if (trimmed.length >= 2) {
    const needle = trimmed.toLowerCase();
    for (const v of verses) {
      if (chapter !== "all" && String(v.chapter) !== chapter) continue;

      let matched: Hit | null = null;

      // Sanskrit / transliteration always searched unless lang restricts
      if (lang === "all" || lang === "sa") {
        if (v.slok.toLowerCase().includes(needle)) {
          matched = {
            chapter: v.chapter,
            verse: v.verse,
            slok: v.slok,
            transliteration: v.transliteration,
            snippet: buildSnippet(v.slok, trimmed),
            snippetLang: "sa",
          };
        }
      }
      if (!matched && (lang === "all")) {
        if (v.transliteration.toLowerCase().includes(needle)) {
          matched = {
            chapter: v.chapter,
            verse: v.verse,
            slok: v.slok,
            transliteration: v.transliteration,
            snippet: buildSnippet(v.transliteration, trimmed),
            snippetLang: "tr",
          };
        }
      }
      if (!matched) {
        const entries = extractVerseTexts(v);
        const candidate = entries.find((e) => {
          if (lang !== "all" && e.language !== lang) return false;
          return e.text.toLowerCase().includes(needle);
        });
        if (candidate) {
          matched = {
            chapter: v.chapter,
            verse: v.verse,
            slok: v.slok,
            transliteration: v.transliteration,
            snippet: buildSnippet(candidate.text, trimmed),
            snippetLang: candidate.language,
          };
        }
      }

      if (matched) hits.push(matched);
      if (hits.length >= 200) break;
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="text-center mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-saffron font-semibold">
          Universal Search
        </p>
        <h1 className="mt-2 text-3xl md:text-4xl font-display font-semibold">
          Search the Gita
        </h1>
      </div>

      {/* Search input */}
      <div className="relative">
        <input
          type="search"
          autoFocus
          value={q}
          onChange={(e) => setSearch({ q: e.target.value })}
          placeholder="Search any verse — sanskrit, transliteration, or translation…"
          className="w-full rounded-lg border border-border bg-card px-4 py-3.5 pl-12 text-base shadow-soft focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20 transition"
        />
        <svg
          className="absolute left-4 top-4 h-5 w-5 text-muted-foreground"
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

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            Language:
          </span>
          {LANGUAGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSearch({ lang: opt.value })}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all border ${
                lang === opt.value
                  ? "bg-gradient-saffron text-primary-foreground border-transparent shadow-soft"
                  : "bg-background border-border text-foreground hover:border-saffron hover:text-saffron"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            Chapter:
          </span>
          <select
            value={chapter}
            onChange={(e) => setSearch({ chapter: e.target.value })}
            className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:border-saffron"
          >
            <option value="all">All</option>
            {Array.from({ length: 18 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={String(n)}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="mt-8">
        {trimmed.length < 2 ? (
          <p className="text-center text-sm text-muted-foreground py-12">
            Type at least 2 characters to search across all 700+ verses.
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              {hits.length === 200
                ? "Showing first 200 matches"
                : `${hits.length} match${hits.length === 1 ? "" : "es"}`}
            </p>
            <div className="space-y-3">
              {hits.map((h) => (
                <Link
                  key={`${h.chapter}.${h.verse}`}
                  to="/verse/$chapter/$verse"
                  params={{
                    chapter: String(h.chapter),
                    verse: String(h.verse),
                  }}
                  className="block rounded-xl border border-border bg-card p-5 shadow-soft hover:shadow-elegant hover:border-saffron/60 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-saffron">
                      Verse {h.chapter}.{h.verse}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                      {h.snippetLang === "sa"
                        ? "Sanskrit"
                        : h.snippetLang === "hi"
                          ? "Hindi"
                          : h.snippetLang === "tr"
                            ? "Transliteration"
                            : "English"}
                    </span>
                  </div>
                  <p
                    className={`whitespace-pre-line leading-relaxed text-sm ${
                      h.snippetLang === "sa" || h.snippetLang === "hi"
                        ? "font-sanskrit text-base"
                        : ""
                    }`}
                  >
                    {h.snippet}
                  </p>
                </Link>
              ))}
              {hits.length === 0 && (
                <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
                  No verses found for "{trimmed}".
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
