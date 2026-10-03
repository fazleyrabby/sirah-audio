const svg = (body: string) =>
  `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const icons = {
  play: svg(`<path d="M8 5.5v13l10.5-6.500z" fill="currentColor" stroke="none"/>`),
  pause: svg(`<path d="M8 5.500v13M16 5.500v13" stroke-width="2.6"/>`),
  back: svg(`<path d="M4.500 12a7.500 7.500 0 1 0 2.600-5.700"/><path d="M7.500 2.800v4h4"/><text x="12" y="15.300" font-size="6.500" text-anchor="middle" fill="currentColor" stroke="none" font-family="inherit">15</text>`),
  forward: svg(`<path d="M19.500 12a7.500 7.500 0 1 1-2.600-5.700"/><path d="M16.500 2.800v4h-4"/><text x="12" y="15.300" font-size="6.500" text-anchor="middle" fill="currentColor" stroke="none" font-family="inherit">15</text>`),
  previous: svg(`<path d="M18 6v12l-9-6z" fill="currentColor" stroke="none"/><path d="M6.500 6v12" stroke-width="2"/>`),
  next: svg(`<path d="M6 6v12l9-6z" fill="currentColor" stroke="none"/><path d="M17.500 6v12" stroke-width="2"/>`),
  subtitles: svg(`<rect x="3" y="5.500" width="18" height="13" rx="2.500"/><path d="M7 11h4M13.500 11H17M7 14.500h7"/>`),
  transcript: svg(`<path d="M6 4h9l4 4v12H6z"/><path d="M9 11h7M9 14.500h7M9 7.500h3"/>`),
  sources: svg(`<path d="M5 5.500c2.500-1 5-1 7 .5v13c-2-1.500-4.500-1.500-7-.5zM19 5.500c-2.500-1-5-1-7 .5v13c2-1.500 4.500-1.500 7-.5z"/>`),
  list: svg(`<path d="M8.500 7h11M8.500 12h11M8.500 17h11"/><path d="M4.500 7h.01M4.500 12h.01M4.500 17h.01" stroke-width="2.400"/>`),
  volume: svg(`<path d="M4 9.500v5h3.500l4.500 3.500V6L7.500 9.500z"/><path d="M15.500 9a4 4 0 0 1 0 6M18 6.500a7.500 7.500 0 0 1 0 11"/>`),
  muted: svg(`<path d="M4 9.500v5h3.500l4.500 3.500V6L7.500 9.500z"/><path d="M16 9.500l5 5M21 9.500l-5 5"/>`),
  close: svg(`<path d="M6 6l12 12M18 6L6 18"/>`),
  check: svg(`<path d="M5 12.500l4.500 4.500L19 7.500"/>`),
};
