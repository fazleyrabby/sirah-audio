import { chapters, isPlayable, isReadable, parts } from "../chapters/chapters.ts";
import { escapeHtml, formatMinutes, t } from "../i18n/strings.ts";
import { href } from "../router/router.ts";
import { settings } from "../settings/settings.ts";
import type { Language } from "../types.ts";
import { icons } from "./icons.ts";

// Chapters grouped by part, with duration, completion and the current chapter marked (SPEC 41).
export function renderChapterList(language: Language, currentId: string | null): string {
  return parts
    .map((part) => {
      const rows = chapters
        .filter((chapter) => chapter.part === part.id)
        .map((chapter) => {
          const title = escapeHtml(chapter.title[language]);
          const number = `<span class="row__number">${chapter.id}</span>`;
          if (!isPlayable(chapter, language) && isReadable(chapter, language)) {
            return `<li><a class="row" href="${href(`/chapter/${chapter.slug}`, language)}">${number}<span class="row__title">${title}</span><span class="row__meta">${t("readOnly", language)}</span></a></li>`;
          }
          if (!isPlayable(chapter, language)) {
            return `<li><div class="row is-soon">${number}<span class="row__title">${title}</span><span class="row__meta">${t("comingSoon", language)}</span></div></li>`;
          }
          const progress = settings.progress[chapter.id];
          const current = chapter.id === currentId;
          let status = "";
          if (progress?.completed) {
            status = `<span class="row__status" title="${t("completed", language)}">${icons.check}<span class="visually-hidden">${t("completed", language)}</span></span>`;
          } else if (progress && progress.fraction > 0.01) {
            status = `<span class="row__status">${Math.round(progress.fraction * 100)}%</span>`;
          }
          return `<li><a class="row${current ? " is-current" : ""}" href="${href(`/chapter/${chapter.slug}`, language)}"${current ? ' aria-current="true"' : ""}>
            ${number}<span class="row__title">${title}</span>
            <span class="row__meta">${status}${formatMinutes(chapter.duration[language] ?? 0, language)}</span></a></li>`;
        })
        .join("");
      return `<section class="part"><h2 class="part__title">${escapeHtml(part.title[language])}</h2><ol class="rows">${rows}</ol></section>`;
    })
    .join("");
}
