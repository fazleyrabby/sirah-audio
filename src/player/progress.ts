import { player } from "../audio/player.ts";
import { formatTime } from "../i18n/strings.ts";

// Seek bar and time labels. While the listener is dragging, the bar is theirs.
export function bindProgress(root: HTMLElement, duration: number): (time: number) => void {
  const bar = root.querySelector<HTMLInputElement>(".progress__bar")!;
  const elapsed = root.querySelector<HTMLElement>(".progress__elapsed")!;
  const total = root.querySelector<HTMLElement>(".progress__total")!;
  let dragging = false;
  let shownSecond = -1;

  bar.max = String(duration);
  total.textContent = formatTime(duration);

  const paint = (time: number) => {
    bar.style.setProperty("--fill", `${duration > 0 ? (time / duration) * 100 : 0}%`);
    const second = Math.floor(time);
    if (second === shownSecond) return;
    shownSecond = second;
    elapsed.textContent = formatTime(time);
    bar.setAttribute("aria-valuetext", `${formatTime(time)} / ${formatTime(duration)}`);
  };

  bar.addEventListener("input", () => {
    dragging = true;
    paint(Number(bar.value));
  });
  bar.addEventListener("change", () => {
    dragging = false;
    player.seekTo(Number(bar.value));
  });

  return (time) => {
    if (dragging) return;
    bar.value = String(time);
    paint(time);
  };
}
