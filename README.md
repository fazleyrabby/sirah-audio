# Sīrah ﷺ

A bilingual, source-conscious audio journey through the life of Prophet Muhammad ﷺ.
Vite + TypeScript, no framework, no backend. Full specification: [SPEC.md](SPEC.md).

## Run

```sh
npm install
npm run dev        # builds content, starts the dev server
npm test           # unit tests
npm run build      # content gate + typecheck + build + static pages + service worker -> dist/
npm run preview    # serve dist/
```

Set `SITE_URL=https://your-domain` when building for production so canonical and
share-preview URLs are absolute.

## Content

Everything the app plays is built from `content/`:

| File | Purpose |
|------|---------|
| `content/chapters.json` | The 37 chapters: slug, part, titles, descriptions |
| `content/chapters/NN-slug/script-en.md` | Narration script, one line per subtitle |
| `content/chapters/NN-slug/claims.json` | Claim ledger: every fact, its grade, sources, verification status |
| `content/chapters/NN-slug/sources.json` | Exact references |
| `content/chapters/NN-slug/chapter.json` | `status` (`preview` or `published`), `version`, cover image |
| `content/narration.json` | Voice, speed, pauses, pronunciation respellings |

`npm run content` validates all of it and fails on a paragraph without a claim id, an unknown
claim or source, a missing image, or a `published` chapter with any unverified claim.

### Review workflow

Chapters start as `preview` and show a notice that their references await review. To publish:

1. A qualified reviewer checks each entry in `claims.json` against the source text and sets
   `status` to `verified` (with `verifiedBy`, `verifiedOn`), or `rejected`.
2. Final page and hadith numbers go into `sources.json`.
3. Sign-off is recorded in `review.md` in the chapter folder.
4. `chapter.json` status becomes `published`. The build now enforces the gate.

Any script change after sign-off needs re-review and re-narration.

## Narration

Narration runs locally with the Kokoro neural voice (no account, no API cost).

```sh
# one-time setup
uv venv --python 3.12 .tools/venv
uv pip install --python .tools/venv/bin/python kokoro-onnx soundfile numpy
curl -L -o .tools/models/kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -L -o .tools/models/voices-v1.0.bin  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin

npm run narrate    # narrates chapters whose script or voice changed
```

`tools/narrate.py` synthesises each line, joins them with natural pauses, normalises to
-16 LUFS and writes the MP3 plus `timings-en.json`. Subtitle timings come from the audio
itself, so they are exact.

Change the voice in `content/narration.json` (`voice`, `speed`, or a blend such as
`"am_michael:0.6,bm_george:0.4"`). Audition clips are in `samples/`. If a name is
mispronounced, add a respelling under `pronunciation`.

## Visuals

`node scripts/make-visuals.ts` generates the landscape scenes and the map in
`public/images/`. Scenes contain land, sky, buildings and maps only: no figures, no faces
(SPEC 7-13, 36).
