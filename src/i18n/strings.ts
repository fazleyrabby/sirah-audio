import type { Language } from "../types.ts";

// Interface text. Bengali strings await the Bengali reviewer (SPEC 5.9).
const strings = {
  brand: { en: "Sīrah ﷺ", bn: "সীরাহ ﷺ" },
  title: { en: "The Life of Muhammad ﷺ", bn: "মুহাম্মাদ ﷺ-এর জীবন" },
  tagline: { en: "A journey through his blessed life.", bn: "তাঁর বরকতময় জীবনের পথে এক যাত্রা।" },
  siteDescription: {
    en: "Listen to the life of Prophet Muhammad ﷺ as a calm, source-conscious audio journey.",
    bn: "নবী মুহাম্মাদ ﷺ-এর জীবন শুনুন, শান্ত ও সূত্রনির্ভর এক অডিও যাত্রায়।",
  },
  begin: { en: "Begin listening", bn: "শোনা শুরু করুন" },
  beginJourney: { en: "Begin the journey", bn: "যাত্রা শুরু করুন" },
  continueListening: { en: "Continue listening", bn: "শোনা চালিয়ে যান" },
  continue: { en: "Continue", bn: "চালিয়ে যান" },
  chapters: { en: "Chapters", bn: "অধ্যায়সমূহ" },
  sources: { en: "Sources", bn: "সূত্র" },
  about: { en: "About", bn: "পরিচিতি" },
  chapter: { en: "Chapter", bn: "অধ্যায়" },
  comingSoon: { en: "Coming soon", bn: "শীঘ্রই আসছে" },
  play: { en: "Play", bn: "চালান" },
  pause: { en: "Pause", bn: "থামান" },
  back15: { en: "Back 15 seconds", bn: "১৫ সেকেন্ড পেছনে" },
  forward15: { en: "Forward 15 seconds", bn: "১৫ সেকেন্ড সামনে" },
  previous: { en: "Previous chapter", bn: "আগের অধ্যায়" },
  next: { en: "Next chapter", bn: "পরের অধ্যায়" },
  speed: { en: "Playback speed", bn: "গতি" },
  subtitles: { en: "Subtitles", bn: "সাবটাইটেল" },
  transcript: { en: "Transcript", bn: "পূর্ণ পাঠ" },
  volume: { en: "Volume", bn: "ভলিউম" },
  mute: { en: "Mute", bn: "নিঃশব্দ" },
  close: { en: "Close", bn: "বন্ধ করুন" },
  position: { en: "Playback position", bn: "প্লেব্যাকের অবস্থান" },
  loading: { en: "Loading…", bn: "লোড হচ্ছে…" },
  loadError: { en: "Unable to load this chapter.", bn: "এই অধ্যায়টি লোড করা যায়নি।" },
  tryAgain: { en: "Please try again.", bn: "আবার চেষ্টা করুন।" },
  retry: { en: "Try again", bn: "আবার চেষ্টা" },
  offline: { en: "You are offline. Chapters need a connection to play.", bn: "আপনি অফলাইনে আছেন। অধ্যায় শুনতে ইন্টারনেট সংযোগ প্রয়োজন।" },
  reconnecting: { en: "Reconnecting…", bn: "পুনরায় সংযোগ হচ্ছে…" },
  notFound: { en: "Page not found", bn: "পাতাটি পাওয়া যায়নি" },
  notFoundBody: { en: "This page does not exist.", bn: "এই পাতাটির অস্তিত্ব নেই।" },
  toChapters: { en: "See all chapters", bn: "সব অধ্যায় দেখুন" },
  previewNotice: {
    en: "Preview. The references for this chapter are awaiting scholarly review.",
    bn: "প্রিভিউ। এই অধ্যায়ের সূত্রগুলো আলেমদের পর্যালোচনার অপেক্ষায় আছে।",
  },
  upNext: { en: "Up next", bn: "এরপর" },
  playNow: { en: "Play now", bn: "এখনই চালান" },
  cancel: { en: "Cancel", bn: "বাতিল" },
  completed: { en: "Completed", bn: "সম্পন্ন" },
  nowPlaying: { en: "Current chapter", bn: "বর্তমান অধ্যায়" },
  notInLanguage: {
    en: "This chapter is not yet available in English.",
    bn: "এই অধ্যায়টি এখনো বাংলায় পাওয়া যাচ্ছে না।",
  },
  listenInOther: { en: "বাংলায় শুনুন", bn: "Listen in English" },
  chapterComingSoon: {
    en: "This chapter is still being researched and reviewed.",
    bn: "এই অধ্যায়টির গবেষণা ও পর্যালোচনা এখনো চলছে।",
  },
  disclaimer: {
    en: "Visual scenes are artistic reconstructions created to support the narration. They are not photographs or definitive representations of historical appearances or locations.",
    bn: "দৃশ্যগুলো বর্ণনাকে সহায়তা করার জন্য তৈরি শৈল্পিক পুনর্নির্মাণ। এগুলো আলোকচিত্র নয় এবং ঐতিহাসিক চেহারা বা স্থানের চূড়ান্ত উপস্থাপনাও নয়।",
  },
  seerahReport: { en: "Seerah report", bn: "সীরাত-বর্ণনা" },
  wholeChapter: { en: "Whole chapter", bn: "পুরো অধ্যায়" },
  otherLanguage: { en: "বাংলা", bn: "English" },
  minutes: { en: "min", bn: "মিনিট" },
} satisfies Record<string, Record<Language, string>>;

export type StringKey = keyof typeof strings;

export function t(key: StringKey, language: Language): string {
  return strings[key][language];
}

export function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, "0")}`;
}

export function formatMinutes(seconds: number, language: Language): string {
  return `${Math.max(1, Math.round(seconds / 60))} ${t("minutes", language)}`;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}
