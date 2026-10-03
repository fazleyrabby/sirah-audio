import { t } from "../i18n/strings.ts";
import { href, type Route } from "../router/router.ts";
import type { Language } from "../types.ts";

export function renderHeader(route: Route): string {
  const language = route.language;
  const other: Language = language === "en" ? "bn" : "en";
  const link = (path: string, key: "chapters" | "sources" | "about") =>
    `<a href="${href(path, language)}"${route.path === path ? ' aria-current="page"' : ""}>${t(key, language)}</a>`;
  return `
    <header class="site-header">
      <a class="brand" href="${href("/", language)}">${t("brand", language)}</a>
      <nav aria-label="Main">
        ${link("/chapters", "chapters")}
        ${link("/sources", "sources")}
        ${link("/about", "about")}
        <a class="language" href="${href(route.path, other)}" lang="${other}" hreflang="${other}" data-language="${other}">${t("otherLanguage", language)}</a>
      </nav>
    </header>`;
}
