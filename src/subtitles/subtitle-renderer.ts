import type { SubtitleSegment } from "../types.ts";

// Phrase-level subtitles with a short fade between lines. No word highlighting (SPEC 31).
export function createSubtitleRenderer(element: HTMLElement): (segment: SubtitleSegment | null) => void {
  let pending = 0;
  return (segment) => {
    window.clearTimeout(pending);
    const text = segment?.text ?? "";
    if (!element.textContent) {
      element.textContent = text;
      element.classList.remove("is-changing");
      return;
    }
    element.classList.add("is-changing");
    pending = window.setTimeout(() => {
      element.textContent = text;
      element.classList.remove("is-changing");
    }, 140);
  };
}
