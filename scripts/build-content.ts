// Validates content/, enforces the publish gate (SPEC 5.8) and emits what the app loads:
//   content/chapters/<dir>/tts-<lang>.json   input for tools/narrate.py
//   public/content/<id>/<lang>.json          ChapterContent
//   src/chapters/index.generated.json        chapter index
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createSpeaker, parseScript, toSegments } from "./lib/script.ts";
import { sourceLabel } from "../src/i18n/strings.ts";
import type {
  ChapterContent,
  ChapterIndex,
  ChapterMeta,
  ChapterStatus,
  Claim,
  Language,
  Scene,
  SourceReference,
  SubtitleSegment,
  VisualCue,
} from "../src/types.ts";

const root = path.resolve(import.meta.dirname, "..");
const LANGUAGES: Language[] = ["en", "bn"];
const errors: string[] = [];
const warnings: string[] = [];

const readJson = <T>(file: string): T => JSON.parse(readFileSync(file, "utf8")) as T;
const writeJson = (file: string, data: unknown) => {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 1) + "\n");
};

interface ChapterEntry {
  slug: string;
  part: string;
  title: Record<Language, string>;
  description?: Record<Language, string>;
}
interface ChapterList {
  parts: ChapterIndex["parts"];
  chapters: ChapterEntry[];
}
interface ChapterConfig {
  status: ChapterStatus;
  version: number;
  image?: string;
}
interface Timings {
  duration: number;
  segments: { id: string; hash: string; start: number; end: number }[];
}

const list = readJson<ChapterList>(path.join(root, "content/chapters.json"));
const narration = readJson<Record<string, Record<string, unknown>>>(path.join(root, "content/narration.json"));
const publicContent = path.join(root, "public/content");
rmSync(publicContent, { recursive: true, force: true });

const chapters: ChapterMeta[] = list.chapters.map((entry, index) => {
  const id = String(index + 1).padStart(2, "0");
  const dir = path.join(root, "content/chapters", `${id}-${entry.slug}`);
  const meta: ChapterMeta = {
    id,
    slug: entry.slug,
    order: index + 1,
    part: entry.part,
    title: entry.title,
    description: entry.description ?? { en: "", bn: "" },
    duration: {},
    text: {},
    audio: {},
    image: "/images/og-default.png",
    status: "coming-soon",
    version: 1,
  };
  if (!existsSync(path.join(dir, "chapter.json"))) return meta;

  const config = readJson<ChapterConfig>(path.join(dir, "chapter.json"));
  meta.version = config.version;
  if (config.image) meta.image = config.image;
  const where = `${id}-${entry.slug}`;
  const fail = (message: string) => errors.push(`${where}: ${message}`);

  const claims = existsSync(path.join(dir, "claims.json")) ? readJson<Claim[]>(path.join(dir, "claims.json")) : [];
  const sources = existsSync(path.join(dir, "sources.json"))
    ? readJson<SourceReference[]>(path.join(dir, "sources.json"))
    : [];
  const claimById = new Map(claims.map((claim) => [claim.id, claim]));
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const published = config.status === "published";

  for (const claim of claims) {
    for (const sourceId of claim.sources) {
      if (!sourceById.has(sourceId)) fail(`claim ${claim.id} cites unknown source "${sourceId}"`);
    }
    if (claim.grade !== "D" && claim.sources.length === 0) fail(`claim ${claim.id} has no source`);
  }
  for (const source of sources) {
    if (!source.reference) fail(`source ${source.id} has no exact reference`);
    if (published && /to be confirmed/i.test(source.reference)) fail(`source ${source.id} reference is not final`);
  }
  if (published && !existsSync(path.join(dir, "review.md"))) fail("published without review.md sign-off");

  const usedClaimsByLanguage = new Map<Language, Set<string>>();
  const sceneIdsByLanguage = new Map<Language, string>();

  for (const language of LANGUAGES) {
    const scriptFile = path.join(dir, `script-${language}.md`);
    if (!existsSync(scriptFile)) continue;
    const scenes = parseScript(readFileSync(scriptFile, "utf8"));
    const segments = toSegments(scenes);
    const used = new Set<string>();
    const scenesByClaim = new Map<string, Set<string>>();

    if (new Set(scenes.map((scene) => scene.id)).size !== scenes.length) fail(`${language}: duplicate scene ids`);
    for (const scene of scenes) {
      if (scene.images.length === 0) fail(`${language} ${scene.id}: no Image line`);
      for (const image of scene.images) {
        if (!existsSync(path.join(root, "public/images", image.image))) {
          fail(`${language} ${scene.id}: image not found: ${image.image}`);
        }
        if (!image.alt) fail(`${language} ${scene.id}: image has no alt text`);
      }
      scene.paragraphs.forEach((paragraph, index) => {
        if (paragraph.claims.length === 0) {
          fail(`${language} ${scene.id} paragraph ${index + 1}: no claim id (use "n" for pure narration)`);
        }
        for (const claimId of paragraph.claims) {
          if (claimId === "n") continue;
          const claim = claimById.get(claimId);
          if (!claim) {
            fail(`${language} ${scene.id}: unknown claim ${claimId}`);
            continue;
          }
          used.add(claimId);
          if (!scenesByClaim.has(claimId)) scenesByClaim.set(claimId, new Set());
          scenesByClaim.get(claimId)!.add(scene.id);
          if (claim.grade === "D") fail(`${language} ${scene.id}: narrates grade D claim ${claimId}`);
          if (claim.status === "rejected") fail(`${language} ${scene.id}: narrates rejected claim ${claimId}`);
          if (published && claim.status !== "verified") fail(`${language}: claim ${claimId} is not verified`);
        }
      });
    }
    usedClaimsByLanguage.set(language, used);
    sceneIdsByLanguage.set(language, scenes.map((scene) => scene.id).join(","));
    for (const claim of claims) {
      if (claim.grade !== "D" && !used.has(claim.id)) warnings.push(`${where}: ${language}: claim ${claim.id} is unused`);
    }

    // Narration manifest for the voice.
    const config_ = (narration[language] ?? {}) as { honorific?: string; pronunciation?: Record<string, string> };
    const speak = createSpeaker(config_);
    const items = segments.map((segment) => {
      const spoken = speak(segment.text);
      return { ...segment, spoken, hash: createHash("sha1").update(spoken).digest("hex").slice(0, 12) };
    });
    const audioName = `${id}-${entry.slug}${config.version > 1 ? `.v${config.version}` : ""}.mp3`;
    writeJson(path.join(dir, `tts-${language}.json`), { audio: `public/audio/${language}/${audioName}`, items });

    // Timings exist once the chapter has been narrated.
    const timingsFile = path.join(dir, `timings-${language}.json`);
    const audioFile = path.join(root, "public/audio", language, audioName);
    // Without matching audio the chapter is still published as text to read (all times zero).
    let timings: Timings | null = null;
    if (existsSync(timingsFile) && existsSync(audioFile)) {
      const candidate = readJson<Timings>(timingsFile);
      const byId = new Map(candidate.segments.map((segment) => [segment.id, segment]));
      const stale = items.length !== candidate.segments.length || items.some((item) => byId.get(item.id)?.hash !== item.hash);
      if (!stale) timings = candidate;
      else if (published) fail(`${language}: audio does not match the script (run "npm run narrate")`);
      else warnings.push(`${where}: ${language}: audio does not match the script; shown as text only`);
    }
    const narrated = timings !== null;
    const duration = timings?.duration ?? 0;
    const timingById = new Map((timings?.segments ?? []).map((segment) => [segment.id, segment]));

    const subtitles: SubtitleSegment[] = items.map((item) => {
      const timing = timingById.get(item.id);
      return { id: item.id, sceneId: item.sceneId, start: timing?.start ?? 0, end: timing?.end ?? 0, text: item.text, para: item.para };
    });
    // In-text references: every paragraph ends with the sources its claims rest on.
    let paragraphIndex = 0;
    for (const scene of scenes) {
      for (const paragraph of scene.paragraphs) {
        const cited = sources.filter((source) =>
          paragraph.claims.some((claimId) => claimById.get(claimId)?.sources.includes(source.id)),
        );
        const last = subtitles.findLast((subtitle) => subtitle.para === paragraphIndex);
        if (last && cited.length > 0) last.refs = cited.map((source) => sourceLabel(source, language));
        paragraphIndex++;
      }
    }
    const sceneList: Scene[] = scenes.map((scene, index) => {
      const first = subtitles.find((subtitle) => subtitle.sceneId === scene.id)!;
      const next = scenes[index + 1] && subtitles.find((subtitle) => subtitle.sceneId === scenes[index + 1].id)!;
      return {
        id: scene.id,
        title: scene.title,
        start: index === 0 ? 0 : first.start,
        end: next ? next.start : duration,
      };
    });
    const visuals: VisualCue[] = scenes.flatMap((scene) =>
      scene.images.map((image) => ({
        sceneId: scene.id,
        offset: image.offset,
        image: `/images/${image.image}`,
        alt: image.alt,
        transition: "crossfade" as const,
        effect: (image.effect ?? "slow-zoom") as VisualCue["effect"],
        ...(image.position ? { position: image.position } : {}),
      })),
    );
    const usedSources = sources
      .filter((source) => claims.some((claim) => used.has(claim.id) && claim.sources.includes(source.id)))
      .map((source) => {
        const sceneIds = new Set<string>();
        for (const claim of claims) {
          if (!claim.sources.includes(source.id)) continue;
          for (const sceneId of scenesByClaim.get(claim.id) ?? []) sceneIds.add(sceneId);
        }
        return { ...source, sceneIds: [...sceneIds].sort() };
      });

    const content: ChapterContent = {
      chapterId: id,
      language,
      version: config.version,
      narrated,
      verified: [...used].every((claimId) => claimById.get(claimId)?.status === "verified"),
      scenes: sceneList,
      subtitles,
      visuals,
      sources: usedSources,
    };
    writeJson(path.join(publicContent, id, `${language}.json`), content);
    meta.text[language] = true;
    if (narrated) {
      meta.duration[language] = duration;
      meta.audio[language] = `/audio/${language}/${audioName}`;
    }
  }

  // Both languages must tell the same story from the same claims.
  const en = usedClaimsByLanguage.get("en");
  const bn = usedClaimsByLanguage.get("bn");
  if (en && bn) {
    if (sceneIdsByLanguage.get("en") !== sceneIdsByLanguage.get("bn")) fail("scene ids differ between en and bn");
    for (const claimId of en) if (!bn.has(claimId)) fail(`claim ${claimId} is in en but not bn`);
    for (const claimId of bn) if (!en.has(claimId)) fail(`claim ${claimId} is in bn but not en`);
  }

  if (meta.text.en || meta.text.bn) meta.status = config.status;
  return meta;
});

const index: ChapterIndex = { parts: list.parts, chapters };
writeJson(path.join(root, "src/chapters/index.generated.json"), index);

for (const warning of warnings) console.warn(`warning  ${warning}`);
for (const error of errors) console.error(`error    ${error}`);
const playable = chapters.filter((chapter) => chapter.status !== "coming-soon").length;
console.log(`content: ${chapters.length} chapters, ${playable} playable, ${errors.length} errors`);
if (errors.length > 0) process.exit(1);
