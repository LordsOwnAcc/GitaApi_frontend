export type Chapter = {
  chapter_number: number;
  verses_count: number;
  name: string;
  translation: string;
  transliteration: string;
  meaning: { en: string; hi: string };
  summary: { en: string; hi: string };
};

export type Commentary = {
  author: string;
  ht?: string; // hindi translation
  hc?: string; // hindi commentary
  et?: string; // english translation
  ec?: string; // english commentary
  sc?: string; // sanskrit commentary
};

export type Verse = {
  chapter: number;
  verse: number;
  slok: string;
  transliteration: string;
  tej?: Commentary;
  siva?: Commentary;
  purohit?: Commentary;
  chinmay?: Commentary;
  san?: Commentary;
  adi?: Commentary;
  gambir?: Commentary;
  madhav?: Commentary;
  anand?: Commentary;
  abhinav?: Commentary;
  jaya?: Commentary;
  vallabh?: Commentary;
  ms?: Commentary;
  srid?: Commentary;
  dhan?: Commentary;
  venkat?: Commentary;
  puru?: Commentary;
  neel?: Commentary;
  prabhu?: Commentary;
  rams?: Commentary;
  raman?: Commentary;
  kesav?: Commentary;
  [key: string]: unknown;
};

export const TRANSLATOR_KEYS = [
  "tej",
  "siva",
  "purohit",
  "chinmay",
  "san",
  "adi",
  "gambir",
  "madhav",
  "anand",
] as const;

export type TranslatorKey = (typeof TRANSLATOR_KEYS)[number];

export const LANGUAGE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "sa", label: "Sanskrit" },
] as const;

export type LanguageFilter = (typeof LANGUAGE_OPTIONS)[number]["value"];
