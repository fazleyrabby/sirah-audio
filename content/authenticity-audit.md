# Authenticity audit — working review (2026-10-03)

**Publication status: NOT CLEARED.** This document records mechanical and targeted textual checks. It is not a scholarly authentication or native Bengali review. Every claim in `claims.json` remains `unverified`.

## Coverage

- 37 chapters have English and Bengali scripts. `npm run content` passes.
- 475 claim records: 304 grade A/B and 171 grade C/X. The grades are editorial classifications, not reviewer verification.
- 347 source records. All 281 numbered Bukhari, Tirmidhi, Abu Dawud, Ibn Majah, and Qur'an references checked in the local datasets resolve to an entry or verse. Missing: 0.
- 12 English paragraphs still carry `<!-- n -->`; they are transitions, framing, or a closing prayer. A human editor must confirm none hides a factual assertion. The content build checks marker presence, not semantics.
- Sahih Muslim uses different numbering in the local dataset; the cited Abd al-Baqi numbers have **not** all been checked. Musnad Ahmad and the Seerah book references have no local primary text or edition/page-level check.

## Chapter inventory

| Chapter | Claims | A/B | C/X | English `n` paragraphs |
|---|---:|---:|---:|---:|
| 01-arabia-before-islam | 27 | 15 | 12 | 3 |
| 02-the-lineage | 20 | 8 | 12 | 0 |
| 03-the-birth | 17 | 6 | 11 | 1 |
| 04-early-childhood | 11 | 3 | 8 | 0 |
| 05-his-youth | 11 | 3 | 8 | 0 |
| 06-khadijah | 17 | 8 | 9 | 0 |
| 07-the-first-revelation | 18 | 15 | 3 | 0 |
| 08-the-beginning-of-prophethood | 10 | 7 | 3 | 1 |
| 09-the-first-believers | 11 | 7 | 4 | 1 |
| 10-the-call-becomes-public | 12 | 9 | 3 | 1 |
| 11-persecution-in-makkah | 12 | 9 | 3 | 0 |
| 12-migration-to-abyssinia | 15 | 5 | 10 | 0 |
| 13-the-boycott | 8 | 1 | 7 | 0 |
| 14-the-year-of-sorrow | 12 | 6 | 6 | 0 |
| 15-taif | 11 | 3 | 8 | 0 |
| 16-al-isra-wal-miraj | 10 | 6 | 4 | 0 |
| 17-the-pledges-of-aqabah | 12 | 5 | 7 | 0 |
| 18-the-decision-to-leave-makkah | 10 | 5 | 5 | 0 |
| 19-the-night-of-hijrah | 9 | 4 | 5 | 0 |
| 20-cave-thawr | 8 | 6 | 2 | 0 |
| 21-the-journey | 8 | 8 | 0 | 0 |
| 22-arrival-in-madinah | 12 | 10 | 2 | 1 |
| 23-building-the-community | 12 | 12 | 0 | 0 |
| 24-the-community-order | 11 | 6 | 5 | 1 |
| 25-badr | 20 | 12 | 8 | 0 |
| 26-uhud | 18 | 14 | 4 | 0 |
| 27-the-trench | 14 | 10 | 4 | 0 |
| 28-hudaybiyyah | 17 | 15 | 2 | 0 |
| 29-khaybar | 10 | 7 | 3 | 0 |
| 30-letters-to-rulers | 10 | 8 | 2 | 0 |
| 31-the-conquest-of-makkah | 15 | 11 | 4 | 0 |
| 32-hunayn | 9 | 6 | 3 | 0 |
| 33-the-delegations | 9 | 8 | 1 | 1 |
| 34-the-farewell-hajj | 9 | 9 | 0 | 0 |
| 35-the-final-days | 11 | 10 | 1 | 0 |
| 36-the-passing-of-the-messenger | 13 | 11 | 2 | 0 |
| 37-his-legacy | 16 | 16 | 0 | 2 |

## Confirmed corrections in this pass

- Chapter 19: removed an al-Hazwarah quotation from the Hijrah-night scene. [Tirmidhi 3925](https://sunnah.com/tirmidhi/49/325) records the words but does not date the occasion. The previous placement implied a date the report does not give. Adjusted the fifty-three-years wording to account for time outside Makkah in infancy.
- Chapter 25: changed the scene title and wording in both languages. [Muslim 1763](https://sunnah.com/muslim/32/69) explicitly puts the supplication on the day of Badr.
- Chapter 30: removed an unsupported statement that the truce opened the roads for all letters. Bukhari 7 places the Heraclius letter during the truce; [Muslim 1774a](https://sunnah.com/muslim:1774a) names the rulers addressed.
- [Muslim 2856b](https://sunnah.com/muslim/53/61-62) supports the sa'ibah report in chapter 1; the specific numbering was checked on Sunnah.com.

## Blocking review work

1. Recheck the remaining `<!-- n -->` paragraphs to confirm they are purely editorial. Factual passages previously marked `n` were linked to existing claims, rewritten, or removed in both languages; Khabbab’s trade now has a new Bukhari-backed claim.
2. Compare each of the grade C Seerah reports with a specified edition and page of *Ar-Raheeq Al-Makhtum* or an earlier source. The current generic `raheeq` citations cannot independently authenticate the details.
3. Check every Muslim citation against the cited numbering and full text. Check Musnad Ahmad numbers and grading against a chosen edition.
4. Check all Qur'an paraphrases against the Arabic and a reviewed English and Bengali rendering, including context. Verse-number existence alone does not establish paraphrase accuracy.
5. Review the full English and Bengali scripts line by line for omissions, chronology, direct speech, transliteration, and Bengali idiom. The machine only checks shared scene and claim IDs.
6. Resolve the outstanding points in `content/verification-log.md`, including Tabuk coverage and passages based on incomplete hadith extracts.
7. Obtain qualified historical and native Bengali sign-off before any claim status changes or final narration. This audit has changed no claim status.
