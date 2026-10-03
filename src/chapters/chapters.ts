import index from "./index.generated.json";
import type { ChapterIndex, ChapterMeta, Language } from "../types.ts";

const data = index as ChapterIndex;

export const parts = data.parts;
export const chapters = data.chapters;

export function chapterBySlug(slug: string): ChapterMeta | undefined {
  return chapters.find((chapter) => chapter.slug === slug);
}

export function chapterById(id: string | null): ChapterMeta | undefined {
  return chapters.find((chapter) => chapter.id === id);
}

export function isPlayable(chapter: ChapterMeta, language: Language): boolean {
  return chapter.status !== "coming-soon" && Boolean(chapter.audio[language]);
}

export function isReadable(chapter: ChapterMeta, language: Language): boolean {
  return chapter.status !== "coming-soon" && Boolean(chapter.text[language]);
}

// Neighbouring playable chapter in the given direction, skipping "coming soon" ones.
export function neighbour(chapter: ChapterMeta, language: Language, direction: 1 | -1): ChapterMeta | undefined {
  for (let i = chapter.order - 1 + direction; i >= 0 && i < chapters.length; i += direction) {
    if (isPlayable(chapters[i], language)) return chapters[i];
  }
  return undefined;
}

export function firstPlayable(language: Language): ChapterMeta | undefined {
  return chapters.find((chapter) => isPlayable(chapter, language));
}
