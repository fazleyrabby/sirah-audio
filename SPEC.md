# SĪRAH ﷺ

## The Life of Prophet Muhammad ﷺ

### A source-conscious, bilingual, immersive Seerah audio experience

- Version: 1.1 (1.0 plus gap fixes: authenticity protocol, per-language data model, routing/SEO, PWA, open decisions)
- Status: Product + Technical Specification
- Languages: English + Bengali
- Primary Platform: Responsive Web + PWA
- Frontend: Vite + TypeScript + HTML + CSS
- Framework: None
- Backend: None for MVP
- Database: None for MVP
---

# 1. PROJECT VISION

Build a calm, respectful, source-conscious digital Seerah experience that allows users to listen to the life of Prophet Muhammad ﷺ as a serialized audio journey.

The experience should feel like:

- An immersive audiobook
- A historical documentary
- A visual journey through places and events
- A quiet listening experience

It should NOT feel like:

- A generic Islamic website
- A social media application
- A game
- A cinematic Hollywood production
- An AI-generated history experiment
- A music-driven documentary

The technology should remain almost invisible.

The user's attention should remain on:

1. The narration
2. The story
3. The historical context
4. The source references
5. The atmosphere
---

# 2. CORE PRODUCT PRINCIPLE

The project should follow:

Research → Verification → Original Script → Narration → Subtitles → Visual Storytelling

AI may assist with:

- Research organization
- Drafting
- Translation drafts
- Subtitle preparation
- Visual generation
- Development
- Audio processing

However:

AI-generated content must never become the historical authority.

The authority comes from reliable Islamic sources.
---

# 3. PRIMARY SOURCE

Primary Seerah reference:

**Ar-Raheeq Al-Makhtum** (The Sealed Nectar) — Safiur-Rahman Al-Mubarakpuri

Use this as a major structural and reference source.

Important:

Do NOT reproduce the entire copyrighted book.

Do NOT simply copy its English text and turn it into an audiobook.

Do NOT assume that a freely available PDF grants reproduction rights.

Instead:

1. Research the event.
2. Consult The Sealed Nectar.
3. Cross-check important claims against primary Islamic sources.
4. Create an original narration script.
5. Create an independent Bengali adaptation.
6. Record/generate original narration.

If substantial copyrighted material is ever intended to be reproduced or closely adapted, obtain appropriate permission/licensing.
---

# 4. SOURCE HIERARCHY

Use the following source hierarchy.

## Tier 1 -- Primary Islamic Sources

- Qur'an
- Sahih al-Bukhari
- Sahih Muslim

## Tier 2 -- Major Hadith Collections

Where relevant:

- Sunan Abu Dawud
- Jami' at-Tirmidhi
- Sunan an-Nasa'i
- Sunan Ibn Majah
- Musnad Ahmad

## Tier 3 -- Established Seerah Sources

Primary project reference:

- Ar-Raheeq Al-Makhtum / The Sealed Nectar

Other established Seerah works may be used for cross-checking.
---

# 5. SOURCE VERIFICATION AND AUTHENTICITY

Every significant historical claim should have a source reference.

Do not present weak, disputed, or uncertain narrations as established fact.

When sources differ:

- Identify the disagreement where relevant.
- Prefer stronger evidence.
- Do not silently convert uncertain reports into facts.
- Keep the narration understandable.
- Add a source note when appropriate.

The system should support source references at the chapter level and, where useful, at individual narrative sections.

## 5.1 Authenticity standard

"Authentic" has an operational meaning in this project:

> Nothing is narrated as fact unless it is traceable to a named source, graded, and confirmed by a qualified human who has checked the source text itself.

No specification or tool can guarantee authenticity on its own. The guarantee comes from the process below. A chapter with even one unverified claim does not ship.

## 5.2 Claim grades

Every factual statement in a script is a claim. Every claim gets exactly one grade.

| Grade | Meaning | How it may be narrated |
|-------|---------|------------------------|
| A | Qur'an | As fact |
| B | Hadith graded sahih or hasan (al-Bukhari, Muslim, or another collection with a named grading scholar) | As fact |
| C | Seerah report: transmitted by the Seerah historians (as cited in Ar-Raheeq Al-Makhtum and the classical works behind it) without an established authenticated chain | Only with attribution, e.g. "the historians of the Seerah report…". Never as bare fact |
| D | Weak, very weak, fabricated, or without known basis | Excluded from narration |
| X | Context: geography, climate, general Arabian history, explanation of terms | As context. Never worded as a religious report |

Rules:

- Appearing in Ar-Raheeq Al-Makhtum does not make a report grade B. It is a Seerah compilation; each report it carries still needs its own grade.
- A well-known story that is grade D is omitted. If omitting it would confuse listeners, a source note (not the narration) may state that the report is not established.
- If the grade of a claim cannot be determined, treat it as D until a reviewer decides.

## 5.3 Dates, ages, and numbers

Dates, ages, and counts often differ between sources.

- Narrate them with honest wording ("most commonly reported", "around").
- Record the alternatives in the claim ledger.
- Never present a disputed date or number as certain.

## 5.4 Reference format

References must be exact enough for a stranger to find the passage.

- Qur'an: surah name and `surah:ayah`.
- Hadith: collection, book/chapter name, hadith number, and the numbering scheme used (numbers differ between editions).
- Hadith outside al-Bukhari and Muslim: also the grade and the scholar who graded it.
- Seerah and historical works: title, author, edition/publisher, page.

A reference such as "Sahih al-Bukhari, Book of Revelation" with no number is incomplete and blocks publication.

## 5.5 Quotations

- Qur'an Arabic text is copied from a verified digital mushaf source. It is never typed from memory and never generated.
- Qur'an translations: name the translation, quote it exactly, and respect its license. Otherwise present the passage as "the meaning of…" in a paraphrase approved by the reviewer.
- Direct speech from hadith uses only words found in the cited narration, with the translation checked against the Arabic.
- Paraphrase must not add content the source does not contain.
- Do not merge several narrations into one quotation.

## 5.6 Limits of AI assistance

AI may draft, organize, and propose references. AI never verifies.

Any reference, hadith number, grade, date, or quotation produced by AI is `unverified` until a human opens the source and confirms it. This applies to every chapter without exception.

## 5.7 Claim ledger

Each chapter carries a `claims.json` file.

```ts
export interface Claim {
  id: string;            // "c07-012"

  sceneId: string;

  statement: string;     // the fact, in plain words

  grade: "A" | "B" | "C" | "D" | "X";

  sources: string[];     // SourceReference ids

  alternatives?: string; // differing reports, if any

  status: "unverified" | "verified" | "rejected";

  verifiedBy?: string;

  verifiedOn?: string;   // ISO date

  notes?: string;
}
```

Scripts mark each paragraph of narration with the claim ids it rests on (`n` for narration that carries no factual claim). The build fails on a paragraph with no marker.

## 5.8 Publish gate

A chapter may be published only when all of the following hold:

- Every claim is `verified` and graded A, B, C, or X.
- Every factual sentence in the script maps to a claim id.
- Grade C claims carry attribution wording in both languages.
- The English and Bengali scripts cover the same claim ids. Neither adds a claim the other lacks.
- Every source reference is complete per 5.4.
- Reviewer sign-off is recorded in `review.md` (name, role, date, script version).
- Audio was recorded from the signed-off script version. Any script change after sign-off requires a new review and a new recording of the changed passage.

The content build script enforces the mechanical parts of this gate and fails the build if a published chapter violates them.

A chapter that has not yet passed the gate may be made playable only with status `preview`. A preview chapter shows a visible notice, on the listening screen and in its Sources panel, that its references are awaiting scholarly review. `preview` exists for development and review; the public launch (section 86) requires `published`.

## 5.9 Reviewers

Two human roles are required before any chapter ships:

- Historical reviewer: qualified in hadith and Seerah, responsible for grades and references.
- Bengali reviewer: native speaker familiar with Islamic terminology, responsible for the Bengali script and its parity with the English.

## 5.10 Corrections

- Each chapter has a version number and a corrections log.
- When an error is found: fix the script, re-review, re-record, bump the version, log the change.
- The corrections log is public on the Sources page.
---

# 6. CONTENT PRINCIPLE

The narration should be original.

Do not write it like an academic textbook.

Do not write it like a fictional novel.

Do not invent dialogue that is not documented.

Do not invent internal thoughts.

Do not dramatize undocumented events.

Do not add fictional conversations to make the story more entertaining.

Instead:

- Present documented events.
- Use descriptive narration.
- Explain historical context.
- Create atmosphere through environment and pacing.
- Clearly distinguish documented facts from interpretation or reconstruction.
---

# 7. RELIGIOUS / VISUAL SAFETY RULES

These rules are NON-NEGOTIABLE.

## 7.1 Prophet Muhammad ﷺ

NEVER visually depict Prophet Muhammad ﷺ.

Do not create:

- His face
- His body as a recognizable figure
- A silhouette intended to represent his appearance
- A portrait
- A painting
- A sculpture
- A photorealistic reconstruction
- An AI-generated representation
- An identifiable clothing/personality reconstruction

Do not use visual prompts such as:

"Show Prophet Muhammad ﷺ walking..."

Instead use environmental storytelling.

Example:

BAD:

"Show Prophet Muhammad ﷺ approaching Mount Hira."

GOOD:

"Show the mountain of Hira before dawn, with the cave visible in the distance. No human figure."
---

# 8. OTHER HISTORICAL PERSONALITIES

Do not generate identifiable portraits/faces for historical personalities.

Examples include:

- Abu Bakr رضي الله عنه
- Umar رضي الله عنه
- Uthman رضي الله عنه
- Ali رضي الله عنه
- Khadijah رضي الله عنها
- Aisha رضي الله عنها
- Bilal رضي الله عنه
- Hamzah رضي الله عنه
- Abu Sufyan
- Abu Jahl
- Other named companions
- Other named historical figures

The goal is NOT to reconstruct what historical people looked like.
---

# 9. HUMAN FIGURE VISUAL RULE

When people are required for a scene, use:

- Back-facing figures
- Distant figures
- Anonymous silhouettes
- Cropped compositions
- Hands
- Feet
- Clothing
- Groups where individuals are indistinguishable
- Figures outside the frame
- Environmental compositions

Faces should preferably be completely outside the frame.

If a close human scene is unavoidable:

- Face must be deliberately obscured
- Face must not be identifiable
- Do not create a recognizable historical personality

The preferred visual style is:

"Faceless historical cinema."
---

# 10. WHY FACELESS VISUALS

The project should not cause viewers to unconsciously associate an AI-generated face with a real historical person.

Even if an image is labeled "AI-generated," repeated exposure can create a mental association.

Therefore:

The project should intentionally avoid creating historical personalities visually.

The absence of faces becomes part of the project's visual identity.
---

# 11. VISUAL PHILOSOPHY

Visual style:

- Calm
- Warm
- Historical
- Minimal
- Atmospheric
- Cinematic but restrained
- Natural
- Respectful
- Non-sensational

Avoid:

- Hollywood action aesthetics
- Fantasy aesthetics
- Superhero styling
- Excessive glowing effects
- Artificial halos
- Magical visual effects
- Excessive battle spectacle
- Video-game-like combat
- Overdramatic visual effects
- Modern objects
- Anachronistic architecture
---

# 12. VISUAL STORYTELLING

Tell the story primarily through:

- Landscapes
- Architecture
- Mountains
- Desert
- Roads
- Caves
- Palm groves
- Objects
- Maps
- Weather
- Lighting
- Shadows
- Anonymous distant figures
- Environmental details

Example:

## First Revelation

Do NOT show:

- Prophet Muhammad ﷺ
- Jibril عليه السلام
- Any identifiable person

Show:

- Mount Hira
- Cave entrance
- Night sky
- Moonlight
- Quiet mountain landscape
- Dawn over Makkah

The narration carries the event.

The visuals establish atmosphere.
---

# 13. VISUAL DISCLAIMER

The project must make clear:

"Visual scenes are artistic reconstructions created to support the narration. They are not photographs or definitive representations of historical appearances or locations."

The visuals should never be presented as historical evidence.
---

# 14. AUDIO PHILOSOPHY

The audio experience is fundamentally:

## VOICE FIRST

Narration is the primary and dominant audio layer.

The project should NOT use unnecessary music.
---

# 15. NO BACKGROUND MUSIC

Do NOT use:

- Cinematic orchestral scores
- Emotional background music
- Generic Islamic background music
- Lo-fi music
- Piano beds
- Ambient music
- Trailer music
- Continuous musical backgrounds
- AI-generated emotional music

Music is NOT part of the core product.

The default experience should be:

Narration + silence.
---

# 16. NATURAL SOUND ONLY

Natural environmental sound may be used only when it meaningfully helps establish place, time, or atmosphere.

Examples:

- Desert wind
- Very subtle distant caravan ambience
- Birds
- Palm leaves
- Water
- Night ambience
- Very subtle footsteps on sand
- Distant marketplace ambience
- Subtle environmental sounds

Natural sound must be optional and restrained.

It must never compete with narration.
---

# 17. DEFAULT AUDIO MIX

Preferred hierarchy:

```text
Narration
    ↓
Natural ambience, if necessary
    ↓
Silence
```

There should be no music layer.

Many scenes should intentionally contain:

Narration + silence.

Silence is an important part of the experience.
---

# 18. NARRATION STYLE

Narration should be:

- Male
- Mature
- Warm
- Calm
- Natural
- Clear
- Respectful
- Medium/low pitch
- Comfortable pace
- Emotionally controlled
- Documentary-like
- Intimate

Avoid:

- Robotic delivery
- News anchor voice
- Trailer voice
- Excessive theatricality
- Artificial emotional manipulation
- Excessive dramatic pauses
- Shouting
- Overacting

The narrator should sound like someone calmly telling an important story.
---

# 19. ENGLISH + BENGALI

Two primary versions:

- English
- Bengali

Both use male narration.

Do not mechanically translate English into Bengali.

Preferred content pipeline:

```text
Research
    ↓
Fact-checked source notes
    ↓
English narration
    ↓
Bengali narration
```

Bengali should sound like natural spoken Bangla.

Avoid literal machine translation.
---

# 20. BENGALI LANGUAGE STYLE

Bengali should be:

- Natural
- Literary but conversational
- Easy to understand
- Respectful
- Suitable for listening
- Not excessively academic
- Not awkwardly translated

Use consistent Bengali transliteration.

Example:

- মক্কা
- মদিনা
- হিজরত
- কুরাইশ
- ওহি
- রাসূল ﷺ
- সাহাবি
- আনসার
- মুহাজির

Create and maintain a project-wide terminology glossary.
---

# 21. ARABIC / ISLAMIC TERMINOLOGY

Create a consistent terminology guide.

Examples:

- Muhammad ﷺ
- Allah سبحانه وتعالى
- Abu Bakr رضي الله عنه
- Umar رضي الله عنه
- Khadijah رضي الله عنها
- Aisha رضي الله عنها
- Quraysh
- Makkah
- Madinah
- Hijrah
- Ansar
- Muhajirun

Avoid excessive repetition of honorifics that makes narration unnatural, while maintaining appropriate respect and project conventions.
---

# 22. INITIAL CHAPTER STRUCTURE

The following is a starting structure.

Research may later split, merge, or reorder chapters based on the verified chronology.

## PART I -- BEFORE PROPHETHOOD

1. Arabia Before Islam
2. The Lineage of Muhammad ﷺ
3. The Birth of Muhammad ﷺ
4. His Early Childhood
5. His Youth
6. Khadijah رضي الله عنها
7. The First Revelation

## PART II -- THE MAKKAN YEARS

8. The Beginning of Prophethood
9. The First Believers
10. The Call Becomes Public
11. Persecution in Makkah
12. Migration to Abyssinia
13. The Boycott
14. The Year of Sorrow
15. Ta'if
16. Al-Isra' wal-Mi'raj
17. The Pledges of Aqabah

## PART III -- THE HIJRAH

18. The Decision to Leave Makkah
19. The Night of Hijrah
20. Cave Thawr
21. The Journey
22. Arrival in Madinah

## PART IV -- MADINAH

23. Building the Community
24. The Community Order / Constitution
25. Badr
26. Uhud
27. The Trench
28. Hudaybiyyah
29. Khaybar
30. Letters to Rulers
31. The Conquest of Makkah
32. Hunayn

## PART V -- THE FINAL YEARS

33. The Delegations
34. The Farewell Hajj
35. The Final Days
36. The Passing of the Messenger ﷺ
37. His Legacy

Chapter numbers in this list are the canonical numbers. They are used in file names, the chapter explorer, and the listening screen. Each chapter also has a stable `slug` (for example `the-first-revelation`) that is used in URLs and never changes even if chapters are renumbered.
---

# 23. CHAPTER LENGTH

Recommended:

```text
Short chapter:
8-15 minutes

Normal chapter:
15-25 minutes

Major historical event:
20-35 minutes
```

Avoid creating extremely long 60-90 minute chapters.

The user should be able to finish a chapter and naturally continue to the next one.
---

# 24. MVP CONTENT

Do not produce all 37 chapters before testing the application.

First produce three complete chapters:

- Chapter 1 -- Arabia Before Islam
- Chapter 3 -- The Birth of Muhammad ﷺ
- Chapter 7 -- The First Revelation

These should test:

- Narration
- Bengali narration
- Audio player
- Subtitles
- Visual timeline
- Visual transitions
- Source references
- Language switching
- Persistent progress

Only expand after the core experience feels correct.

The other 34 chapters appear in the chapter explorer as "coming soon" and are not playable.
---

# 25. CHAPTER PRODUCTION PACKAGE

Each chapter should have:

```text
content/chapters/07-the-first-revelation/
├── research.md
├── claims.json          claim ledger (section 5.7)
├── sources.json         SourceReference list
├── script-en.md
├── script-bn.md
├── storyboard.md
├── scenes-en.json       scene timings for English audio
├── scenes-bn.json       scene timings for Bengali audio
├── subtitles-en.json
├── subtitles-bn.json
├── visuals.json         visual cues, shared by both languages
├── review.md            reviewer sign-off + corrections log
├── audio-en.mp3
└── audio-bn.mp3
```

`content/` is the working source. A build script validates it and emits the files the app loads (section 55).
---

# 26. RESEARCH FILE

Example:

```markdown
# Chapter: The First Revelation

## Historical Question

What happened during the first revelation?

## Primary Sources

- Qur'an 96:1-5
- Sahih al-Bukhari, Book of Revelation

## Secondary Sources

- Ar-Raheeq Al-Makhtum

## Confirmed Facts

...

## Disputed / Uncertain Details

...

## Narration Notes

...

## Visual Restrictions

- Do not depict Muhammad ﷺ
- Do not depict Jibril عليه السلام
- Show Mount Hira
- Show Cave Hira
- Use nighttime atmosphere
- No identifiable humans
```

The research file is the human-readable companion to `claims.json`. "Confirmed Facts" lists grade A and B claims, "Disputed / Uncertain Details" lists grade C and D material and differing reports. Every item carries its claim id.
---

# 27. SCRIPT FORMAT

Each chapter should be structured as:

```text
SCENE
NARRATION
VISUAL DIRECTION
AUDIO DIRECTION
SOURCE
```

Example:

```markdown
## Scene 01 -- Mount Hira

Narration:

Above the valley of Makkah stood the mountain of Hira...

Visual:

Wide shot of Mount Hira before dawn.
No human figure.

Audio:

Voice only.
Optional extremely subtle night wind.

Source:

Sahih al-Bukhari
Ar-Raheeq Al-Makhtum
```

Each scene has an id (`s01`, `s02`, …) that is identical in the English and Bengali scripts. Scene ids are what keep subtitles, visuals, sources, and language switching aligned across the two recordings.

Scripts are written one narration line per subtitle; a blank line starts a new paragraph. Each paragraph ends with its claim ids in a comment, for example `<!-- c07-012 c07-013 -->`. The comment is stripped from subtitles and never read aloud.

Each scene names its visual on an `Image:` line: `Image: path | effect | alt text | offset | position` (the last two optional).
---

# 28. NARRATION SCRIPT RULES

Do:

- Tell documented events clearly.
- Explain unfamiliar historical context.
- Maintain chronology.
- Use natural transitions.
- Keep the listener oriented.

Do NOT:

- Invent dialogue.
- Invent thoughts.
- Invent conversations.
- Present uncertain reports as certain.
- Add fictional characters.
- Add fictional scenes.
- Over-dramatize events.
---

# 29. SOURCE DATA MODEL

```ts
export interface SourceReference {
  id: string;

  type:
    | "quran"
    | "hadith"
    | "seerah"
    | "historical";

  title: string;

  author?: string;

  reference: string;     // exact: number, surah:ayah, or page

  numbering?: string;    // hadith numbering scheme used

  edition?: string;      // edition/publisher for books

  grade?: "sahih" | "hasan";

  gradedBy?: string;     // required for hadith outside al-Bukhari and Muslim

  sceneIds?: string[];   // scenes this source supports; omit for whole chapter

  note?: {
    en?: string;
    bn?: string;
  };
}
```

`reference` is required. A source without an exact reference cannot be published (section 5.4).
---

# 30. CHAPTER DATA MODEL

English and Bengali recordings have different lengths, so anything measured in seconds is stored per language. Data is split into a small index that loads at startup and per-chapter content that loads on demand.

## 30.1 Chapter index

One entry per chapter, all 37 loaded at startup. No transcripts here.

```ts
export type Language = "en" | "bn";

export interface ChapterMeta {
  id: string;            // "07"

  slug: string;          // "the-first-revelation"

  order: number;

  part: string;

  title: Record<Language, string>;

  description: Record<Language, string>;

  duration: Record<Language, number>;   // seconds

  audio: Record<Language, string>;

  image: string;         // cover / og:image

  status: "published" | "preview" | "coming-soon";   // preview: see 5.8

  version: number;

  tags?: string[];
}
```

## 30.2 Chapter content

Loaded only when a chapter is opened, one file per language.

```ts
export interface Scene {
  id: string;            // "s01", same id in both languages

  start: number;

  end: number;
}

export interface ChapterContent {
  chapterId: string;

  language: Language;

  version: number;

  scenes: Scene[];

  subtitles: SubtitleSegment[];

  visuals: VisualCue[];

  sources: SourceReference[];
}
```

The claim ledger is not shipped to the browser. It stays in `content/` and is checked at build time.
---

# 31. SUBTITLE DATA MODEL

```ts
export interface SubtitleSegment {
  id: string;

  sceneId: string;

  start: number;

  end: number;

  text: string;
}
```

Example:

```ts
{
  id: "seg-001",
  sceneId: "s01",
  start: 0,
  end: 5.8,
  text: "In the valley of Makkah..."
}
```

Subtitles should be phrase/sentence based.

Do NOT implement karaoke-style word-by-word highlighting.

Subtitle text must match the signed-off script exactly. Segments are sorted by `start` and do not overlap.
---

# 32. VISUAL DATA MODEL

Visuals are authored once per chapter and shared by both languages. A cue is anchored to a scene, not to a clock time, so it lands at the same story moment in either recording.

```ts
export interface VisualCue {
  sceneId: string;

  offset?: number;       // 0-1, position within the scene. Default 0

  image: string;

  alt: Record<Language, string>;

  transition?: "fade" | "crossfade" | "cut";

  effect?:
    | "ken-burns"
    | "slow-zoom"
    | "pan-left"
    | "pan-right"
    | "static";

  position?: string;
}
```

At load time the app resolves each cue against the active language's scene timings into an absolute segment:

```ts
export interface VisualSegment extends VisualCue {
  start: number;

  end: number;           // start of the next cue, or end of audio
}
```

Example:

```ts
{
  sceneId: "s01",
  image: "/images/mountains/hira-before-dawn.webp",
  alt: { en: "Mount Hira before dawn", bn: "ভোরের আগে হেরা পর্বত" },
  transition: "fade",
  effect: "slow-zoom"
}
```
---

# 33. VISUAL TIMELINE

Example:

```text
00:00 ──────────────── 00:38
Mount Hira

00:38 ──────────────── 01:42
Makkah at night

01:42 ──────────────── 02:35
Arabian landscape

02:35 ──────────────── 03:50
Historical map
```

Audio timestamp is the source of truth.

Do not run independent visual timers.

The times above are resolved values for one language. The same cues resolve to different times in the other language (section 32).
---

# 34. AUDIO TIMELINE ENGINE

The audio player controls:

- subtitles
- visuals
- progress
- transcript highlighting
- chapter progress

Example:

```ts
audio.addEventListener("timeupdate", () => {
  const time = audio.currentTime;

  subtitleEngine.update(time);

  visualEngine.update(time);

  playerUI.updateProgress(time);
});
```

`timeupdate` fires only about four times per second. That is enough for progress and visuals. For subtitles, drive updates from `requestAnimationFrame` while playing, still reading `audio.currentTime` as the only clock.
---

# 35. VISUAL ENGINE

Responsibilities:

1. Read current audio time.
2. Determine active visual segment.
3. Detect segment changes.
4. Transition to the new visual.
5. Apply subtle CSS motion.
6. Avoid unnecessary DOM updates.
7. Respect reduced-motion preferences.
---

# 36. IMAGE GENERATION RULES

Base visual style:

```text
Historical Arabian environment inspired by 7th-century Arabia,
natural cinematic documentary aesthetic,
period-appropriate architecture and materials,
earthy muted colors,
natural lighting,
atmospheric realism,
historically respectful,
no modern objects,
no identifiable faces,
no portraits,
no depiction of prophets,
no depiction of religious personalities,
no fantasy elements,
no text.
```

For human scenes:

```text
All human figures must be anonymous,
shown from behind or at a distant scale,
faces outside the frame or completely indistinguishable,
no identifiable historical personalities,
no portraiture.
```

## 36.1 Image review

Image generators produce faces, modern objects, and wrong architecture even when told not to. Every image is checked by a person against sections 7-13 before it enters `public/images/`. An image with any readable face is rejected, not blurred.

Each image is recorded in `content/visuals/manifest.json` with its prompt, tool, date, and the reviewer who approved it.

## 36.2 Rulings for hard cases

- The unseen is never depicted: angels, Jibril عليه السلام, Buraq, the heavens, Paradise, Hell. Scenes such as the first revelation and Al-Isra' wal-Mi'raj use only earthly settings (night sky, landscape, the city from a distance).
- No other prophets are depicted.
- Idols are not shown in detail. Pre-Islamic religious practice is carried by narration.
- The Ka'bah is shown from a distance or in part, as an acknowledged reconstruction. Do not copy its modern appearance into a 7th-century scene.
- No later buildings in early scenes (for example the Dome of the Rock, minarets, Ottoman-era structures).
- Battles: no combat, no wounds, no blood. Use terrain, maps, dust, distance, and the aftermath of an empty field.
- No Arabic calligraphy or Qur'an text generated inside images.
---

# 37. MAPS

Some events should use maps instead of generated scenes.

Potential map chapters:

- Hijrah
- Migration to Abyssinia
- Badr
- Uhud
- Khandaq
- Trade routes
- Conquest of Makkah

Use:

- SVG
- CSS
- TypeScript

No map framework required for MVP.

Example:

```text
MAKKAH
   │
   │ Hijrah
   ↓
MADINAH
```

Animate routes subtly.
---

# 38. MAIN WEBSITE

Required screens:

1. Home
2. Listening screen
3. Chapter explorer
4. Transcript
5. Sources
6. About

Keep the number of screens small.
---

# 39. HOME PAGE

Minimal landing page.

```text
SĪRAH ﷺ

The Life of Muhammad ﷺ

A journey through his blessed life.

[ Begin Listening ]

English | বাংলা
```

Below:

```text
Continue Listening
```

if the user has progress.
---

# 40. LISTENING SCREEN

Primary application screen.

Concept:

```text
┌─────────────────────────────────────┐
│                                     │
│         HISTORICAL VISUAL           │
│                                     │
│                                     │
│                                     │
│                                     │
│  Chapter 07                         │
│  The First Revelation               │
│                                     │
│  ───────────────────────────────    │
│                                     │
│  In the silence of the night...     │
│                                     │
│       ◀ 15    ▶    15 ▶             │
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━            │
│                                     │
│  08:42                    24:17     │
│                                     │
│  English        বাংলা               │
│                                     │
└─────────────────────────────────────┘
```
---

# 41. CHAPTER EXPLORER

Group chapters by Part.

Example:

```text
THE MAKKAN YEARS

01  The Beginning of Prophethood
02  The First Believers
03  The Public Call
04  Persecution
05  Migration to Abyssinia
...
```

Each chapter displays:

- Number
- Title
- Duration
- Completion status
- Current playback indicator
---

# 42. TRANSCRIPT

Users can open the full transcript.

Example:

```text
The First Revelation

[00:00]

In the mountains surrounding Makkah...

[05:42]

The Messenger ﷺ returned from the cave...
```

Clicking a transcript section should seek to that timestamp.
---

# 43. SOURCES PANEL

Each chapter should expose its sources.

Example:

```text
SOURCES

The Sealed Nectar
Safiur-Rahman Al-Mubarakpuri

Sahih al-Bukhari
Book of Revelation

Qur'an
96:1-5
```

Keep the source panel secondary to the listening experience.

Entries in the panel show the exact reference (section 5.4), and the grade where the source is a hadith outside al-Bukhari and Muslim. Reports narrated with attribution (grade C) are labelled as Seerah reports.

The `/sources` page lists the project's source hierarchy, the grading rules of section 5.2, the visual disclaimer of section 13, and the public corrections log.
---

# 44. LANGUAGE SWITCHING

Languages:

- English
- বাংলা

When switching:

- Change audio.
- Change subtitle.
- Change transcript.
- Change chapter title.
- Change chapter description.
- Change interface text.
- Preserve current chapter.
- Preserve the story position.

Position is preserved by scene, not by timestamp. The two recordings differ in length, so the same minute mark is a different point in the story.

```text
English: Chapter 7, scene s04, 08:32

Switch to Bengali:

Bengali audio starts at the beginning of scene s04
```

If the scene cannot be found in the other language, start the chapter from the beginning.

Playing state is preserved: if audio was playing, it continues playing after the switch.

Progress is stored as scene id plus offset so it survives a language switch (section 49).
---

# 45. PLAYBACK CONTROLS

Required:

- Play
- Pause
- Previous chapter
- Next chapter
- Seek backward
- Seek forward
- Volume
- Playback speed
- Language
- Subtitle toggle
- Transcript
- Chapter list

Seek:

-15 seconds / +15 seconds

Notes:

- iOS Safari does not allow web pages to set audio volume. Hide the volume control there; the hardware buttons do the job.
- Implement the Media Session API (title, chapter artwork, play/pause, seek, previous/next) so the lock screen, headphones, and car controls work. This is required for the mobile audiobook feel.
- Next chapter at the end of the list, and "coming soon" chapters, are disabled rather than hidden.
- When a chapter ends, show the next chapter and start it after a short pause unless the user cancels.
---

# 46. PLAYBACK SPEED

Support:

```text
0.75x
1x
1.1x
1.25x
1.5x
1.75x
2x
```

Default:

1x

Persist user preference.
---

# 47. KEYBOARD CONTROLS

Desktop:

```text
Space       Play/Pause
←           -5 seconds
→           +5 seconds
Shift + ←   Previous chapter
Shift + →   Next chapter
M           Mute
↑           Volume up
↓           Volume down
L           Language
T           Transcript
```

Shortcuts are active only on the listening screen and are ignored while focus is in a form control or an open dialog. ↑ and ↓ are captured only when the page itself does not need to scroll. `Esc` closes the transcript, sources, and chapter panels.
---

# 48. MOBILE CONTROLS

Primary controls should be large:

```text
Previous
-15
Play/Pause
+15
Next
```

Minimum touch target:

44px

Prefer larger for primary actions.
---

# 49. PERSISTENT PROGRESS

Use localStorage.

```ts
interface ChapterProgress {
  sceneId: string;       // language-independent position

  offset: number;        // seconds into the scene

  fraction: number;      // 0-1 of the chapter, for progress display

  completed: boolean;

  updatedAt: number;
}

interface PlaybackState {
  schema: 1;

  language: "en" | "bn";

  chapterId: string | null;

  speed: number;

  volume: number;

  muted: boolean;

  subtitlesEnabled: boolean;

  progress: Record<string, ChapterProgress>;  // by chapter id
}
```

No account required.

Rules:

- Save at most every few seconds while playing, and on pause, chapter change, and page hide.
- A chapter is completed when playback reaches its final 15 seconds.
- Reading and writing are wrapped so that private mode or blocked storage never breaks playback.
- `schema` allows the stored shape to change later without corrupting old data.
---

# 50. CONTINUE LISTENING

Home page should show:

```text
CONTINUE LISTENING

The First Revelation

08:42 / 24:17

[ Continue ]
```

If no progress:

```text
BEGIN THE JOURNEY
```
---

# 51. SLEEP TIMER

Optional post-MVP feature.

Options:

```text
15 minutes
30 minutes
45 minutes
60 minutes
End of chapter
```

At expiration:

Pause audio.
---

# 52. PWA

Implement:

- Web manifest
- Service worker
- Installable app
- App icons
- Splash screen
- Offline application shell

MVP should support offline shell.

Full audio offline downloading can be implemented later.

Implementation:

- Hand-written service worker, no Workbox. A small post-build script injects the list of built shell files to precache.
- Precache: HTML, CSS, JS, fonts, icons. Stale-while-revalidate for chapter JSON and images already viewed.
- Audio is never cached by the service worker in MVP. Audio requests pass straight to the network, because range requests and large files need dedicated handling (section 53).
- When offline, the shell opens, saved progress is visible, and chapters show a clear "you are offline" state instead of a broken player.
- A new version activates on the next visit, never in the middle of playback.
---

# 53. OFFLINE AUDIO -- FUTURE

After MVP the app may support:

- Download chapter
- Download language
- Offline playback
- Offline subtitles
- Offline visuals

Do not implement initially unless necessary.
---

# 54. FRONTEND STACK

Use ONLY lightweight technologies.

Required:

- Vite
- TypeScript
- HTML
- CSS

No React.

No Vue.

No Angular.

No Next.js.

No Nuxt.

No frontend-heavy framework.

Do not introduce unnecessary dependencies.
---

# 55. PROJECT STRUCTURE

```text
sirah-audio/
│
├── content/                      working source, not served
│   ├── glossary.md
│   ├── chronology.md
│   ├── content-guidelines.md
│   ├── visual-guidelines.md
│   ├── visuals/
│   │   └── manifest.json
│   └── chapters/
│       ├── 01-arabia-before-islam/
│       ├── 03-the-birth/
│       └── 07-the-first-revelation/     package per section 25
│
├── tools/
│   └── narrate.py                narration + exact subtitle timings from content/narration.json
│
├── scripts/
│   ├── build-content.ts          validate content, enforce publish gate, emit public/content
│   ├── make-visuals.ts           generate the landscape scenes and map
│   └── prerender.ts              emit static HTML + metadata per route
│
├── public/
│   ├── audio/
│   │   ├── en/
│   │   └── bn/
│   │
│   ├── content/                  generated
│   │   └── 07/
│   │       ├── en.json           ChapterContent
│   │       └── bn.json
│   │
│   ├── images/
│   │   ├── makkah/
│   │   ├── madinah/
│   │   ├── hijrah/
│   │   ├── desert/
│   │   ├── mountains/
│   │   ├── architecture/
│   │   ├── objects/
│   │   └── maps/
│   │
│   ├── icons/
│   ├── sw.js                     service worker; precache list filled in by prerender.ts
│   └── manifest.webmanifest
│
├── src/
│   ├── audio/
│   │   ├── player.ts
│   │   ├── audio-state.ts
│   │   ├── audio-events.ts
│   │   └── media-session.ts
│   │
│   ├── chapters/
│   │   ├── chapters.ts           chapter index (ChapterMeta[])
│   │   ├── chapter-loader.ts
│   │   └── timeline.ts
│   │
│   ├── subtitles/
│   │   ├── subtitle-engine.ts
│   │   └── subtitle-renderer.ts
│   │
│   ├── visuals/
│   │   ├── visual-engine.ts
│   │   └── transitions.ts
│   │
│   ├── player/
│   │   ├── player-ui.ts
│   │   ├── controls.ts
│   │   └── progress.ts
│   │
│   ├── router/
│   │   └── router.ts
│   │
│   ├── i18n/
│   │   └── strings.ts            interface text, en + bn
│   │
│   ├── settings/
│   │   └── settings.ts
│   │
│   ├── storage/
│   │   └── local-storage.ts
│   │
│   ├── components/
│   │   ├── header.ts
│   │   ├── chapter-list.ts
│   │   ├── source-panel.ts
│   │   └── transcript.ts
│   │
│   ├── styles/
│   │   ├── reset.css
│   │   ├── variables.css
│   │   ├── layout.css
│   │   ├── player.css
│   │   └── responsive.css
│   │
│   ├── types.ts                  shared data model
│   └── main.ts
│
├── tests/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

Chapter metadata for both languages lives in one index (`chapters.ts`). There are no separate per-language chapter lists.

Allowed dev dependencies: Vite, TypeScript, Vitest. No runtime dependencies.
---

# 56. NO BACKEND FOR MVP

MVP does not need:

- Authentication
- Database
- API
- CMS
- User accounts

Everything can be static.

Deploy to:

- Vercel
- Cloudflare Pages
- Netlify
- Static server
---

# 57. FUTURE BACKEND

Do not implement in MVP.

Potential future:

Supabase/Postgres

for:

- Accounts
- Cross-device progress
- Bookmarks
- Listening history
- User notes
- Content management
- Corrections
---

# 58. STATE MANAGEMENT

No state management library.

Use a small application state:

```ts
interface AppState {
  language: "en" | "bn";

  currentChapter: string | null;

  isPlaying: boolean;

  currentTime: number;

  duration: number;

  volume: number;

  speed: number;

  subtitles: boolean;
}
```

Use native events/custom events where appropriate.

`AppState` is the live in-memory state. `PlaybackState` (section 49) is the part of it that is saved. `currentTime` and `duration` always come from the audio element and are never stored as a second source of truth.
---

# 59. AUDIO IMPLEMENTATION

Use native HTML5 Audio as the core playback engine.

```html
<audio></audio>
```

Basic playback must not depend on Web Audio API.

Web Audio API may be used later for:

- Optional ambience mixing
- Advanced volume control
- Audio visualization

Do not over-engineer the audio system.
---

# 60. AUDIO FORMAT

Recommended:

```text
MP3
44.1kHz or 48kHz
128-192 kbps
```

Voice should be clean and consistent.

Normalize loudness.

Target approximately:

-16 LUFS integrated

Avoid excessive compression.
---

# 61. AUDIO FILE STRUCTURE

File names are the chapter number plus the chapter slug, identical in both languages.

```text
public/audio/

en/
  01-arabia-before-islam.mp3
  03-the-birth.mp3
  07-the-first-revelation.mp3
  ...

bn/
  01-arabia-before-islam.mp3
  03-the-birth.mp3
  07-the-first-revelation.mp3
  ...
```

Audio must be served with HTTP range request support so seeking works without downloading the whole file. If audio outgrows the static host's limits, move it to object storage/CDN and keep the paths in the chapter index.

When a chapter is re-recorded after a correction, the file name gains the chapter version (`07-the-first-revelation.v2.mp3`) so no listener gets stale cached audio.
---

# 62. NATURAL SOUND FILES

If natural ambience is used, it is mixed into the narration file during audio production. The app plays one audio file per chapter per language and does no mixing at runtime.

Source ambience recordings are kept with the production material, not served:

```text
content/ambience/

desert-wind.wav
night.wav
birds.wav
palm-wind.wav
water.wav
market-distant.wav
```

Only use short, subtle passages where necessary.

Do not turn ambience into constant background noise.

Ambience recordings must be properly licensed, and must contain no music, no human speech, and no adhan or recitation.
---

# 63. IMAGE FORMAT

Prefer:

- AVIF
- WebP

Use responsive image sizing.

Avoid unnecessarily large images.
---

# 64. VISUAL TRANSITIONS

Recommended:

```text
Fade: 1000-1800ms

Crossfade: 1500-2500ms

UI transitions: 150-300ms

Ken Burns: 20-60 seconds
```

Avoid fast transitions.
---

# 65. REDUCED MOTION

Respect:

```css
@media (prefers-reduced-motion: reduce)
```

When enabled:

- Disable Ken Burns
- Disable unnecessary transitions
- Use static images
- Keep essential UI transitions minimal
---

# 66. TYPOGRAPHY

Use:

- Elegant serif for major headings
- Highly readable sans-serif for UI
- Proper Bengali font for Bengali content

Do not depend on poor browser fallback for Bengali.

Requirements:

- Fonts are self-hosted in `public/fonts/` as WOFF2, subset, with `font-display: swap`. No third-party font requests.
- An Arabic font is included for ﷺ (U+FDFA), the honorific phrases, and the optional Arabic title. Glyph coverage for U+FDFA must be confirmed, since most Latin and Bengali fonts lack it.
- Bengali text uses a larger size and line height than Latin text; conjuncts must not be clipped in subtitles.
- All font licenses permit self-hosting (for example SIL Open Font License).
- `lang` and `dir` attributes are set correctly on English, Bengali, and Arabic text.
---

# 67. VISUAL COLOR SYSTEM

Use a restrained palette.

Possible:

```text
Background:
warm black / charcoal

Surface:
deep warm gray

Primary:
warm white

Secondary:
muted sand

Accent:
subtle amber/gold
```

Avoid bright saturated colors.
---

# 68. BRANDING

Primary name:

SĪRAH ﷺ

Subtitle:

The Life of Muhammad ﷺ

Optional Arabic:

السيرة النبوية

Brand identity should be:

- Minimal
- Elegant
- Quiet
- Historical
- Warm
- Modern but not trendy

Avoid:

- Generic mosque clipart
- Excessive gold ornamentation
- Stock Islamic website aesthetics
- Excessive geometric decoration
---

# 69. SEO

Every chapter should have metadata.

Example:

```html
<title>
The First Revelation -- Sīrah ﷺ
</title>

<meta
  name="description"
  content="Listen to the story of the First Revelation..."
>
```

OpenGraph:

- og:title
- og:description
- og:image
- og:type

Link-preview crawlers and some search crawlers do not run JavaScript, so metadata set at runtime is not enough. At build time `scripts/prerender.ts` writes one static HTML file per route and per language containing:

- `<title>`, description, canonical URL
- OpenGraph tags (`og:type` is `article` for chapters)
- `hreflang` links between the English and Bengali versions
- `lang` attribute
- The chapter title, description, and full transcript as real HTML, so the page is readable and indexable without JavaScript

The script uses plain string templates. No framework.
---

# 70. URL STRUCTURE

```text
/                                  Home
/chapters                          Chapter explorer
/chapter/the-first-revelation      Listening screen for that chapter
/sources                           Sources, grading rules, corrections log
/about                             About, visual disclaimer, contact
```

There is no separate `/listen` route. "Begin Listening" and "Continue" go to the relevant `/chapter/<slug>`.

Slugs come from the chapter index and never change after publication.

Language:

- English is the default at the URLs above.
- Bengali uses the same paths under `/bn/` (for example `/bn/chapter/the-first-revelation`).
- A first-time visitor gets the language of the URL. The saved preference is used only when navigating inside the app, so shared links always open in the language they were shared in.
- `?t=512` may be added to a chapter URL to open at a time in seconds.

Unknown routes and unknown slugs show a "not found" screen with a link to the chapter explorer.

Hosting needs no rewrite rules because every route is a real prerendered file.

Keep URLs simple.
---

# 71. ACCESSIBILITY

Required:

- Semantic HTML
- Keyboard navigation
- ARIA labels
- Visible focus
- Screen-reader support
- High contrast
- Reduced motion
- Subtitle toggle
- Full transcript
- Proper heading hierarchy

Audio controls must be accessible.

Specifics:

- Subtitles are not announced through a live region; screen-reader users are already hearing the narration.
- Transcript, sources, and chapter panels are real dialogs: focus moves in, is trapped, and returns on close.
- The progress bar is a native range input or a slider with full ARIA and keyboard support.
- Every visual has alt text in both languages (section 32).
- Interface text is fully translated; Bengali pages use Bengali numerals consistently or Latin numerals consistently, as set in the glossary.
---

# 72. PERFORMANCE

Target:

```text
Lighthouse Performance: 90+
Lighthouse Accessibility: 95+
```

Optimize:

- WebP/AVIF
- Lazy-loaded visuals
- Minimal JS
- No unnecessary dependencies
- Preload only active audio
- Optionally preload next chapter
- Minimal DOM
- CSS transforms for animation
---

# 73. AUDIO LOADING

Do not load every chapter's audio.

Load only:

- Current chapter

Optionally preload:

- Next chapter

when bandwidth allows.
---

# 74. IMAGE LOADING

Load:

- Current visual
- Next visual where useful

Do not load the entire visual library at startup.
---

# 75. ERROR HANDLING

Handle:

- Missing audio
- Failed image
- Invalid chapter
- Invalid subtitle data
- Browser audio restrictions
- Network errors
- Unsupported media

Example:

```text
Unable to load this chapter.

Please try again.
```

Never leave the interface in a broken state.

Also handle:

- Autoplay blocked: never try to play without a user gesture; show the play button.
- Audio stalls or the network drops mid-chapter: keep the position, show a quiet "reconnecting" state, resume when possible.
- Chapter content JSON fails validation: show the error message, do not render partial data.
- A failed image keeps the previous visual on screen; it never shows a broken image.
---

# 76. BROWSER SUPPORT

Support current:

- Chrome
- Edge
- Firefox
- Safari
- iOS Safari
- Android Chrome

Mobile is a primary target.
---

# 77. RESPONSIVE BREAKPOINTS

```text
Mobile:
≤ 640px

Tablet:
641-1024px

Desktop:
> 1024px
```

Mobile-first design.
---

# 78. MOBILE UX

The application should feel like a dedicated audiobook player on mobile.

Priorities:

1. Play/pause
2. Seek
3. Subtitle
4. Current chapter
5. Language
6. Chapter navigation

Avoid tiny controls.
---

# 79. PRIVACY

MVP should require no account.

Do not collect unnecessary personal information.

Playback progress remains local.

Avoid invasive analytics.

No advertising.

No tracking by default.
---

# 80. ANALYTICS

MVP can ship without analytics.

If analytics is eventually added, only track anonymous events such as:

```text
chapter_started
chapter_completed
playback_started
language_changed
```

Do not collect unnecessary personal information.
---

# 81. MONETIZATION

Do not monetize MVP.

Possible future options:

- Donations
- Supporter memberships
- Sponsorship

Never interrupt narration with advertisements.

The core listening experience should remain free if possible.
---

# 82. CONTENT CORRECTIONS

Future feature:

"Report a source/content issue"

For MVP this may simply open a contact mechanism.

Do not build public comments.

Do not turn the project into a social platform.
---

# 83. DEVELOPMENT PHASES

## Phase 0 -- Research

Deliver:

```text
sources/
chronology.md
glossary.md
visual-guidelines.md
content-guidelines.md
```

Goal:

Establish a trustworthy content foundation.

## Phase 1 -- Audio Player Prototype

Build:

- Vite
- TypeScript
- HTML
- CSS
- Native audio
- One chapter
- One language
- Basic subtitles
- Basic visual timeline

Goal:

Prove the listening experience.

## Phase 2 -- Full Bilingual Support

Add:

- English
- Bengali
- Language switching
- Dual subtitle datasets
- Dual narration

## Phase 3 -- Chapter System

Implement:

- Parts
- Chapters
- Progress
- Navigation
- Transcript
- Sources

## Phase 4 -- Visual System

Implement:

- Visual timeline
- Crossfades
- Ken Burns
- Maps
- Environmental scenes
- Reduced motion support

## Phase 5 -- PWA

Implement:

- Manifest
- Service worker
- Offline shell
- Install experience

## Phase 6 -- Polish

Improve:

- Typography
- Mobile UX
- Accessibility
- Performance
- Audio quality
- Visual consistency
- Transitions

## Phase order

Phase 0 and Phase 1 run in parallel. The player is built against mock data that is clearly labelled as placeholder and contains no religious claims. No real chapter content enters the app until it has passed the publish gate (section 5.8).

Sleep timer and offline audio (sections 51 and 53) are post-MVP and belong to none of the phases above.
---

# 84. TESTING

## Unit tests

Test:

- Timeline calculations
- Subtitle lookup
- Visual lookup
- Playback state
- localStorage
- Chapter navigation
- Language switching

## Manual tests

Test:

- Android Chrome
- iOS Safari
- Desktop Chrome
- Firefox
- Safari
- Slow network
- Offline shell
- Reduced motion
- Keyboard navigation

Also unit test:

- Resolving visual cues to segments for each language
- Scene-based position mapping on language switch
- Stored-state migration and corrupted-storage recovery
- Content validation: the build fails on an unverified claim, a missing reference, a subtitle that does not match the script, or scene ids that differ between languages
---

# 85. CONTENT QA

Every chapter must pass:

## Historical QA

- [ ] Sources verified
- [ ] Chronology checked
- [ ] Weak reports identified
- [ ] Disputed claims handled appropriately
- [ ] Arabic terminology reviewed
- [ ] Every claim in the ledger graded and verified by a human against the source text
- [ ] Every reference exact (numbers, numbering scheme, edition, page)
- [ ] Grade C reports narrated with attribution
- [ ] Quotations checked word for word
- [ ] No invented dialogue, thoughts, or scenes
- [ ] Historical reviewer sign-off recorded

## Religious / Visual QA

- [ ] Prophet not depicted
- [ ] No identifiable historical faces
- [ ] No invented portraits
- [ ] No inappropriate visual dramatization
- [ ] No fictional scenes presented as historical
- [ ] Nothing of the unseen depicted
- [ ] No anachronistic buildings or objects
- [ ] Every image individually approved and logged in the visual manifest

## Language QA

- [ ] English reviewed
- [ ] Bengali reviewed
- [ ] Names consistent
- [ ] Terminology consistent
- [ ] Narration natural when spoken
- [ ] English and Bengali scripts carry the same claims
- [ ] Bengali reviewer sign-off recorded

## Audio QA

- [ ] Correct narrator
- [ ] Correct language
- [ ] Clean recording
- [ ] No clipping
- [ ] Consistent volume
- [ ] No unnecessary music
- [ ] Natural sound only where justified
- [ ] Recording matches the signed-off script word for word
- [ ] Names and Arabic terms pronounced correctly

## Subtitle QA

- [ ] Complete
- [ ] Correct
- [ ] Properly synchronized
- [ ] No spelling errors
- [ ] Correct language
---

# 86. MVP DEFINITION OF DONE

MVP is complete when:

- [ ] Home page works
- [ ] English works
- [ ] Bengali works
- [ ] Three complete chapters exist
- [ ] Male narration works
- [ ] Audio player works
- [ ] Subtitles synchronize
- [ ] Visual timeline works
- [ ] Language switching works
- [ ] Chapter navigation works
- [ ] Progress persists
- [ ] Mobile experience works
- [ ] Desktop experience works
- [ ] PWA installs
- [ ] Sources are visible, with exact references
- [ ] All three chapters pass the publish gate (section 5.8)
- [ ] Both reviewers have signed off each chapter
- [ ] Language switching keeps the story position
- [ ] Lock-screen controls work on iOS and Android
- [ ] Shared chapter links show correct title and image previews
- [ ] Visual rules are enforced
- [ ] Accessibility basics pass
- [ ] No backend is required
- [ ] No music is used
- [ ] Natural sound is used only when necessary
---

# 87. RECOMMENDED FIRST THREE CHAPTERS

Chapter numbers below are the canonical numbers from section 22.

## Chapter 01 -- Arabia Before Islam

Visual opportunities:

- Arabian landscape
- Makkah valley
- Mountains
- Ka'bah environment
- Trade routes
- Desert
- Ancient marketplace environment
- Night sky

Audio:

Mostly narration.

Optional subtle environmental ambience.

## Chapter 03 -- The Birth of Muhammad ﷺ

Visual opportunities:

- Makkah
- Mountains
- Ancient homes
- Desert dawn
- Quiet streets
- Night sky
- Architectural details

Do not show the infant or his mother as identifiable people.

Use environmental storytelling.

## Chapter 07 -- The First Revelation

Visual opportunities:

- Mount Hira
- Cave entrance
- Night sky
- Moonlight
- Makkah from a distance
- Dawn

Do not depict:

- Muhammad ﷺ
- Jibril عليه السلام
- Any supernatural figure

The narration carries the event.

Audio should preferably be:

Voice + silence

with optional extremely subtle natural night/desert ambience.
---

# 88. PROJECT CONTENT PIPELINE

```text
                   RESEARCH
                       │
                       ▼
             SOURCE VERIFICATION
                       │
                       ▼
                CHAPTER OUTLINE
                       │
                       ▼
              ORIGINAL SCRIPT
                       │
              ┌────────┴────────┐
              ▼                 ▼
          ENGLISH            BENGALI
          SCRIPT             SCRIPT
              │                 │
              └────────┬────────┘
                       ▼
                 CONTENT REVIEW
                       │
                       ▼
                   NARRATION
                       │
                       ▼
                 AUDIO CLEANUP
                       │
                       ▼
                SUBTITLE TIMING
                       │
                       ▼
                VISUAL STORYBOARD
                       │
                       ▼
                VISUAL CREATION
                       │
                       ▼
               AUDIO/VISUAL SYNC
                       │
                       ▼
                      QA
                       │
                       ▼
                    PUBLISH
```
---

# 89. COMPLETE SYSTEM ARCHITECTURE

```text
                         USER
                           │
                           ▼
                ┌─────────────────────┐
                │      SĪRAH APP      │
                │                     │
                │ Vite + TypeScript   │
                │ HTML + CSS          │
                └──────────┬──────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
     AUDIO             TIMELINE           VISUALS
        │                  │                  │
        │                  │                  │
        ▼                  ▼                  ▼
 English/Bengali      Subtitles          Images
 Narration            Transcript         Maps
                      Progress           Environment
                                         Natural ambience
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                           ▼
                 IMMERSIVE EXPERIENCE
```
---

# 90. CORE TECHNICAL PRINCIPLE

The application should remain small.

Avoid:

- React
- Vue
- Large UI libraries
- State management libraries
- Backend frameworks
- Unnecessary dependencies
- Over-engineered architecture

Prefer:

- Native DOM
- Native HTML Audio
- TypeScript
- CSS
- JSON/static TypeScript data
- Browser APIs

The project should feel like a carefully engineered small application.
---

# 91. CLAUDE IMPLEMENTATION INSTRUCTIONS

When implementing this project:

1. Do NOT immediately generate all 37 chapters.
2. First create the application architecture.
3. Create content schemas.
4. Create the research/content folder structure.
5. Build the audio player using mock data.
6. Implement one complete chapter.
7. Implement subtitle synchronization.
8. Implement visual synchronization.
9. Implement persistent playback.
10. Implement bilingual switching.
11. Test mobile UX.
12. Test accessibility.
13. Test performance.
14. Only then expand to the remaining chapters.

Do not introduce React or another frontend framework.

Keep dependencies minimal.

Do not create unnecessary abstractions.

Prefer readable TypeScript.
---

# 92. IMPORTANT CONTENT RULE

Never sacrifice accuracy for storytelling.

If a detail is uncertain:

Do not invent it.

If a detail is disputed:

Do not silently present one version as certain.

If a source is weak:

Do not present it as established fact.

If a visual cannot be historically verified:

Treat it as an artistic reconstruction.

If a historical person's appearance is unknown:

Do not invent a face.
---

# 93. IMPORTANT AUDIO RULE

The project is NOT a music project.

Default:

Narration + silence.

Optional:

Narration + very subtle natural environmental sound.

Never:

Narration + background music.

Never add music merely because a scene feels "too empty."

Silence is intentional.
---

# 94. IMPORTANT VISUAL RULE

The project is NOT a historical portrait generator.

Never attempt to show what historical personalities "looked like."

Never depict Prophet Muhammad ﷺ.

Never depict identifiable faces of historical personalities.

Prefer:

- Landscape
- Architecture
- Objects
- Maps
- Silhouettes
- Back-facing anonymous figures
- Environmental storytelling
---

# 95. FINAL EXPERIENCE

The ideal user journey is:

```text
OPEN SĪRAH
      │
      ▼
Choose English / বাংলা
      │
      ▼
Begin Listening
      │
      ▼
Calm male narration
      │
      ├───────────────┐
      │               │
      ▼               ▼
Subtitles          Visuals
      │               │
      └───────┬───────┘
              ▼
       Historical story
              │
              ▼
        Source references
              │
              ▼
       Continue next chapter
```

The technology should disappear.

The listener should feel that they are quietly moving through the chronology of the Seerah.
---

# 96. DEFINITION OF THE PRODUCT

SĪRAH ﷺ is:

> A bilingual, source-conscious, immersive audio journey through the life of Prophet Muhammad ﷺ, using natural male narration, synchronized subtitles, atmospheric historical environments, and restrained natural sound -- without depicting the Prophet ﷺ, without creating identifiable historical portraits, and without unnecessary music.

The goal is not to make the Seerah "cinematic."

The goal is to make the Seerah beautiful to listen to, easy to follow, respectful, accessible, and memorable.
---

# 97. OPEN DECISIONS

These cannot be settled by the specification. Each needs an owner's decision before the work that depends on it.

| # | Decision | Blocks |
|---|----------|--------|
| 1 | Who is the historical reviewer (hadith and Seerah qualified)? | Any real chapter content |
| 2 | Who is the Bengali reviewer? | Any Bengali content |
| 3 | Narration: human narrator or synthetic voice, per language? Natural male Bengali synthetic voice quality must be auditioned before committing. A synthetic voice must also be checked for Arabic name pronunciation | Audio production |
| 4 | Which edition of Ar-Raheeq Al-Makhtum (English and Arabic) is the project's reference copy for page numbers? | Reference format |
| 5 | Which hadith numbering scheme is the project standard? | Reference format |
| 6 | Which Qur'an translation is quoted in each language, and is its license compatible? Or paraphrase only? | Scripts |
| 7 | How are subtitles timed: forced alignment tool, or by hand? | Subtitle production |
| 8 | Image generation tool, and who approves images? | Visual production |
| 9 | Fonts for headings, interface, Bengali, and Arabic | Design |
| 10 | Audio hosting: static host or object storage/CDN | Deployment |
| 11 | Contact mechanism for content corrections | About / Sources pages |

Until decisions 1 and 2 are made, the application is built and tested with placeholder content only.
