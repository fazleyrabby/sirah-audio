# Gemini chapter audio — production plan (2026-10-03)

## Agreed order

1. Generate English preview audio for chapters 01–37.
2. Check pronunciation and completeness, align subtitles, then replace the three rejected Kokoro English recordings.
3. Generate Bengali preview audio for chapters 01–37 using the voice heard in the Bengali auditions.
4. Check Bengali speech and completeness, align subtitles, then add Bengali audio to the app.

No music or other sound layer. Scripts and claim statuses remain unchanged by audio production. These files remain previews until the qualified historical and native Bengali reviews are complete.

## Prepared locally

`tools/prepare_gemini_audio.py` made 205 scene requests per language from the original scripts: 132,929 English characters and 125,303 Bengali characters after expanding the honorific. Scene grouping preserves natural pacing better than synthesising each subtitle line separately. It does not use the Kokoro pronunciation substitutions. Request files are in ignored `.tools/gemini/prepared/`; no content was sent by preparation.

`tools/gemini_generate_scenes.py` is a resumable sender. It needs explicit `--send` and `--free-tier-confirmed` flags, records each scene's reported token usage, and allows no more than 10 new requests per run. The flag means the operator has checked Google AI Studio for that day's run; the script cannot query billing status itself. It has only been run without `--send` so far.

## Free-tier production constraint

The owner requires **$0 total**. The configured API key (suffix `Ib4s`) belongs to the Default Gemini Project, which Google AI Studio showed as **Free tier** on 2026-10-03. AI Studio showed a Gemini 3.8 Flash TTS limit of **10 requests per day**, with the recent peak at 10/10 and a rate-limit banner. The 205 prepared scenes per language therefore need at least 41 quota days in sequence, plus retries. Google says daily quotas reset at midnight Pacific time, and actual limits can change. Check the project tier before every day's run, stop if it is no longer Free tier, and never set up billing for this work.

Free-tier requests send script text to Google, and Google's pricing page says Free-tier content may be used to improve its products. The full scripts must not be sent until the owner explicitly approves that data transfer. If the daily quota is exhausted, wait for its reset rather than switching to a paid project or model.

## Release gates

- Listen to the English name-rich audio for Allah, Muhammad, Makkah, Qur'an, Musa, Jibril, Aishah, and Khadijah. The short auditions have not yet been approved for Arabic pronunciation.
- Check each generated scene against its transcript. The TTS model can skip or alter words.
- Align all 1,996 subtitle segments per language to the audio; approximate character timing is not acceptable for final playback.
- Recheck the 12 remaining no-claim paragraphs in each language and review source and Bengali wording issues listed in `content/authenticity-audit.md`. No claim status changes without a qualified human reviewer. The full files stay previews until sign-off.
- Only then integrate and release the chapter MP3s and timings. Regenerated audio after corrections needs a new chapter version to avoid stale caching.
