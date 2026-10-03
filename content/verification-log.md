# Verification log

Machine checks of references. These do **not** replace the historical reviewer's sign-off
(SPEC 5.6, 5.9): claims stay `unverified` in each `claims.json` until a qualified person confirms them.

## 2026-10-03 -- chapters 01, 03, 07 (English)

Method: each cited hadith was fetched by number from the open dataset `fawazahmed0/hadith-api`
(English editions) and its text compared with the claim it supports. sunnah.com could not be
fetched (HTTP 403).

| Source | Result |
|--------|--------|
| Sahih al-Bukhari 3 | Number and content match (true dreams, Hira, three pressings, Khadijah's reply, Waraqah). This route quotes 96:1-3 only |
| Sahih al-Bukhari 4 | Match (voice from the sky, angel on a chair between sky and earth, 74:1-5, revelation then continuous) |
| Sahih al-Bukhari 3902 | Match (revelation began at the age of forty) |
| Sahih al-Bukhari 3521 | Match (Amr ibn Amir ibn Luhayy al-Khuza'i, first to institute the sa'ibah) |
| Sahih al-Bukhari 4287 | Match (360 idols around the Ka'bah at the conquest) |
| Sahih al-Bukhari 3826 | Match (Zayd ibn Amr refused meat slaughtered for idols) |
| Sahih al-Bukhari 3827 | Match (Zayd sought the religion of Ibrahim) |
| Sahih al-Bukhari 3828 | Match (Asma's report; Zayd saved infant girls) |
| Sahih al-Bukhari 5101 | Match (Thuwaybah nursed him) |
| Jami' at-Tirmidhi 3619 | Match (born in the Year of the Elephant). Grading differs: da'if isnad (al-Albani, Ahmad Shakir), sahih (Zubair Ali Zai). Narrated as a Seerah report, grade C |
| Sahih Muslim 160, 161, 162, 1162, 2276, 1781 | **Content found** in the Sahih Muslim dataset by text search (first revelation, Jabir's narration, opening of the chest, born on Monday, Kinanah/Quraysh/Hashim, 360 idols). The Abd al-Baqi **numbers** cited are from memory and not machine-checked: the dataset uses a different numbering |
| Sahih Muslim 2856 (Amr ibn Luhayy) | **Not found** by text search; still to check |
| Bukhari lineage heading | **Not checked** |
| Qur'an references | **Not checked** against a mushaf source |
| Ar-Raheeq Al-Makhtum | **Not checked**; no reference edition chosen yet (SPEC 97, decision 4) |

## 2026-10-03 -- chapter 02 (English and Bengali)

| Source | Result |
|--------|--------|
| Sahih al-Bukhari 3364 | Match (Hajar and Ismail in the valley, her question, Safa and Marwah seven times, the angel at Zamzam, Jurhum and the bird, Ismail learning Arabic and marrying among them, raising the foundations) |
| Sahih al-Bukhari 3507 | Match ("O children of Ismail, shoot, for your father was an archer") |
| Sahih al-Bukhari 4315 | Match ("I am the Prophet, no lie; I am the son of Abd al-Muttalib") |
| Sahih al-Bukhari 7 | Match (Heraclius asks about his lineage; noble family; messengers come from noble families) |
| Qur'an 2:127, 14:37, 33:40, 106:1-4 | Verse content checked against Arabic, Saheeh International and Muhiuddin Khan (Bengali) in the quran-api dataset |
| Lineage chain of 21 names | **Not checked**; from memory of Ar-Raheeq and al-Bukhari's chapter heading |
| Bengali scripts for chapters 01, 02, 03, 07 | Same scene ids and claim ids as English (enforced by the build). Wording awaits the Bengali reviewer |

## 2026-10-03 -- chapters 04, 05, 06 (English and Bengali)

| Source | Result |
|--------|--------|
| Sahih Muslim 162 (opening of the chest) | Content match in the dataset, including "I saw the marks of the needle on his breast". Abd al-Baqi number from memory |
| Sahih Muslim 976 (visit to his mother's grave) | Content match. Number from memory. The part about seeking forgiveness is not narrated; flagged for the reviewer |
| Sahih al-Bukhari 2262 | Match (every prophet tended sheep; he tended them for the people of Makkah for qirats) |
| Sahih al-Bukhari 4770 | Match (Safa: "we have not found you telling anything other than the truth") |
| Sahih al-Bukhari 7 | Match (Heraclius: had they accused him of lying before his claim; "No") |
| Jami' at-Tirmidhi 3620 (Bahira) | Found. Graded munkar (al-Albani, Ahmad Shakir), da'if (Zubair Ali Zai). **Excluded from narration**; the script only says the story exists |
| Sahih al-Bukhari 1582, 364 | Match (carrying stones for the Ka'bah, the waist-cloth) |
| Sahih al-Bukhari 3815, 3818, 3820 | Match (best of women; Aishah on Khadijah, "from her I had children"; greeting from her Lord and the house in Paradise) |
| Sahih al-Bukhari 4782, Qur'an 33:5 | Match (Zayd ibn Muhammad until the verse was revealed) |
| Sahih Muslim 2436 (did not marry another while she lived) | Content match. Number from memory |
| Qur'an 93:6-8 | Verse content checked |
| Hilf al-Fudul saying, Black Stone arbitration | **Not checked**; narrated as Seerah reports. Graded references (Musnad Ahmad) to be added by the reviewer |

## 2026-10-03 -- chapters 08 to 37 (English only)

Method as above: each hadith cited from al-Bukhari, Ibn Majah, at-Tirmidhi and Abu Dawud was fetched by
number from the dataset and compared with the script before or while the chapter was written. Sahih Muslim
was searched by text. Each claim's `notes` field in `claims.json` says whether it was machine-checked or
written from memory.

| Area | Result |
|------|--------|
| Sahih al-Bukhari, all numbers cited in chapters 08-37 | Number and opening text match. Long narrations (3905, 3906, 3911, 2731, 4280, 4043, 3668) were read in full |
| Later parts of long narrations | Where the lookup was truncated, the remainder was written from memory and is marked so in the claim notes (for example 3861, 3887, 4330, 4210, 4372, 4449, 4454, 3654) |
| Sahih Muslim (832, 162, 2797, 1763, 1779, 1788, 1218, 1297, 2450, 2435, 746, 1780) | Content found by text search. Abd al-Baqi numbers are from memory; Muslim 1774 was not searched |
| Ibn Majah 150, Tirmidhi 3681, 3925, 2485, 3618, 3895, Abu Dawud 499, 4734, 3141 | Match, with the gradings recorded in each `sources.json` |
| Musnad Ahmad (1740 Umm Salamah on Abyssinia; 14456 Jabir on the second pledge; 2216 captives of Badr) | **Not checked**: not in the datasets. Numbers and gradings from memory. Narrated at grade C with attribution |
| Qur'an verses | A sample was checked against the dataset; the rest are **not checked**. All English renderings are paraphrases of meaning |
| Seerah reports (grade C) | **Not checked**; from memory of Ar-Raheeq and Ibn Hisham |

Reports deliberately left out or named as unestablished: "the sun in my right hand" (ch. 10), the detailed
stories of Umar's conversion (ch. 12), the supplication at Ta'if (ch. 15), the spider and the doves (ch. 20),
Umm Ma'bad (ch. 21), "Tala'a al-badru" (ch. 22), "Go, for you are free" (ch. 31).

Open points for the reviewer, also flagged in the claim notes:

- Chapter 19: the words at al-Hazwarah may belong to the conquest of Makkah, not the night of Hijrah.
- Chapter 25: the supplication is placed "the night before"; the narration says the day of Badr.
- Chapter 27: the content of Sa'd ibn Mu'adh's judgement on Banu Qurayzah is not stated.
- Chapter 29: the later fate of the woman who poisoned the sheep is not stated.
- Chapter 31: the few individuals excluded from the amnesty are not mentioned.
- Chapter 33: the expedition to Tabuk has no chapter in the outline.

Audit correction (2026-10-03): Removed the al-Hazwarah quotation from both chapter 19 scripts and their claim/source ledger. Tirmidhi 3925 supports the wording but gives no date; its placement as a farewell on the night of Hijrah implied an unsupported occasion. Revised the age sentence because his infancy with Banu Sa'd was outside Makkah. In chapter 25, revised both scene titles and narration to place the supplication on the day of Badr, as Muslim dataset no. 4588 explicitly says. These changes remain unverified pending a qualified review.

Further reference checks (2026-10-03): The public Sunnah.com entries confirm Sahih Muslim 1763 (day of Badr supplication), 1774a (letters to Chosroes, Caesar, the Negus and other rulers), and 2856b (Amr ibn Amir al-Khuza'i first instituted the sa'ibah). The local Muslim dataset uses a different numbering scheme. Chapter 30 now limits the Hudaybiyyah timing to the Heraclius letter supported by Bukhari 7. These are text/number checks, not a qualified historical sign-off.

The local Abu Dawud 499 and Ibn Majah 150 records label al-Albani's grade **Hasan Sahih**, rather than the shorter "hasan" previously displayed. Updated those source records to preserve the listed grade exactly. Human grade review remains required.

Audio-preparation source pass (2026-10-03): Reduced English and Bengali `<!-- n -->` paragraphs from 109 each to 12 each. Linked factual framing to existing claim IDs where those claims support it, and removed or rewrote speculative thoughts and overstatements (including chapter 15's invented "remembered" thoughts, chapter 31's imagined gathering before him, and chapter 32's assumption about his motive for distributing spoils). Khabbab's work as a blacksmith is supported by Bukhari 2091 in the local dataset; added c11-012 and kept it `unverified`. This is a source-linking and wording pass, not human authentication. The 12 remaining `n` paragraphs are transitional or a closing supplication and still need human editorial review.

## 2026-10-03 -- Bengali scripts, chapters 08 to 37

Written from the English scripts and the same claim ledger; the build confirms identical scene ids and claim
ids in both languages for all 37 chapters. No separate source check was made for the Bengali. Qur'an
renderings are paraphrases of meaning in Bengali, not a named translation. Wording, transliteration of names
and honorifics await the Bengali reviewer.
