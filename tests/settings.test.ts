import { describe, expect, it } from "vitest";
import { restore } from "../src/settings/settings.ts";

describe("stored state", () => {
  it("falls back to defaults for missing or corrupted storage", () => {
    for (const bad of [null, "x", 42, {}, { schema: 2 }]) {
      expect(restore(bad)).toMatchObject({ schema: 1, language: "en", speed: 1, chapterId: null, progress: {} });
    }
  });

  it("keeps valid fields and drops invalid ones", () => {
    const state = restore({
      schema: 1,
      language: "bn",
      speed: 9,
      volume: 0.4,
      subtitlesEnabled: false,
      chapterId: "07",
      progress: {
        "07": { sceneId: "s03", offset: 4, fraction: 0.4, completed: false, updatedAt: 1 },
        "08": { sceneId: 5 },
      },
    });
    expect(state.language).toBe("bn");
    expect(state.speed).toBe(1);
    expect(state.volume).toBe(0.4);
    expect(state.subtitlesEnabled).toBe(false);
    expect(Object.keys(state.progress)).toEqual(["07"]);
  });
});
