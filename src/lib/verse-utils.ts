import type { Verse, Commentary, LanguageFilter } from "./gita-types";

export type CommentaryEntry = {
  key: string;
  author: string;
  text: string;
  /** ht=hindi-translation, hc=hindi-commentary, et=english-translation,
   *  ec=english-commentary, sc=sanskrit-commentary */
  type: "ht" | "hc" | "et" | "ec" | "sc";
  language: "hi" | "en" | "sa";
  kind: "translation" | "commentary";
};

const TYPE_META: Record<
  CommentaryEntry["type"],
  { language: "hi" | "en" | "sa"; kind: "translation" | "commentary"; label: string }
> = {
  ht: { language: "hi", kind: "translation", label: "Hindi Translation" },
  hc: { language: "hi", kind: "commentary", label: "Hindi Commentary" },
  et: { language: "en", kind: "translation", label: "English Translation" },
  ec: { language: "en", kind: "commentary", label: "English Commentary" },
  sc: { language: "sa", kind: "commentary", label: "Sanskrit Commentary" },
};

export function getTypeLabel(type: CommentaryEntry["type"]): string {
  return TYPE_META[type].label;
}

const TRANSLATOR_KEYS: Array<keyof Verse> = [
  "tej",
  "siva",
  "purohit",
  "chinmay",
  "san",
  "adi",
  "gambir",
  "madhav",
  "anand",
  "abhinav",
  "jaya",
  "vallabh",
  "ms",
  "srid",
  "dhan",
  "venkat",
  "puru",
  "neel",
  "prabhu",
  "rams",
  "raman",
  "kesav",
];

export function extractVerseTexts(verse: Verse): CommentaryEntry[] {
  const out: CommentaryEntry[] = [];
  for (const key of TRANSLATOR_KEYS) {
    const c = verse[key] as Commentary | undefined;
    if (!c || typeof c !== "object") continue;
    (Object.keys(TYPE_META) as Array<CommentaryEntry["type"]>).forEach(
      (type) => {
        const text = c[type];
        if (typeof text === "string" && text.trim().length > 0) {
          out.push({
            key: String(key),
            author: c.author ?? String(key),
            text,
            type,
            language: TYPE_META[type].language,
            kind: TYPE_META[type].kind,
          });
        }
      },
    );
  }
  return out;
}

export function filterEntries(
  entries: CommentaryEntry[],
  language: LanguageFilter,
  translator: string,
  kind: "all" | "translation" | "commentary",
): CommentaryEntry[] {
  return entries.filter((e) => {
    if (language !== "all" && e.language !== language) return false;
    if (translator !== "all" && e.key !== translator) return false;
    if (kind !== "all" && e.kind !== kind) return false;
    return true;
  });
}

export function uniqueTranslators(
  entries: CommentaryEntry[],
): Array<{ key: string; author: string }> {
  const map = new Map<string, string>();
  for (const e of entries) {
    if (!map.has(e.key)) map.set(e.key, e.author);
  }
  return Array.from(map, ([key, author]) => ({ key, author }));
}
