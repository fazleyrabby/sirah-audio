import type { VisualSegment } from "../types.ts";

// Durations follow SPEC 64. Motion is switched off in CSS under prefers-reduced-motion.
export function fadeDuration(transition: VisualSegment["transition"]): number {
  if (transition === "cut") return 0;
  return transition === "fade" ? 1400 : 2000;
}

// Slow camera move lasting the whole segment, kept within 20-60 seconds.
export function motionDuration(segment: VisualSegment): number {
  return Math.min(Math.max(segment.end - segment.start, 20), 60);
}
