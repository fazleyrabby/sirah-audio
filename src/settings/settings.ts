import { readStored, writeStored } from "../storage/local-storage.ts";
import type { ChapterProgress, PlaybackState } from "../types.ts";

export const SPEEDS = [0.75, 1, 1.1, 1.25, 1.5, 1.75, 2];

const defaults = (): PlaybackState => ({
  schema: 1,
  language: "en",
  chapterId: null,
  speed: 1,
  volume: 1,
  muted: false,
  subtitlesEnabled: true,
  progress: {},
});

// Anything unexpected in storage falls back to defaults, field by field.
export function restore(stored: unknown): PlaybackState {
  const state = defaults();
  if (!stored || typeof stored !== "object" || (stored as PlaybackState).schema !== 1) return state;
  const saved = stored as Partial<PlaybackState>;
  if (saved.language === "en" || saved.language === "bn") state.language = saved.language;
  if (typeof saved.chapterId === "string") state.chapterId = saved.chapterId;
  if (typeof saved.speed === "number" && SPEEDS.includes(saved.speed)) state.speed = saved.speed;
  if (typeof saved.volume === "number" && saved.volume >= 0 && saved.volume <= 1) state.volume = saved.volume;
  if (typeof saved.muted === "boolean") state.muted = saved.muted;
  if (typeof saved.subtitlesEnabled === "boolean") state.subtitlesEnabled = saved.subtitlesEnabled;
  if (saved.progress && typeof saved.progress === "object") {
    for (const [chapterId, progress] of Object.entries(saved.progress)) {
      if (progress && typeof progress.sceneId === "string" && typeof progress.offset === "number") {
        state.progress[chapterId] = {
          sceneId: progress.sceneId,
          offset: progress.offset,
          fraction: typeof progress.fraction === "number" ? progress.fraction : 0,
          completed: Boolean(progress.completed),
          updatedAt: typeof progress.updatedAt === "number" ? progress.updatedAt : 0,
        };
      }
    }
  }
  return state;
}

export const settings: PlaybackState = restore(readStored());

export function updateSettings(patch: Partial<PlaybackState>): void {
  Object.assign(settings, patch);
  writeStored(settings);
}

export function saveProgress(chapterId: string, progress: Omit<ChapterProgress, "updatedAt">): void {
  settings.progress[chapterId] = { ...progress, updatedAt: Date.now() };
  settings.chapterId = chapterId;
  writeStored(settings);
}
