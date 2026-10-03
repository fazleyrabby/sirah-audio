// Chapter text with its references, for chapters that are written but not yet narrated.
import { loadChapter } from "../chapters/chapter-loader.ts";
import { parts } from "../chapters/chapters.ts";
import { renderSources } from "../components/source-panel.ts";
import { escapeHtml, t } from "../i18n/strings.ts";
import { href } from "../router/router.ts";
import type { ChapterContent, ChapterMeta, Language } from "../types.ts";

export function renderChapterText(content: ChapterContent): string {
  return content.scenes
    .map((scene) => {
      const paragraphs = new Map<number, { text: string[]; refs: string[] }>();
      for (const segment of content.subtitles) {
        if (segment.sceneId !== scene.id) continue;
        const paragraph = paragraphs.get(segment.para) ?? { text: [], refs: [] };
        paragraph.text.push(escapeHtml(segment.text));
        if (segment.refs) paragraph.refs = segment.refs;
        paragraphs.set(segment.para, paragraph);
      }
      const body = [...paragraphs.values()]
        .map(
          (paragraph) =>
            `<p class="reader__text" lang="${content.language}">${paragraph.text.join(" ")}</p>` +
            (paragraph.refs.length ? `<p class="refs">${paragraph.refs.map((ref) => `<span>${escapeHtml(ref)}</span>`).join("")}</p>` : ""),
        )
        .join("");
      return `<section><h2>${escapeHtml(scene.title)}</h2>${body}</section>`;
    })
    .join("");
}

export function mountReader(root: HTMLElement, chapter: ChapterMeta, language: Language): () => void {
  const part = parts.find((candidate) => candidate.id === chapter.part)!;
  root.innerHTML = `<main class="page page--prose reader">
    <p class="eyebrow">${t("chapter", language)} ${chapter.id} · ${escapeHtml(part.title[language])}</p>
    <h1>${escapeHtml(chapter.title[language])}</h1>
    <p class="notice">${t("audioSoon", language)}</p>
    <div data-text><p>${t("loading", language)}</p></div>
    <p><a class="button button--quiet" href="${href("/chapters", language)}">${t("toChapters", language)}</a></p>
  </main>`;
  const target = root.querySelector<HTMLElement>("[data-text]")!;
  let alive = true;
  loadChapter(chapter, language)
    .then((content) => {
      if (!alive) return;
      target.innerHTML = `${renderChapterText(content)}<h2>${t("sources", language)}</h2>${renderSources(content, language)}
        <p class="disclaimer">${t("disclaimer", language)}</p>`;
    })
    .catch(() => {
      if (alive) target.innerHTML = `<p>${t("loadError", language)} ${t("tryAgain", language)}</p>`;
    });
  return () => {
    alive = false;
  };
}
