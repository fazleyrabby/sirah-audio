// Shared data model (SPEC sections 5.7, 29-32, 49).

export type Language = "en" | "bn";

// "preview" chapters are playable but have not passed the publish gate yet.
export type ChapterStatus = "published" | "preview" | "coming-soon";

export interface PartMeta {
  id: string;
  title: Record<Language, string>;
}

export interface ChapterMeta {
  id: string;
  slug: string;
  order: number;
  part: string;
  title: Record<Language, string>;
  description: Record<Language, string>;
  duration: Partial<Record<Language, number>>;
  audio: Partial<Record<Language, string>>;
  // Languages in which the chapter text exists (it may not be narrated yet).
  text: Partial<Record<Language, boolean>>;
  image: string;
  status: ChapterStatus;
  version: number;
}

export interface ChapterIndex {
  parts: PartMeta[];
  chapters: ChapterMeta[];
}

export interface Scene {
  id: string;
  title: string;
  start: number;
  end: number;
}

export interface SubtitleSegment {
  id: string;
  sceneId: string;
  start: number;
  end: number;
  text: string;
  para: number;
  // Reference labels for the paragraph, carried by its last line (shown in the transcript).
  refs?: string[];
}

export type VisualEffect = "ken-burns" | "slow-zoom" | "pan-left" | "pan-right" | "static";

export interface VisualCue {
  sceneId: string;
  offset?: number;
  image: string;
  alt: string;
  transition?: "fade" | "crossfade" | "cut";
  effect?: VisualEffect;
  position?: string;
}

export interface VisualSegment extends VisualCue {
  start: number;
  end: number;
}

export interface SourceReference {
  id: string;
  type: "quran" | "hadith" | "seerah" | "historical";
  title: string;
  author?: string;
  reference: string;
  numbering?: string;
  edition?: string;
  grade?: "sahih" | "hasan" | "hasan sahih";
  gradedBy?: string;
  sceneIds?: string[];
  note?: Partial<Record<Language, string>>;
}

export interface ChapterContent {
  chapterId: string;
  language: Language;
  version: number;
  // True only when every claim behind the narration has been verified by a human.
  verified: boolean;
  // False when there is no audio yet: times are zero and the chapter is shown as text.
  narrated: boolean;
  scenes: Scene[];
  subtitles: SubtitleSegment[];
  visuals: VisualCue[];
  sources: SourceReference[];
}

export interface Claim {
  id: string;
  sceneId: string;
  statement: string;
  grade: "A" | "B" | "C" | "D" | "X";
  sources: string[];
  alternatives?: string;
  status: "unverified" | "verified" | "rejected";
  verifiedBy?: string;
  verifiedOn?: string;
  notes?: string;
}

export interface ChapterProgress {
  sceneId: string;
  offset: number;
  fraction: number;
  completed: boolean;
  updatedAt: number;
}

export interface PlaybackState {
  schema: 1;
  language: Language;
  chapterId: string | null;
  speed: number;
  volume: number;
  muted: boolean;
  subtitlesEnabled: boolean;
  progress: Record<string, ChapterProgress>;
}
