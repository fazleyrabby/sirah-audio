import { escapeHtml, formatTime } from "../i18n/strings.ts";
import type { ChapterContent } from "../types.ts";

// Full transcript by scene. Each line is a button that seeks to its timestamp (SPEC 42).
export function renderTranscript(content: ChapterContent): string {
  return content.scenes
    .map((scene) => {
      const lines = content.subtitles
        .map((segment, index) => ({ segment, index }))
        .filter(({ segment }) => segment.sceneId === scene.id)
        .map(({ segment, index }) => `<button type="button" class="line" data-line="${index}" data-seek="${segment.start}">${escapeHtml(segment.text)}</button>`)
        .join("");
      return `<section class="transcript__scene"><h3><span>${formatTime(scene.start)}</span> ${escapeHtml(scene.title)}</h3>${lines}</section>`;
    })
    .join("");
}

export function markTranscriptLine(panel: HTMLElement, index: number, follow: boolean): void {
  panel.querySelector(".line.is-active")?.classList.remove("is-active");
  const line = panel.querySelector<HTMLElement>(`.line[data-line="${index}"]`);
  if (!line) return;
  line.classList.add("is-active");
  if (follow) line.scrollIntoView({ block: "center", behavior: "smooth" });
}
