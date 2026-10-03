// Pure timeline calculations. The audio clock is the only source of time (SPEC 33).
import type { Scene, VisualCue, VisualSegment } from "../types.ts";

// Index of the last item that has started at `time`, or -1 before the first one.
// An item stays active through the pause that follows it, so nothing flickers between lines.
export function findStarted(items: readonly { start: number }[], time: number): number {
  let low = 0;
  let high = items.length - 1;
  let found = -1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (items[middle].start <= time) {
      found = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return found;
}

// Cues are anchored to scenes; resolve them against one language's scene timings.
export function resolveVisuals(cues: readonly VisualCue[], scenes: readonly Scene[], duration: number): VisualSegment[] {
  const sceneById = new Map(scenes.map((scene) => [scene.id, scene]));
  const starts = cues
    .filter((cue) => sceneById.has(cue.sceneId))
    .map((cue) => {
      const scene = sceneById.get(cue.sceneId)!;
      const offset = Math.min(Math.max(cue.offset ?? 0, 0), 1);
      return { cue, start: scene.start + (scene.end - scene.start) * offset };
    })
    .sort((a, b) => a.start - b.start);
  return starts.map(({ cue, start }, index) => ({
    ...cue,
    start: index === 0 ? 0 : start,
    end: index + 1 < starts.length ? starts[index + 1].start : duration,
  }));
}

export interface ScenePosition {
  sceneId: string;
  offset: number;
}

export function toPosition(scenes: readonly Scene[], time: number): ScenePosition | null {
  const index = findStarted(scenes, time);
  if (index < 0) return scenes.length ? { sceneId: scenes[0].id, offset: 0 } : null;
  return { sceneId: scenes[index].id, offset: Math.max(0, time - scenes[index].start) };
}

// Unknown scene (for example after a language switch to a script that lacks it): start over.
export function toTime(scenes: readonly Scene[], position: ScenePosition | null | undefined): number {
  if (!position) return 0;
  const scene = scenes.find((candidate) => candidate.id === position.sceneId);
  if (!scene) return 0;
  return Math.min(scene.start + Math.max(0, position.offset), Math.max(scene.start, scene.end - 0.5));
}
