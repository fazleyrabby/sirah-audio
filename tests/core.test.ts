import { describe, expect, it } from "vitest";
import { createSpeaker, parseScript, toSegments } from "../scripts/lib/script.ts";
import { findStarted, resolveVisuals, toPosition, toTime } from "../src/chapters/timeline.ts";
import { href, parseRoute } from "../src/router/router.ts";
import type { Scene, VisualCue } from "../src/types.ts";

const scenes: Scene[] = [
  { id: "s01", title: "One", start: 0, end: 30 },
  { id: "s02", title: "Two", start: 30, end: 100 },
];

describe("timeline", () => {
  const segments = [{ start: 1 }, { start: 5 }, { start: 9 }];

  it("finds the last item that has started", () => {
    expect(findStarted(segments, 0)).toBe(-1);
    expect(findStarted(segments, 1)).toBe(0);
    expect(findStarted(segments, 8.9)).toBe(1);
    expect(findStarted(segments, 500)).toBe(2);
    expect(findStarted([], 3)).toBe(-1);
  });

  it("resolves visual cues against a language's scene timings", () => {
    const cues: VisualCue[] = [
      { sceneId: "s02", offset: 0.5, image: "c", alt: "" },
      { sceneId: "s01", image: "a", alt: "" },
      { sceneId: "s02", image: "b", alt: "" },
      { sceneId: "missing", image: "x", alt: "" },
    ];
    const resolved = resolveVisuals(cues, scenes, 100);
    expect(resolved.map((segment) => [segment.image, segment.start, segment.end])).toEqual([
      ["a", 0, 30],
      ["b", 30, 65],
      ["c", 65, 100],
    ]);
  });

  it("maps a position between two recordings by scene, not by clock time", () => {
    const position = toPosition(scenes, 42)!;
    expect(position).toEqual({ sceneId: "s02", offset: 12 });
    const bengali: Scene[] = [
      { id: "s01", title: "", start: 0, end: 44 },
      { id: "s02", title: "", start: 44, end: 130 },
    ];
    expect(toTime(bengali, position)).toBe(56);
    expect(toTime(bengali, { sceneId: "gone", offset: 3 })).toBe(0);
    expect(toTime(bengali, null)).toBe(0);
  });
});

describe("router", () => {
  it("reads language and chapter from the URL", () => {
    expect(parseRoute({ pathname: "/", search: "" })).toMatchObject({ name: "home", language: "en" });
    expect(parseRoute({ pathname: "/bn/", search: "" })).toMatchObject({ name: "home", language: "bn", path: "/" });
    const route = parseRoute({ pathname: "/bn/chapter/the-first-revelation/", search: "?t=90" });
    expect(route).toMatchObject({ name: "chapter", language: "bn", slug: "the-first-revelation" });
    expect(route.query.get("t")).toBe("90");
    expect(parseRoute({ pathname: "/nope", search: "" }).name).toBe("not-found");
  });

  it("builds language-prefixed links", () => {
    expect(href("/chapters", "en")).toBe("/chapters");
    expect(href("/chapters", "bn")).toBe("/bn/chapters");
    expect(href("/", "bn")).toBe("/bn/");
  });
});

describe("script parser", () => {
  const script = `# Title

## s01 -- First
Image: desert/a.svg | slow-zoom | Dunes
Audio: Voice only.

Muhammad ﷺ was born in Makkah.
He was of Quraysh. <!-- c1 c2 -->

A second paragraph ﷺ. <!-- n -->

## s02 -- Second
Image: desert/b.svg | static | Night | 0.5

The end. <!-- c3 -->
`;

  it("splits scenes, paragraphs, lines, claims and images", () => {
    const parsed = parseScript(script);
    expect(parsed.map((scene) => scene.id)).toEqual(["s01", "s02"]);
    expect(parsed[0].paragraphs).toEqual([
      { claims: ["c1", "c2"], lines: ["Muhammad ﷺ was born in Makkah.", "He was of Quraysh."] },
      { claims: ["n"], lines: ["A second paragraph ﷺ."] },
    ]);
    expect(parsed[1].images[0]).toEqual({ image: "desert/b.svg", effect: "static", alt: "Night", offset: 0.5 });
    const segments = toSegments(parsed);
    expect(segments.map((segment) => [segment.id, segment.sceneId, segment.para])).toEqual([
      ["seg-001", "s01", 0],
      ["seg-002", "s01", 0],
      ["seg-003", "s01", 1],
      ["seg-004", "s02", 2],
    ]);
  });

  it("speaks the salutation once and respells names", () => {
    const speak = createSpeaker({ honorific: "peace be upon him", pronunciation: { Quraysh: "Kooraysh" } });
    expect(speak("Muhammad ﷺ was born in Makkah.")).toBe("Muhammad, peace be upon him, was born in Makkah.");
    expect(speak("A second paragraph ﷺ.")).toBe("A second paragraph.");
    expect(speak("He was of Quraysh.")).toBe("He was of Kooraysh.");
  });
});
