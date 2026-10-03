import { escapeHtml, sourceTitle, t } from "../i18n/strings.ts";
import type { ChapterContent, Language } from "../types.ts";

const ORDER = ["quran", "hadith", "seerah", "historical"];

// Exact references for the chapter, grouped Qur'an first (SPEC 43).
export function renderSources(content: ChapterContent, language: Language): string {
  const notice = content.verified ? "" : `<p class="notice">${t("previewNotice", language)}</p>`;
  const items = [...content.sources]
    .sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type))
    .map((source) => {
      const details = [
        source.author,
        source.type === "seerah" ? t("seerahReport", language) : "",
        source.gradedBy && source.grade ? `${source.grade} (${source.gradedBy})` : "",
      ].filter(Boolean);
      const note = source.note?.[language];
      return `<li class="source">
        <span class="source__title">${escapeHtml(sourceTitle(source.title, language))}</span>
        <span class="source__reference">${escapeHtml(source.reference)}</span>
        ${details.length ? `<span class="source__detail">${escapeHtml(details.join(" · "))}</span>` : ""}
        ${note ? `<span class="source__detail">${escapeHtml(note)}</span>` : ""}
      </li>`;
    })
    .join("");
  return `${notice}<ul class="source-list">${items}</ul>`;
}
