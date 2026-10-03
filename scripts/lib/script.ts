// Parser for chapter narration scripts (content/chapters/*/script-<lang>.md).
// One narration line = one subtitle segment. Blank line = new paragraph.

export interface ScriptImage {
  image: string;
  effect?: string;
  alt: string;
  offset: number;
  position?: string;
}

export interface ScriptParagraph {
  claims: string[];
  lines: string[];
}

export interface ScriptScene {
  id: string;
  title: string;
  images: ScriptImage[];
  paragraphs: ScriptParagraph[];
}

export interface ScriptSegment {
  id: string;
  sceneId: string;
  para: number;
  text: string;
}

export interface NarrationConfig {
  honorific?: string;
  pronunciation?: Record<string, string>;
}

const SCENE_HEADING = /^##\s+(s\d+)\s+--\s+(.+)$/;
const DIRECTION = /^(Audio|Source|Visual):/i;
const IMAGE = /^Image:\s*(.+)$/i;
const COMMENT = /<!--([\s\S]*?)-->/g;

export function parseScript(markdown: string): ScriptScene[] {
  // Block comments may span lines; drop those that are not claim markers on a narration line.
  const lines = markdown.replace(/^<!--[\s\S]*?-->\s*$/gm, "").split(/\r?\n/);
  const scenes: ScriptScene[] = [];
  let scene: ScriptScene | null = null;
  let inParagraph = false;

  for (const raw of lines) {
    const line = raw.trim();
    const heading = SCENE_HEADING.exec(line);
    if (heading) {
      scene = { id: heading[1], title: heading[2].trim(), images: [], paragraphs: [] };
      scenes.push(scene);
      inParagraph = false;
      continue;
    }
    if (!scene) continue;
    if (!line) {
      inParagraph = false;
      continue;
    }
    if (DIRECTION.test(line)) continue;
    const image = IMAGE.exec(line);
    if (image) {
      const [path, effect, alt, offset, position] = image[1].split("|").map((part) => part.trim());
      scene.images.push({
        image: path,
        effect: effect || undefined,
        alt: alt ?? "",
        offset: offset ? Number(offset) : 0,
        ...(position ? { position } : {}),
      });
      continue;
    }

    const claims = [...line.matchAll(COMMENT)].flatMap((m) => m[1].trim().split(/\s+/)).filter(Boolean);
    const text = line.replace(COMMENT, "").trim();
    if (!inParagraph) {
      scene.paragraphs.push({ claims: [], lines: [] });
      inParagraph = true;
    }
    const paragraph = scene.paragraphs[scene.paragraphs.length - 1];
    paragraph.claims.push(...claims);
    if (text) paragraph.lines.push(text);
  }
  return scenes;
}

export function toSegments(scenes: ScriptScene[]): ScriptSegment[] {
  const segments: ScriptSegment[] = [];
  let para = 0;
  for (const scene of scenes) {
    for (const paragraph of scene.paragraphs) {
      for (const text of paragraph.lines) {
        const id = `seg-${String(segments.length + 1).padStart(3, "0")}`;
        segments.push({ id, sceneId: scene.id, para, text });
      }
      para++;
    }
  }
  return segments;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Text handed to the voice. The salutation is spoken in full once per chapter and
// shown as ﷺ in every subtitle; names are respelled so the voice pronounces them.
export function createSpeaker(config: NarrationConfig): (text: string) => string {
  let honorificSpoken = false;
  const respellings = Object.entries(config.pronunciation ?? {}).sort((a, b) => b[0].length - a[0].length);

  return (text) => {
    let spoken = text.replace(/\s*ﷺ(\s*)([.,;:!?"”]?)/g, (_match, space: string, punctuation: string) => {
      if (honorificSpoken || !config.honorific) return punctuation ? punctuation : space;
      honorificSpoken = true;
      return punctuation ? `, ${config.honorific}${punctuation}` : `, ${config.honorific},${space || " "}`;
    });
    for (const [word, respelling] of respellings) {
      spoken = spoken.replace(new RegExp(`(?<![\\p{L}'])${escapeRegExp(word)}(?![\\p{L}])`, "gu"), respelling);
    }
    return spoken.replace(/\s+/g, " ").trim();
  };
}
