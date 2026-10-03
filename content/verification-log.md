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
