# Handover: Sīrah ﷺ audio project

Paste everything below into a new agent session opened in `/Users/rabbi/Desktop/Projects/sirah-audio`.

---

You are continuing work on **Sīrah ﷺ**, a bilingual (English + Bengali) audio journey through the life of
Prophet Muhammad ﷺ. Vite + TypeScript, no framework, no backend. Read `SPEC.md` (the full specification,
v1.1), `README.md` and `content/verification-log.md` before changing anything.

## Non-negotiable rules (from the owner)

1. **Authenticity.** Nothing is narrated as fact without a source. Never invent dialogue, thoughts or scenes.
   Weak or unestablished reports are left out or named as unestablished. Every claim in `claims.json` stays
   `"status": "unverified"` — **you must never mark a claim `verified`**; only a qualified human reviewer does
   that. Hadith numbers, grades and wordings you produce from memory are unverified.
2. **No depiction** of the Prophet ﷺ, any Companion, any named historical person, or anything of the unseen.
   Visuals are landscapes, buildings, sky and maps only.
3. **No music.** Voice and silence.
4. **Voice** must be a natural, relaxing male voice, not robotic, with Arabic words pronounced properly.
5. Do not spend the owner's API keys (OpenAI, Gemini are in the environment) or send content to external
   services without asking first.
6. Do not commit unless asked.

## Current state (2026-10-03)

- **App**: complete and working. Home, chapter explorer, listening screen (synced subtitles and visuals,
  transcript, sources, speed, resume, media session), reading view for chapters without audio, sources and
  about pages, PWA shell, prerendered pages, visit counter in the footer (`src/visits/visitor-counter.ts`,
  the owner's shared views service, project id `sirah-audio`).
  `npm run build` passes; `npm test` passes (29 tests).
- **Text**: all 37 chapters are written in **English and Bengali** (`content/chapters/NN-slug/script-en.md`,
  `script-bn.md`), each with `claims.json`, `sources.json`, `chapter.json` (`status: "preview"`).
  The build enforces that both languages share the same scene ids and claim ids.
- **Audio**: only chapters 1, 3 and 7 are narrated, in English, with the local Kokoro voice
  (`tools/narrate.py`, config in `content/narration.json`). The owner rejected the pronunciation:
  "Allah" comes out as "AL-uh", "Muhammad" as "muh-HAM-id", "Musa" as "MYOO-sa". Respelling cannot fix it.
  There is no Bengali audio and Kokoro has no Bengali voice.
- **Not committed**: chapters 8-37 (both languages), the visit counter, `tools/bn_images.py`,
  `tools/mark_narration.py`, this file.

## How the content pipeline works

- Script format: `## s01 -- Title`, then `Image: path | effect | alt | offset | position`, `Audio:` line,
  then narration, **one line per subtitle**, blank line between paragraphs. Each paragraph ends with its
  claim ids in a comment (`<!-- c07-012 -->`), or `<!-- n -->` for narration with no factual claim.
- `npm run content` validates everything and writes what the app loads. It fails on a paragraph without a
  marker, an unknown claim or source, a missing image, or language mismatch.
- `tools/refcheck.py` looks up hadith (Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasa'i, Ibn Majah) and Qur'an
  verses in local datasets (`.tools/hadith/`). **Look references up before writing or changing a script**, and
  record what was and was not checked in `content/verification-log.md`. The Muslim dataset is not numbered
  by the Abd al-Baqi scheme; search it by text.
- `tools/bn_images.py <chapter dirs>` copies Image/Audio lines from the English script into a Bengali script
  written with headings and narration only.
- `npm run narrate` synthesises audio and exact subtitle timings for chapters whose script or voice changed.

## Environment quirks

- `tr` is aliased to `tree` in the owner's shell; use `sed` or Python. Use `/bin/ls`.
- Port 4173 belongs to another project of the owner; use another port and never kill what is on it.
- Headless Chrome CLI screenshots are unreliable below ~500px wide; drive Chrome over CDP for mobile checks.
- Disk has about 14 GB free; avoid large model downloads without need.

## What to do next (in this order unless the owner says otherwise)

1. **Fix the voice.** Present the owner with audition clips before narrating everything. Options, cheapest first:
   a. Keep Kokoro and add an **IPA lexicon** for Arabic words, applied in `tools/narrate.py` by phonemizing
      the surrounding text and splicing in the lexicon entry, then calling
      `kokoro.create(phonemes, ..., is_phonemes=True)`. Example entries: Allah `ʌlˈlɑːh`, Muhammad `mʊhˈʌmmʌd`,
      Makkah `mˈækkʌ`, Qur'an `kʊɹˈɑːn`, Musa `mˈuːsɑː`. An English voice still cannot produce ح ع ق خ.
   b. A hosted multilingual voice with pronunciation dictionaries or SSML phonemes (needs the owner's
      approval: cost, and scripts leave the machine).
   c. A human narrator who reads Arabic names natively. Best result, and the only good option for Bengali.
   Include the lexicon in the cache key and in the "up to date" check so audio regenerates when it changes.
2. **Bengali audio**: needs a decision from the owner (human narrator, or a Bengali-capable TTS).
3. **Review pass**: the open points listed at the end of `content/verification-log.md` (for example the
   placement of the al-Hazwarah words in chapter 19, the timing of the supplication in chapter 25, the
   missing Tabuk chapter). Bengali wording has not been reviewed by a native reviewer.
4. Chapters are short (about 5-8 minutes each against a target of 8-15). Lengthen only with sourced material.
5. Visuals are stylised generated SVG landscapes (`scripts/make-visuals.ts`), not final artwork.

Start by running `npm install`, `npm run content`, `npm test`, and reading one chapter folder end to end
(for example `content/chapters/19-the-night-of-hijrah/`) to see the conventions.
