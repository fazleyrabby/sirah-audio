import "@fontsource/cormorant-garamond/latin-500.css";
import "@fontsource/cormorant-garamond/latin-600.css";
import "@fontsource/hind-siliguri/latin-400.css";
import "@fontsource/hind-siliguri/latin-500.css";
import "@fontsource/hind-siliguri/bengali-400.css";
import "@fontsource/hind-siliguri/bengali-500.css";
import "@fontsource/noto-serif-bengali/bengali-500.css";
import "@fontsource/amiri/arabic-400.css";
import "./styles/reset.css";
import "./styles/variables.css";
import "./styles/layout.css";
import "./styles/player.css";
import "./styles/responsive.css";

import { chapterBySlug } from "./chapters/chapters.ts";
import { renderHeader } from "./components/header.ts";
import { t } from "./i18n/strings.ts";
import { mountPlayer } from "./player/player-ui.ts";
import { startRouter, type Route } from "./router/router.ts";
import { settings, updateSettings } from "./settings/settings.ts";
import { cachedVisits, trackVisit } from "./visits/visitor-counter.ts";
import { renderAbout, renderChapters, renderHome, renderNotFound, renderSourcesPage } from "./views/pages.ts";

const app = document.querySelector<HTMLElement>("#app")!;
let unmount: () => void = () => {};

function render(route: Route): void {
  unmount();
  unmount = () => {};
  const language = route.language;
  if (settings.language !== language) updateSettings({ language });
  document.documentElement.lang = language;

  // The listening screen stays free of everything but the chapter; other pages carry the footer.
  const footer =
    route.name === "chapter"
      ? ""
      : `<footer class="site-footer"><span>${t("brand", language)}</span><span class="visits">${t("visits", language)} <span class="visits__count" aria-live="polite">${cachedVisits().toLocaleString("en")}</span></span></footer>`;
  app.innerHTML = `${renderHeader(route)}<div id="view"></div>${footer}`;
  void trackVisit().then((total) => {
    const count = app.querySelector(".visits__count");
    if (count && total !== null) count.textContent = total.toLocaleString("en");
  });
  const view = app.querySelector<HTMLElement>("#view")!;
  app.dataset.route = route.name;
  let title = "";
  const chapter = route.name === "chapter" ? chapterBySlug(route.slug!) : undefined;

  switch (route.name) {
    case "home":
      view.innerHTML = renderHome(language);
      break;
    case "chapters":
      view.innerHTML = renderChapters(language);
      title = t("chapters", language);
      break;
    case "sources":
      view.innerHTML = renderSourcesPage(language);
      title = t("sources", language);
      break;
    case "about":
      view.innerHTML = renderAbout(language);
      title = t("about", language);
      break;
    case "chapter":
      if (chapter) {
        title = chapter.title[language];
        unmount = mountPlayer(view, chapter, route);
      }
      break;
  }
  if (route.name === "not-found" || (route.name === "chapter" && !chapter)) {
    view.innerHTML = renderNotFound(language);
    title = t("notFound", language);
    app.dataset.route = "not-found";
  }

  document.title = title ? `${title} -- ${t("brand", language)}` : `${t("brand", language)} -- ${t("title", language)}`;
  window.scrollTo(0, 0);
}

startRouter(render);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => void navigator.serviceWorker.register("/sw.js"));
}
