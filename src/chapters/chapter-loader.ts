import type { ChapterContent, ChapterMeta, Language } from "../types.ts";

const cache = new Map<string, ChapterContent>();

function isValid(content: unknown): content is ChapterContent {
  const candidate = content as ChapterContent;
  return (
    Boolean(candidate) &&
    Array.isArray(candidate.scenes) &&
    candidate.scenes.length > 0 &&
    typeof candidate.narrated === "boolean" &&
    Array.isArray(candidate.subtitles) &&
    candidate.subtitles.every((segment) => typeof segment.start === "number" && typeof segment.text === "string") &&
    Array.isArray(candidate.visuals) &&
    Array.isArray(candidate.sources)
  );
}

export async function loadChapter(chapter: ChapterMeta, language: Language): Promise<ChapterContent> {
  const url = `/content/${chapter.id}/${language}.json?v=${chapter.version}`;
  const cached = cache.get(url);
  if (cached) return cached;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`chapter content ${response.status}`);
  const content: unknown = await response.json();
  // Never render partial data (SPEC 75).
  if (!isValid(content)) throw new Error("invalid chapter content");
  cache.set(url, content);
  return content;
}
