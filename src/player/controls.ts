import { player, volumeIsAdjustable } from "../audio/player.ts";
import { icons } from "../components/icons.ts";
import { t } from "../i18n/strings.ts";
import { settings, updateSettings } from "../settings/settings.ts";
import type { Language } from "../types.ts";

export interface ControlActions {
  previous?: () => void;
  next?: () => void;
  switchLanguage: () => void;
  openPanel: (name: string) => void;
}

// Buttons, selects and keyboard shortcuts of the listening screen (SPEC 45-48).
export function bindControls(root: HTMLElement, language: Language, actions: ControlActions): () => void {
  const playButton = root.querySelector<HTMLButtonElement>('[data-action="toggle"]')!;
  const subtitleButton = root.querySelector<HTMLButtonElement>('[data-action="subtitles"]')!;
  const muteButton = root.querySelector<HTMLButtonElement>('[data-action="mute"]')!;
  const speed = root.querySelector<HTMLSelectElement>(".speed")!;
  const volume = root.querySelector<HTMLInputElement>(".volume__bar")!;
  const subtitle = root.querySelector<HTMLElement>(".subtitle")!;

  if (!volumeIsAdjustable()) root.querySelector<HTMLElement>(".volume")!.hidden = true;

  const paintSubtitles = () => {
    subtitleButton.setAttribute("aria-pressed", String(settings.subtitlesEnabled));
    subtitle.hidden = !settings.subtitlesEnabled;
  };
  const paintVolume = () => {
    muteButton.innerHTML = settings.muted || settings.volume === 0 ? icons.muted : icons.volume;
    muteButton.setAttribute("aria-pressed", String(settings.muted));
    volume.value = String(settings.muted ? 0 : settings.volume);
    volume.style.setProperty("--fill", `${Number(volume.value) * 100}%`);
  };
  const setVolume = (value: number) => {
    const next = Math.min(Math.max(0, Math.round(value * 20) / 20), 1);
    updateSettings({ volume: next, muted: false });
    player.setVolume(next);
    player.setMuted(false);
    paintVolume();
  };
  const toggleMute = () => {
    updateSettings({ muted: !settings.muted });
    player.setMuted(settings.muted);
    paintVolume();
  };
  const toggleSubtitles = () => {
    updateSettings({ subtitlesEnabled: !settings.subtitlesEnabled });
    paintSubtitles();
  };

  player.setSpeed(settings.speed);
  player.setVolume(settings.volume);
  player.setMuted(settings.muted);
  speed.value = String(settings.speed);
  paintSubtitles();
  paintVolume();

  const paintState = () => {
    const playing = player.playing;
    playButton.innerHTML = playing ? icons.pause : icons.play;
    playButton.setAttribute("aria-label", t(playing ? "pause" : "play", language));
    playButton.classList.toggle("is-waiting", player.waiting);
    root.classList.toggle("is-paused", !playing);
  };
  const offState = player.on("state", paintState);
  paintState();

  const onClick = (event: MouseEvent) => {
    const button = (event.target as Element).closest<HTMLElement>("[data-action]");
    if (!button || button.hasAttribute("disabled")) return;
    switch (button.dataset.action) {
      case "toggle":
        player.toggle();
        break;
      case "back":
        player.seekBy(-15);
        break;
      case "forward":
        player.seekBy(15);
        break;
      case "previous":
        actions.previous?.();
        break;
      case "next":
        actions.next?.();
        break;
      case "subtitles":
        toggleSubtitles();
        break;
      case "mute":
        toggleMute();
        break;
      case "panel":
        actions.openPanel(button.dataset.panel!);
        break;
    }
  };
  root.addEventListener("click", onClick);

  speed.addEventListener("change", () => {
    updateSettings({ speed: Number(speed.value) });
    player.setSpeed(settings.speed);
  });
  volume.addEventListener("input", () => setVolume(Number(volume.value)));

  const onKey = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (document.querySelector("dialog[open]")) return;
    const target = event.target as HTMLElement;
    const tag = target.tagName;
    if (tag === "SELECT" || tag === "TEXTAREA" || (tag === "INPUT" && (target as HTMLInputElement).type !== "range")) return;
    const onRange = tag === "INPUT";
    const onButton = tag === "BUTTON" || tag === "A";
    let handled = true;
    switch (event.key) {
      case " ":
        if (onButton) return;
        player.toggle();
        break;
      case "ArrowLeft":
        if (onRange) return;
        if (event.shiftKey) actions.previous?.();
        else player.seekBy(-5);
        break;
      case "ArrowRight":
        if (onRange) return;
        if (event.shiftKey) actions.next?.();
        else player.seekBy(5);
        break;
      case "ArrowUp":
        if (onRange) return;
        setVolume(settings.volume + 0.1);
        break;
      case "ArrowDown":
        if (onRange) return;
        setVolume(settings.volume - 0.1);
        break;
      case "m":
      case "M":
        toggleMute();
        break;
      case "l":
      case "L":
        actions.switchLanguage();
        break;
      case "t":
      case "T":
        actions.openPanel("transcript");
        break;
      default:
        handled = false;
    }
    if (handled) event.preventDefault();
  };
  document.addEventListener("keydown", onKey);

  return () => {
    offState();
    root.removeEventListener("click", onClick);
    document.removeEventListener("keydown", onKey);
  };
}
