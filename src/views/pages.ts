// Home, chapter explorer, sources, about and not-found screens.
import { chapterById, chapters, firstPlayable, isPlayable, isReadable } from "../chapters/chapters.ts";
import { renderChapterList } from "../components/chapter-list.ts";
import { escapeHtml, formatTime, t } from "../i18n/strings.ts";
import { href } from "../router/router.ts";
import { settings } from "../settings/settings.ts";
import type { Language } from "../types.ts";

export function renderHome(language: Language): string {
  const last = chapterById(settings.chapterId);
  const progress = last && settings.progress[last.id];
  const first = firstPlayable(language) ?? chapters.find((chapter) => isReadable(chapter, language));
  const resume = last && progress && isPlayable(last, language) && !progress.completed;
  const duration = last?.duration[language] ?? 0;

  const action = resume
    ? `<section class="continue" aria-labelledby="continue-title">
         <p class="eyebrow" id="continue-title">${t("continueListening", language)}</p>
         <p class="continue__chapter">${escapeHtml(last.title[language])}</p>
         <p class="continue__time">${formatTime(progress.fraction * duration)} / ${formatTime(duration)}</p>
         <a class="button" href="${href(`/chapter/${last.slug}`, language)}">${t("continue", language)}</a>
       </section>`
    : first
      ? `<a class="button button--primary" href="${href(`/chapter/${first.slug}`, language)}">${t(settings.chapterId ? "begin" : "beginJourney", language)}</a>`
      : `<p>${t("comingSoon", language)}</p>`;

  return `
    <main class="home">
      <div class="home__backdrop" aria-hidden="true"><img src="/images/mountains/hira-night.svg" alt="" /></div>
      <div class="home__content">
        <p class="home__arabic" lang="ar" dir="rtl">السيرة النبوية</p>
        <h1 class="home__brand">${t("brand", language)}</h1>
        <p class="home__title">${t("title", language)}</p>
        <p class="home__tagline">${t("tagline", language)}</p>
        ${action}
        <p class="home__languages">
          <a href="${href("/", "en")}" lang="en"${language === "en" ? ' aria-current="true"' : ""}>English</a>
          <span aria-hidden="true">|</span>
          <a href="${href("/", "bn")}" lang="bn"${language === "bn" ? ' aria-current="true"' : ""}>বাংলা</a>
        </p>
        <p class="home__more"><a href="${href("/chapters", language)}">${t("toChapters", language)}</a></p>
      </div>
    </main>`;
}

export function renderChapters(language: Language): string {
  return `<main class="page"><h1>${t("chapters", language)}</h1>${renderChapterList(language, settings.chapterId)}</main>`;
}

const SOURCES: Record<Language, string> = {
  en: `
    <h1>Sources</h1>
    <p>The narration is original. It is written from researched sources and is not a reading of any book. The authority is the sources, never the narration and never the visuals.</p>
    <h2>Where the account comes from</h2>
    <ol>
      <li><strong>The Qur'an.</strong></li>
      <li><strong>Sahih al-Bukhari and Sahih Muslim.</strong></li>
      <li><strong>The other major hadith collections</strong>, with the grading of a named scholar: Sunan Abu Dawud, Jami' at-Tirmidhi, Sunan an-Nasa'i, Sunan Ibn Majah, Musnad Ahmad.</li>
      <li><strong>Established works of Seerah</strong>, chiefly <em>Ar-Raheeq Al-Makhtum</em> (The Sealed Nectar) by Safiur-Rahman Al-Mubarakpuri.</li>
    </ol>
    <h2>How each statement is treated</h2>
    <ul>
      <li>What is in the Qur'an, or in a hadith graded sahih or hasan, is narrated as fact.</li>
      <li>What is transmitted by the historians of the Seerah without an established chain is narrated with attribution, in words such as "the historians report".</li>
      <li>Weak and unestablished reports are left out, however well known.</li>
      <li>Where dates and numbers differ between sources, the narration says so.</li>
      <li>No dialogue, thought or scene is invented.</li>
    </ul>
    <h2>Review status</h2>
    <p>A chapter is marked <strong>Preview</strong> until every reference behind it has been checked against the source text by a qualified reviewer. Preview chapters may contain errors. Each chapter lists its exact references in its Sources panel.</p>
    <h2>Corrections</h2>
    <p>No corrections have been published yet. Corrections to any chapter will be listed here with the date and the change.</p>`,
  bn: `
    <h1>সূত্র</h1>
    <p>এই বর্ণনা মৌলিকভাবে লেখা। এটি গবেষণালব্ধ সূত্র থেকে রচিত, কোনো বইয়ের পাঠ নয়। প্রামাণ্য হলো সূত্র; বর্ণনা বা দৃশ্য নয়।</p>
    <h2>বর্ণনার উৎস</h2>
    <ol>
      <li><strong>কুরআন।</strong></li>
      <li><strong>সহিহ বুখারি ও সহিহ মুসলিম।</strong></li>
      <li><strong>অন্যান্য প্রধান হাদিসগ্রন্থ</strong>, নির্দিষ্ট আলেমের মান-নির্ণয়সহ: সুনান আবু দাউদ, জামে তিরমিজি, সুনান নাসায়ি, সুনান ইবনে মাজাহ, মুসনাদ আহমাদ।</li>
      <li><strong>প্রতিষ্ঠিত সীরাত গ্রন্থ</strong>, প্রধানত সফিউর রহমান মুবারকপুরির <em>আর-রাহীকুল মাখতূম</em>।</li>
    </ol>
    <h2>প্রতিটি বক্তব্য যেভাবে বিবেচিত</h2>
    <ul>
      <li>কুরআনে বা সহিহ কিংবা হাসান হাদিসে যা আছে, তা তথ্য হিসেবে বর্ণিত।</li>
      <li>সীরাত-ঐতিহাসিকদের যে বর্ণনার সনদ প্রতিষ্ঠিত নয়, তা "ঐতিহাসিকগণ বর্ণনা করেন" ধরনের শব্দে উল্লেখ করা হয়।</li>
      <li>দুর্বল ও অপ্রতিষ্ঠিত বর্ণনা যত প্রসিদ্ধই হোক, বাদ দেওয়া হয়।</li>
      <li>তারিখ ও সংখ্যায় সূত্রভেদ থাকলে বর্ণনায় তা বলা হয়।</li>
      <li>কোনো সংলাপ, ভাবনা বা দৃশ্য বানানো হয় না।</li>
    </ul>
    <h2>পর্যালোচনার অবস্থা</h2>
    <p>যোগ্য পর্যালোচক মূল গ্রন্থের সঙ্গে প্রতিটি সূত্র মিলিয়ে না দেখা পর্যন্ত অধ্যায়টি <strong>প্রিভিউ</strong> হিসেবে চিহ্নিত থাকে। প্রিভিউ অধ্যায়ে ভুল থাকতে পারে। প্রতিটি অধ্যায়ের সূত্র-প্যানেলে তার নির্দিষ্ট সূত্র দেওয়া আছে।</p>
    <h2>সংশোধনী</h2>
    <p>এখনো কোনো সংশোধনী প্রকাশিত হয়নি। কোনো অধ্যায়ে সংশোধন হলে তারিখসহ এখানে উল্লেখ করা হবে।</p>`,
};

const ABOUT: Record<Language, string> = {
  en: `
    <h1>About</h1>
    <p>Sīrah ﷺ is an audio journey through the life of the Prophet Muhammad ﷺ, told chapter by chapter in English and Bengali.</p>
    <p>It is made to be listened to: a calm voice, subtitles to follow, and quiet scenes of the places where the events happened. There is no music.</p>
    <h2>What you will not see</h2>
    <p>The Prophet ﷺ is never depicted. Neither are his Companions, nor any other person of that time, nor anything of the unseen. The scenes show land, sky, buildings and maps.</p>
    <p class="disclaimer">${t("disclaimer", "en")}</p>
    <h2>Privacy</h2>
    <p>There are no accounts, no advertising and no tracking. Your listening progress is stored only on your own device.</p>
    <h2>Reporting an error</h2>
    <p>If you find a mistake in a source or in the narration, please tell us so it can be corrected. A contact address will be published here.</p>`,
  bn: `
    <h1>পরিচিতি</h1>
    <p>সীরাহ ﷺ হলো নবী মুহাম্মাদ ﷺ-এর জীবনের এক অডিও যাত্রা, অধ্যায়ে অধ্যায়ে, ইংরেজি ও বাংলায়।</p>
    <p>এটি শোনার জন্য তৈরি: শান্ত কণ্ঠ, সঙ্গে সাবটাইটেল, আর ঘটনাস্থলগুলোর নীরব দৃশ্য। কোনো সংগীত নেই।</p>
    <h2>যা আপনি দেখবেন না</h2>
    <p>নবী ﷺ-কে কখনো চিত্রিত করা হয় না। তাঁর সাহাবিগণ, সে যুগের অন্য কোনো ব্যক্তি, কিংবা গায়েবের কোনো কিছুও নয়। দৃশ্যে থাকে ভূমি, আকাশ, স্থাপনা ও মানচিত্র।</p>
    <p class="disclaimer">${t("disclaimer", "bn")}</p>
    <h2>গোপনীয়তা</h2>
    <p>কোনো অ্যাকাউন্ট, বিজ্ঞাপন বা ট্র্যাকিং নেই। আপনার শোনার অগ্রগতি কেবল আপনার নিজের ডিভাইসেই সংরক্ষিত থাকে।</p>
    <h2>ভুল জানানো</h2>
    <p>সূত্রে বা বর্ণনায় কোনো ভুল পেলে আমাদের জানান, যাতে তা সংশোধন করা যায়। যোগাযোগের ঠিকানা এখানে প্রকাশ করা হবে।</p>`,
};

export const renderSourcesPage = (language: Language) => `<main class="page page--prose">${SOURCES[language]}</main>`;
export const renderAbout = (language: Language) => `<main class="page page--prose">${ABOUT[language]}</main>`;

export function renderNotFound(language: Language): string {
  return `<main class="page page--prose"><h1>${t("notFound", language)}</h1><p>${t("notFoundBody", language)}</p>
    <p><a class="button" href="${href("/chapters", language)}">${t("toChapters", language)}</a></p></main>`;
}
