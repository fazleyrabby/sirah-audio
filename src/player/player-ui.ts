import { bindMediaSession } from "../audio/media-session.ts";
import { player } from "../audio/player.ts";
import { loadChapter } from "../chapters/chapter-loader.ts";
import { isPlayable, neighbour, parts } from "../chapters/chapters.ts";
import { resolveVisuals, toPosition, toTime } from "../chapters/timeline.ts";
import { renderChapterList } from "../components/chapter-list.ts";
import { icons } from "../components/icons.ts";
import { renderSources } from "../components/source-panel.ts";
import { markTranscriptLine, renderTranscript } from "../components/transcript.ts";
import { escapeHtml, t } from "../i18n/strings.ts";
import { href, navigate, type Route } from "../router/router.ts";
import { saveProgress, settings, SPEEDS } from "../settings/settings.ts";
import { SubtitleEngine } from "../subtitles/subtitle-engine.ts";
import { createSubtitleRenderer } from "../subtitles/subtitle-renderer.ts";
import type { ChapterContent, ChapterMeta, Language } from "../types.ts";
import { VisualEngine } from "../visuals/visual-engine.ts";
import { bindControls } from "./controls.ts";
import { bindProgress } from "./progress.ts";

const SAVE_INTERVAL = 5000;
const COMPLETE_WITHIN = 15;
const UP_NEXT_SECONDS = 8;

// Set when moving between chapters or languages so playback carries on.
let autoplay = false;

function panel(name: string, title: string, language: Language): string {
  return `<dialog class="panel" data-panel="${name}" aria-labelledby="panel-${name}">
    <header class="panel__header"><h2 id="panel-${name}">${title}</h2>
      <button type="button" class="icon-button" data-close aria-label="${t("close", language)}">${icons.close}</button></header>
    <div class="panel__body"></div>
  </dialog>`;
}

function message(chapter: ChapterMeta, language: Language, body: string): string {
  return `<section class="listen listen--message"><div class="message">
    <p class="eyebrow">${t("chapter", language)} ${chapter.id}</p>
    <h1 lang="${language}">${escapeHtml(chapter.title[language])}</h1>${body}</div></section>`;
}

export function mountPlayer(root: HTMLElement, chapter: ChapterMeta, route: Route): () => void {
  const language = route.language;
  const other: Language = language === "en" ? "bn" : "en";
  const chaptersLink = `<a class="button button--quiet" href="${href("/chapters", language)}">${t("toChapters", language)}</a>`;

  if (!isPlayable(chapter, language)) {
    const body = isPlayable(chapter, other)
      ? `<p>${t("notInLanguage", language)}</p><a class="button" href="${href(route.path, other)}" lang="${other}">${t("listenInOther", language)}</a>${chaptersLink}`
      : `<p>${t("chapterComingSoon", language)}</p>${chaptersLink}`;
    root.innerHTML = message(chapter, language, body);
    return () => {};
  }

  const previous = neighbour(chapter, language, -1);
  const next = neighbour(chapter, language, 1);
  const part = parts.find((candidate) => candidate.id === chapter.part)!;
  const speedOptions = SPEEDS.map((speed) => `<option value="${speed}">${speed}×</option>`).join("");

  root.innerHTML = `
    <section class="listen is-paused" aria-label="${escapeHtml(chapter.title[language])}">
      <div class="stage">
        <img class="stage__layer" alt="" /><img class="stage__layer" alt="" />
        <div class="stage__scrim"></div>
      </div>
      <div class="listen__body">
        <p class="eyebrow">${t("chapter", language)} ${chapter.id} · ${escapeHtml(part.title[language])}</p>
        <h1 class="listen__title">${escapeHtml(chapter.title[language])}</h1>
        <p class="notice" data-notice hidden></p>
        <p class="subtitle" lang="${language}"></p>
        <div class="status" role="status" hidden></div>
        <div class="upnext" hidden></div>
        <div class="progress">
          <input class="progress__bar" type="range" min="0" max="1" step="0.1" value="0" aria-label="${t("position", language)}" />
          <div class="progress__times"><span class="progress__elapsed">0:00</span><span class="progress__total">0:00</span></div>
        </div>
        <div class="transport">
          <button type="button" class="icon-button" data-action="previous" aria-label="${t("previous", language)}"${previous ? "" : " disabled"}>${icons.previous}</button>
          <button type="button" class="icon-button icon-button--large" data-action="back" aria-label="${t("back15", language)}">${icons.back}</button>
          <button type="button" class="play" data-action="toggle" aria-label="${t("play", language)}">${icons.play}</button>
          <button type="button" class="icon-button icon-button--large" data-action="forward" aria-label="${t("forward15", language)}">${icons.forward}</button>
          <button type="button" class="icon-button" data-action="next" aria-label="${t("next", language)}"${next ? "" : " disabled"}>${icons.next}</button>
        </div>
        <div class="tools">
          <label class="tool"><span class="visually-hidden">${t("speed", language)}</span><select class="speed">${speedOptions}</select></label>
          <button type="button" class="icon-button" data-action="subtitles" aria-pressed="true" aria-label="${t("subtitles", language)}">${icons.subtitles}</button>
          <button type="button" class="icon-button" data-action="panel" data-panel="transcript" aria-label="${t("transcript", language)}">${icons.transcript}</button>
          <button type="button" class="icon-button" data-action="panel" data-panel="sources" aria-label="${t("sources", language)}">${icons.sources}</button>
          <button type="button" class="icon-button" data-action="panel" data-panel="chapters" aria-label="${t("chapters", language)}">${icons.list}</button>
          <div class="volume">
            <button type="button" class="icon-button" data-action="mute" aria-label="${t("mute", language)}">${icons.volume}</button>
            <input class="volume__bar" type="range" min="0" max="1" step="0.05" aria-label="${t("volume", language)}" />
          </div>
          <a class="tool tool--language" href="${href(route.path, other)}" lang="${other}" data-language>${t("otherLanguage", language)}</a>
        </div>
      </div>
      ${panel("transcript", t("transcript", language), language)}
      ${panel("sources", t("sources", language), language)}
      ${panel("chapters", t("chapters", language), language)}
    </section>`;

  const screen = root.querySelector<HTMLElement>(".listen")!;
  const status = screen.querySelector<HTMLElement>(".status")!;
  const upNext = screen.querySelector<HTMLElement>(".upnext")!;
  const panels = new Map([...screen.querySelectorAll<HTMLDialogElement>("dialog.panel")].map((dialog) => [dialog.dataset.panel!, dialog]));
  const transcriptPanel = panels.get("transcript")!;
  const cleanups: (() => void)[] = [];
  let content: ChapterContent | null = null;
  let alive = true;
  let activeLine = -1;
  let countdown = 0;

  const showStatus = (text: string, retry?: () => void) => {
    status.hidden = !text;
    status.innerHTML = text ? `<p>${text}</p>` : "";
    if (retry) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "button button--quiet";
      button.textContent = t("retry", language);
      button.addEventListener("click", retry);
      status.append(button);
    }
  };

  const persist = () => {
    if (!content || player.duration === 0) return;
    const position = toPosition(content.scenes, player.time);
    if (!position) return;
    const done = player.element.ended || player.duration - player.time <= COMPLETE_WITHIN;
    saveProgress(chapter.id, {
      ...position,
      fraction: Math.min(player.time / player.duration, 1),
      completed: done || Boolean(settings.progress[chapter.id]?.completed),
    });
  };

  const go = (target: ChapterMeta | undefined) => {
    if (!target) return;
    autoplay = player.playing || player.element.ended;
    navigate(href(`/chapter/${target.slug}`, language));
  };

  // Keep the story position across languages: same scene, from its start (SPEC 44).
  const switchLanguage = () => {
    if (content) {
      const position = toPosition(content.scenes, player.time);
      if (position) saveProgress(chapter.id, { ...position, offset: 0, fraction: player.time / (player.duration || 1), completed: false });
    }
    autoplay = player.playing;
    alive = false; // the position was just saved deliberately; do not overwrite it on unmount
    navigate(href(route.path, other));
  };
  screen.querySelector("[data-language]")!.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    switchLanguage();
  });

  const openPanel = (name: string) => {
    const dialog = panels.get(name);
    if (!dialog || dialog.open) return;
    if (name === "chapters") dialog.querySelector(".panel__body")!.innerHTML = renderChapterList(language, chapter.id);
    dialog.showModal();
    if (name === "transcript") markTranscriptLine(transcriptPanel, activeLine, true);
  };
  for (const dialog of panels.values()) {
    dialog.addEventListener("click", (event) => {
      const target = event.target as Element;
      // A click on the backdrop lands on the dialog element itself.
      if (target === dialog || target.closest("[data-close]")) dialog.close();
      const line = target.closest<HTMLElement>("[data-seek]");
      if (line) {
        player.seekTo(Number(line.dataset.seek));
        void player.play();
      }
    });
  }

  cleanups.push(bindControls(screen, language, { previous: previous && (() => go(previous)), next: next && (() => go(next)), switchLanguage, openPanel }));
  cleanups.push(bindMediaSession({
    title: chapter.title[language],
    album: part.title[language],
    onPrevious: previous && (() => go(previous)),
    onNext: next && (() => go(next)),
  }));

  const start = async () => {
    showStatus(t("loading", language));
    try {
      content = await loadChapter(chapter, language);
    } catch {
      if (alive) showStatus(navigator.onLine ? `${t("loadError", language)} ${t("tryAgain", language)}` : t("offline", language), () => void start());
      return;
    }
    if (!alive) return;
    showStatus("");

    const duration = chapter.duration[language] ?? content.scenes[content.scenes.length - 1].end;
    const loaded = content;
    const notice = screen.querySelector<HTMLElement>("[data-notice]")!;
    notice.hidden = loaded.verified;
    notice.textContent = t("previewNotice", language);
    transcriptPanel.querySelector(".panel__body")!.innerHTML = renderTranscript(loaded);
    panels.get("sources")!.querySelector(".panel__body")!.innerHTML =
      renderSources(loaded, language) + `<p class="disclaimer">${t("disclaimer", language)}</p>`;

    const visuals = new VisualEngine(screen.querySelector<HTMLElement>(".stage")!, resolveVisuals(loaded.visuals, loaded.scenes, duration));
    const renderSubtitle = createSubtitleRenderer(screen.querySelector<HTMLElement>(".subtitle")!);
    const subtitles = new SubtitleEngine(loaded.subtitles, (segment, index) => {
      renderSubtitle(segment);
      activeLine = index;
      markTranscriptLine(transcriptPanel, index, transcriptPanel.open);
    });
    const paintProgress = bindProgress(screen, duration);

    // Where to begin: an explicit ?t=, else saved progress, else the start.
    const saved = settings.progress[chapter.id];
    const requested = Number(route.query.get("t"));
    let startAt = 0;
    if (requested > 0 && requested < duration) startAt = requested;
    else if (saved && !(saved.completed && saved.fraction > 0.97)) startAt = toTime(loaded.scenes, saved);

    const update = () => {
      const time = player.time;
      subtitles.update(time);
      visuals.update(time);
      paintProgress(time);
    };
    subtitles.update(startAt);
    visuals.update(startAt);
    paintProgress(startAt);

    cleanups.push(player.on("time", update));
    cleanups.push(player.on("state", () => {
      if (player.waiting && !navigator.onLine) showStatus(t("reconnecting", language));
      else if (!status.querySelector("button")) showStatus("");
    }));
    cleanups.push(player.on("error", () => {
      const resumeAt = player.time;
      showStatus(navigator.onLine ? `${t("loadError", language)} ${t("tryAgain", language)}` : t("offline", language), () => {
        showStatus("");
        player.load(chapter.audio[language]!, resumeAt);
        void player.play();
      });
    }));
    cleanups.push(player.on("ended", () => {
      persist();
      if (!next) return;
      let remaining = UP_NEXT_SECONDS;
      const paint = () => {
        upNext.hidden = false;
        upNext.innerHTML = `<p><span class="eyebrow">${t("upNext", language)} · ${remaining}</span>${escapeHtml(next.title[language])}</p>
          <button type="button" class="button" data-upnext="play">${t("playNow", language)}</button>
          <button type="button" class="button button--quiet" data-upnext="cancel">${t("cancel", language)}</button>`;
      };
      paint();
      countdown = window.setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) go(next);
        else paint();
      }, 1000);
    }));
    upNext.addEventListener("click", (event) => {
      const choice = (event.target as Element).closest<HTMLElement>("[data-upnext]")?.dataset.upnext;
      if (!choice) return;
      window.clearInterval(countdown);
      upNext.hidden = true;
      if (choice === "play") go(next);
    });

    const timer = window.setInterval(() => {
      if (player.playing) persist();
    }, SAVE_INTERVAL);
    const onPause = () => persist();
    const onHide = () => {
      if (document.visibilityState === "hidden") persist();
    };
    player.element.addEventListener("pause", onPause);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", persist);
    cleanups.push(() => {
      window.clearInterval(timer);
      player.element.removeEventListener("pause", onPause);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", persist);
    });

    player.load(chapter.audio[language]!, startAt);
    if (autoplay) void player.play();
    autoplay = false;
  };
  void start();

  return () => {
    if (alive) persist();
    alive = false;
    window.clearInterval(countdown);
    for (const cleanup of cleanups) cleanup();
    for (const dialog of panels.values()) if (dialog.open) dialog.close();
    player.unload();
  };
}
