import { describe, expect, it } from "vitest";
import { findStarted, resolveVisuals, toPosition, toTime } from "../src/chapters/timeline.ts";
import type { Scene, VisualCue } from "../src/types.ts";

const english: Scene[] = [
  { id: "s01", title: "One", start: 0, end: 40 },
  { id: "s02", title: "Two", start: 40, end: 100 },
  { id: "s03", title: "Three", start: 100, end: 130 },
];
// The same story narrated at a different pace.
const bengali: Scene[] = [
  { id: "s01", title: "এক", start: 0, end: 55 },
  { id: "s02", title: "দুই", start: 55, end: 140 },
  { id: "s03", title: "তিন", start: 140, end: 170 },
];

describe("findStarted", () => {
  const segments = [{ start: 1 }, { start: 5 }, { start: 9 }];

  it("returns -1 before the first item", () => {
    expect(findStarted(segments, 0.5)).toBe(-1);
    expect(findStarted([], 3)).toBe(-1);
  });

  it("returns the last item that has started", () => {
    expect(findStarted(segments, 1)).toBe(0);
    expect(findStarted(segments, 4.99)).toBe(0);
    expect(findStarted(segments, 5)).toBe(1);
    expect(findStarted(segments, 500)).toBe(2);
  });
});

describe("resolveVisuals", () => {
  const cues: VisualCue[] = [
    { sceneId: "s01", image: "a", alt: "a" },
    { sceneId: "s02", image: "b", alt: "b" },
    { sceneId: "s02", offset: 0.5, image: "c", alt: "c" },
    { sceneId: "s03", image: "d", alt: "d" },
  ];

  it("anchors cues to scenes and covers the whole chapter", () => {
    const segments = resolveVisuals(cues, english, 130);
    expect(segments.map((segment) => [segment.image, segment.start, segment.end])).toEqual([
      ["a", 0, 40],
      ["b", 40, 70],
      ["c", 70, 100],
      ["d", 100, 130],
    ]);
  });

  it("lands on the same story moments in the other language", () => {
    const segments = resolveVisuals(cues, bengali, 170);
    expect(segments.map((segment) => segment.start)).toEqual([0, 55, 97.5, 140]);
    expect(segments.at(-1)?.end).toBe(170);
  });

  it("ignores cues for unknown scenes", () => {
    expect(resolveVisuals([{ sceneId: "s99", image: "x", alt: "x" }], english, 130)).toEqual([]);
  });
});

describe("scene positions", () => {
  it("round-trips a time within one language", () => {
    const position = toPosition(english, 62);
    expect(position).toEqual({ sceneId: "s02", offset: 22 });
    expect(toTime(english, position)).toBe(62);
  });

  it("keeps the scene when the language changes", () => {
    const position = toPosition(english, 62)!;
    expect(toTime(bengali, { ...position, offset: 0 })).toBe(55);
  });

  it("never seeks past the end of the scene", () => {
    expect(toTime(english, { sceneId: "s01", offset: 500 })).toBe(39.5);
  });

  it("starts over when the scene is unknown", () => {
    expect(toTime(english, { sceneId: "s42", offset: 3 })).toBe(0);
    expect(toTime(english, null)).toBe(0);
  });
});
