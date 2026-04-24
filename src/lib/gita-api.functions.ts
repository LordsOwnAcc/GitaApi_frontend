import { createServerFn } from "@tanstack/react-start";
import type { Chapter, Verse } from "./gita-types";

const API_BASE = "https://gita-api-1.onrender.com";

async function safeFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`Upstream error ${res.status}: ${url}`);
  }
  return (await res.json()) as T;
}

export const fetchChapters = createServerFn({ method: "GET" }).handler(
  async (): Promise<Chapter[]> => {
    return safeFetch<Chapter[]>(`${API_BASE}/chapter`);
  },
);

export const fetchChapter = createServerFn({ method: "GET" })
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data }): Promise<Chapter> => {
    return safeFetch<Chapter>(`${API_BASE}/chapter/${data.id}`);
  });

// /shlok/{chapterNumber} returns all verses of a chapter
export const fetchChapterVerses = createServerFn({ method: "GET" })
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data }): Promise<Verse[]> => {
    return safeFetch<Verse[]>(`${API_BASE}/shlok/${data.id}`);
  });

export const fetchVerse = createServerFn({ method: "GET" })
  .inputValidator((data: { chapter: number; verse: number }) => data)
  .handler(async ({ data }): Promise<Verse> => {
    return safeFetch<Verse>(`${API_BASE}/shlok/${data.chapter}/${data.verse}`);
  });
