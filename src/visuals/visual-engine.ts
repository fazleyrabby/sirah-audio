import { findStarted } from "../chapters/timeline.ts";
import type { VisualSegment } from "../types.ts";
import { fadeDuration, motionDuration } from "./transitions.ts";

// Shows the visual for the current audio time on two stacked layers that cross-fade.
// Touches the DOM only when the active segment changes.
export class VisualEngine {
  private index = -2;
  private front = 0;
  private request = 0;
  private readonly layers: HTMLImageElement[];
  private readonly segments: readonly VisualSegment[];

  constructor(stage: HTMLElement, segments: readonly VisualSegment[]) {
    this.segments = segments;
    this.layers = [...stage.querySelectorAll<HTMLImageElement>(".stage__layer")];
  }

  update(time: number): void {
    const index = Math.max(findStarted(this.segments, time), 0);
    if (index === this.index || this.segments.length === 0) return;
    this.index = index;
    this.show(this.segments[index]);
    const upcoming = this.segments[index + 1];
    if (upcoming) new Image().src = upcoming.image;
  }

  private show(segment: VisualSegment): void {
    const request = ++this.request;
    const loader = new Image();
    loader.onload = () => {
      // A newer segment may have been requested while this one loaded.
      if (request !== this.request) return;
      const next = this.layers[1 - this.front];
      const previous = this.layers[this.front];
      next.className = "stage__layer";
      next.src = segment.image;
      next.alt = segment.alt;
      next.style.objectPosition = segment.position ?? "center";
      next.style.setProperty("--fade", `${fadeDuration(segment.transition)}ms`);
      next.style.setProperty("--motion", `${motionDuration(segment)}s`);
      // Reflow so the motion animation restarts for the new image.
      void next.offsetWidth;
      next.classList.add("is-active", `fx-${segment.effect ?? "static"}`);
      previous.style.setProperty("--fade", `${fadeDuration(segment.transition)}ms`);
      previous.classList.remove("is-active");
      this.front = 1 - this.front;
    };
    // On failure the previous visual simply stays (SPEC 75).
    loader.src = segment.image;
  }
}
