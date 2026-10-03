import type { Language } from "../types.ts";

export type RouteName = "home" | "chapters" | "chapter" | "sources" | "about" | "not-found";

export interface Route {
  name: RouteName;
  language: Language;
  // Path without the language prefix, e.g. "/chapter/the-first-revelation".
  path: string;
  slug?: string;
  query: URLSearchParams;
}

export function parseRoute(url: { pathname: string; search: string }): Route {
  let path = url.pathname.replace(/\/index\.html$/, "").replace(/\/+$/, "") || "/";
  let language: Language = "en";
  if (path === "/bn" || path.startsWith("/bn/")) {
    language = "bn";
    path = path.slice(3) || "/";
  }
  const query = new URLSearchParams(url.search);
  const chapter = /^\/chapter\/([a-z0-9-]+)$/.exec(path);
  if (chapter) return { name: "chapter", language, path, slug: chapter[1], query };
  const names: Record<string, RouteName> = { "/": "home", "/chapters": "chapters", "/sources": "sources", "/about": "about" };
  return { name: names[path] ?? "not-found", language, path, query };
}

// English lives at the root, Bengali under /bn (SPEC 70).
export function href(path: string, language: Language): string {
  if (language === "en") return path;
  return path === "/" ? "/bn/" : `/bn${path}`;
}

type Listener = (route: Route) => void;
let listener: Listener = () => {};

export function currentRoute(): Route {
  return parseRoute(window.location);
}

export function navigate(to: string, replace = false): void {
  if (replace) history.replaceState(null, "", to);
  else history.pushState(null, "", to);
  listener(currentRoute());
}

export function startRouter(onRoute: Listener): void {
  listener = onRoute;
  window.addEventListener("popstate", () => listener(currentRoute()));
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = (event.target as Element).closest?.("a");
    if (!anchor || anchor.target || anchor.hasAttribute("download")) return;
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    event.preventDefault();
    navigate(url.pathname + url.search);
  });
  listener(currentRoute());
}
