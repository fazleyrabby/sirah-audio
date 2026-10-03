import { describe, expect, it } from "vitest";
import { createSpeaker, parseScript, toSegments } from "../scripts/lib/script.ts";
import { formatTime } from "../src/i18n/strings.ts";
import { href, parseRoute } from "../src/router/router.ts";
import { restore } from "../src/settings/settings.ts";
import { SubtitleEngine } from "../src/subtitles/subtitle-engine.ts";

describe("router", () => {
  it("parses English routes at the root", () => {
    expect(parseRoute({ pathname: "/", search: "" })).toMatchObject({ name: "home", language: "en" });
    expect(parseRoute({ pathname: "/chapter/the-first-revelation/", search: "?t=90" })).toMatchObject({
      name: "chapter",
      language: "en",
      slug: "the-first-revelation",
    });
  });

  it("parses Bengali routes under /bn", () => {
    expect(parseRoute({ pathname: "/bn/", search: "" })).toMatchObject({ name: "home", language: "bn", path: "/" });
    expect(parseRoute({ pathname: "/bn/chapters", search: "" })).toMatchObject({ name: "chapters", language: "bn" });
  });

  it("reports unknown routes", () => {
    expect(parseRoute({ pathname: "/nothing", search: "" }).name).toBe("not-found");
    expect(parseRoute({ pathname: "/chapter/Bad_Slug", search: "" }).name).toBe("not-found");
  });

  it("builds language-prefixed links", () => {
    expect(href("/chapters", "en")).toBe("/chapters");
    expect(href("/chapters", "bn")).toBe("/bn/chapters");
    expect(href("/", "bn")).toBe("/bn/");
  });
});

describe("stored state", () => {
  it("falls back to defaults for missing or corrupted storage", () => {
    for (const stored of [null, "nonsense", { schema: 99 }, []]) {
      expect(restore(stored)).toMatchObject({ schema: 1, language: "en", speed: 1, subtitlesEnabled: true, progress: {} });
    }
  });

  it("keeps valid fields and drops invalid ones", () => {
    const state = restore({
      schema: 1,
      language: "bn",
      speed: 9,
      volume: 0.4,
      progress: { "07": { sceneId: "s03", offset: 12, fraction: 0.4, completed: false, updatedAt: 1 }, "08": { offset: "x" } },
    });
    expect(state.language).toBe("bn");
    expect(state.speed).toBe(1);
    expect(state.volume).toBe(0.4);
    expect(Object.keys(state.progress)).toEqual(["07"]);
  });
});

describe("subtitle engine", () => {
  it("reports only changes, and keeps a line through the pause after it", () => {
    const seen: (string | null)[] = [];
    const engine = new SubtitleEngine(
      [
        { id: "a", sceneId: "s01", start: 1, end: 3, text: "first" },
        { id: "b", sceneId: "s01", start: 4, end: 6, text: "second" },
      ],
      (segment) => seen.push(segment?.text ?? null),
    );
    for (const time of [0, 0.5, 1.2, 2, 3.5, 4, 5, 0.2]) engine.update(time);
    expect(seen).toEqual([null, "first", "second", null]);
  });
});

describe("narration script", () => {
  const script = `# Title

## s01 -- First
Image: desert/a.svg | slow-zoom | A desert. No figures.
Audio: Voice only.

Muhammad ﷺ went to Hira.
He stayed there. <!-- c01 c02 -->

A line with no claim.

## s02 -- Second
Image: desert/b.svg | static | Night. | 0.5

The Messenger of Allah ﷺ returned. <!-- n -->
`;
  const scenes = parseScript(script);

  it("reads scenes, images, paragraphs and claim ids", () => {
    expect(scenes.map((scene) => scene.id)).toEqual(["s01", "s02"]);
    expect(scenes[0].images[0]).toEqual({ image: "desert/a.svg", effect: "slow-zoom", alt: "A desert. No figures.", offset: 0 });
    expect(scenes[1].images[0].offset).toBe(0.5);
    expect(scenes[0].paragraphs.map((paragraph) => paragraph.claims)).toEqual([["c01", "c02"], []]);
    expect(scenes[0].paragraphs[0].lines).toEqual(["Muhammad ﷺ went to Hira.", "He stayed there."]);
  });

  it("numbers one segment per line", () => {
    expect(toSegments(scenes).map((segment) => [segment.id, segment.sceneId, segment.para])).toEqual([
      ["seg-001", "s01", 0],
      ["seg-002", "s01", 0],
      ["seg-003", "s01", 1],
      ["seg-004", "s02", 2],
    ]);
  });

  it("speaks the salutation once and respells names", () => {
    const speak = createSpeaker({ honorific: "peace be upon him", pronunciation: { Hira: "Heera" } });
    expect(speak("Muhammad ﷺ went to Hira.")).toBe("Muhammad, peace be upon him, went to Heera.");
    expect(speak("The Messenger of Allah ﷺ returned.")).toBe("The Messenger of Allah returned.");
    expect(speak("Hiram is not Hira")).toBe("Hiram is not Heera");
  });
});

describe("formatTime", () => {
  it("formats minutes and seconds", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(522.9)).toBe("8:42");
    expect(formatTime(Number.NaN)).toBe("0:00");
  });
});
