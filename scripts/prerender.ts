// After `vite build`: writes one static HTML file per route and language with real metadata
// and readable content (SPEC 69), then fills in the service worker's precache list.
// Set SITE_URL (e.g. https://example.org) so canonical and OpenGraph URLs are absolute.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { escapeHtml, t } from "../src/i18n/strings.ts";
import type { ChapterContent, ChapterIndex, Language } from "../src/types.ts";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");
const site = (process.env.SITE_URL ?? "").replace(/\/$/, "");
const template = readFileSync(path.join(dist, "index.html"), "utf8");
const index = JSON.parse(readFileSync(path.join(root, "src/chapters/index.generated.json"), "utf8")) as ChapterIndex;
const LANGUAGES: Language[] = ["en", "bn"];
const prefix = (language: Language, route: string) => (language === "en" ? route : route === "/" ? "/bn/" : `/bn${route}`);

interface Page {
  route: string;
  title: (language: Language) => string;
  description: (language: Language) => string;
  body: (language: Language) => string;
  type?: string;
}

const brandTitle = (language: Language) => `${t("brand", language)} -- ${t("title", language)}`;
const pages: Page[] = [
  {
    route: "/",
    title: brandTitle,
    description: (language) => t("siteDescription", language),
    body: (language) => `<h1>${t("brand", language)}</h1><p>${t("title", language)}</p><p>${t("tagline", language)}</p>`,
  },
  {
    route: "/chapters",
    title: (language) => `${t("chapters", language)} -- ${t("brand", language)}`,
    description: (language) => t("siteDescription", language),
    body: (language) =>
      `<h1>${t("chapters", language)}</h1><ol>${index.chapters
        .map((chapter) => `<li><a href="${prefix(language, `/chapter/${chapter.slug}`)}">${escapeHtml(chapter.title[language])}</a></li>`)
        .join("")}</ol>`,
  },
  {
    route: "/sources",
    title: (language) => `${t("sources", language)} -- ${t("brand", language)}`,
    description: (language) => t("siteDescription", language),
    body: (language) => `<h1>${t("sources", language)}</h1>`,
  },
  {
    route: "/about",
    title: (language) => `${t("about", language)} -- ${t("brand", language)}`,
    description: (language) => t("siteDescription", language),
    body: (language) => `<h1>${t("about", language)}</h1><p>${t("disclaimer", language)}</p>`,
  },
];

for (const chapter of index.chapters) {
  pages.push({
    route: `/chapter/${chapter.slug}`,
    type: "article",
    title: (language) => `${chapter.title[language]} -- ${t("brand", language)}`,
    description: (language) => chapter.description[language] || t("siteDescription", language),
    body: (language) => {
      let transcript = `<p>${t("chapterComingSoon", language)}</p>`;
      const file = path.join(root, "public/content", chapter.id, `${language}.json`);
      if (chapter.status !== "coming-soon" && existsSync(file)) {
        const content = JSON.parse(readFileSync(file, "utf8")) as ChapterContent;
        transcript = content.scenes
          .map((scene) => {
            const text = content.subtitles.filter((segment) => segment.sceneId === scene.id).map((segment) => escapeHtml(segment.text) + (segment.refs ? ` <small>[${escapeHtml(segment.refs.join("; "))}]</small>` : "")).join(" ");
            return `<h2>${escapeHtml(scene.title)}</h2><p>${text}</p>`;
          })
          .join("");
      }
      return `<h1>${escapeHtml(chapter.title[language])}</h1><p>${escapeHtml(chapter.description[language])}</p>${transcript}`;
    },
  });
}

const shell: string[] = [];
for (const page of pages) {
  for (const language of LANGUAGES) {
    const url = prefix(language, page.route);
    const title = escapeHtml(page.title(language));
    const description = escapeHtml(page.description(language));
    const head = [
      `<link rel="canonical" href="${site}${url}" />`,
      ...LANGUAGES.map((other) => `<link rel="alternate" hreflang="${other}" href="${site}${prefix(other, page.route)}" />`),
      `<meta property="og:title" content="${title}" />`,
      `<meta property="og:description" content="${description}" />`,
      `<meta property="og:type" content="${page.type ?? "website"}" />`,
      `<meta property="og:url" content="${site}${url}" />`,
      `<meta property="og:image" content="${site}/images/og-default.png" />`,
      `<meta property="og:locale" content="${language === "en" ? "en_US" : "bn_BD"}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
    ].join("\n    ");
    const html = template
      .replace(/<html lang="[^"]*"/, `<html lang="${language}"`)
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
      .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${description}" />`)
      .replace("<!--head-->", head)
      .replace("<!--app-->", `<main class="page page--prose">${page.body(language)}</main>`);
    const file = path.join(dist, url, "index.html");
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, html);
    if (!page.route.startsWith("/chapter/")) shell.push(url);
  }
}

// Unknown URLs: hosts serve 404.html; the app then shows its own "not found" screen.
writeFileSync(path.join(dist, "404.html"), template.replace("<!--head-->", "").replace("<!--app-->", ""));

const assets = readdirSync(path.join(dist, "assets")).map((file) => `/assets/${file}`);
const precache = [...new Set([...shell, ...assets, "/manifest.webmanifest", "/icons/icon.svg", "/icons/icon-192.png", "/images/mountains/hira-night.svg"])];
const version = createHash("sha1").update(precache.join("|")).update(template).digest("hex").slice(0, 10);
const worker = readFileSync(path.join(dist, "sw.js"), "utf8")
  .replace('const VERSION = "dev";', `const VERSION = "${version}";`)
  .replace("const PRECACHE = [];", `const PRECACHE = ${JSON.stringify(precache)};`);
writeFileSync(path.join(dist, "sw.js"), worker);

console.log(`prerender: ${pages.length * LANGUAGES.length} pages, ${precache.length} precached files, version ${version}`);
