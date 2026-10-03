import { findStarted } from "../chapters/timeline.ts";
import type { SubtitleSegment } from "../types.ts";

// Tracks the active subtitle and reports only when it changes.
export class SubtitleEngine {
  private index = -2;
  private readonly segments: readonly SubtitleSegment[];
  private readonly onChange: (segment: SubtitleSegment | null, index: number) => void;

  constructor(segments: readonly SubtitleSegment[], onChange: (segment: SubtitleSegment | null, index: number) => void) {
    this.segments = segments;
    this.onChange = onChange;
  }

  update(time: number): void {
    const index = findStarted(this.segments, time);
    if (index === this.index) return;
    this.index = index;
    this.onChange(index >= 0 ? this.segments[index] : null, index);
  }
}
