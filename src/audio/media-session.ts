// Lock-screen, headphone and car controls.
import { player } from "./player.ts";

interface SessionOptions {
  title: string;
  album: string;
  onPrevious?: () => void;
  onNext?: () => void;
}

const ACTIONS: MediaSessionAction[] = ["play", "pause", "seekbackward", "seekforward", "seekto", "previoustrack", "nexttrack"];

export function bindMediaSession(options: SessionOptions): () => void {
  if (!("mediaSession" in navigator)) return () => {};
  const session = navigator.mediaSession;
  session.metadata = new MediaMetadata({
    title: options.title,
    artist: "Sīrah ﷺ",
    album: options.album,
    artwork: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  });

  const handlers: Partial<Record<MediaSessionAction, MediaSessionActionHandler | null>> = {
    play: () => void player.play(),
    pause: () => player.pause(),
    seekbackward: (details) => player.seekBy(-(details.seekOffset ?? 15)),
    seekforward: (details) => player.seekBy(details.seekOffset ?? 15),
    seekto: (details) => {
      if (typeof details.seekTime === "number") player.seekTo(details.seekTime);
    },
    previoustrack: options.onPrevious ?? null,
    nexttrack: options.onNext ?? null,
  };
  for (const action of ACTIONS) {
    try {
      session.setActionHandler(action, handlers[action] ?? null);
    } catch {
      // Action not supported by this browser.
    }
  }

  const sync = () => {
    session.playbackState = player.playing ? "playing" : "paused";
    if (player.duration > 0) {
      try {
        session.setPositionState({
          duration: player.duration,
          position: Math.min(player.time, player.duration),
          playbackRate: player.element.playbackRate,
        });
      } catch {
        // Ignored: position state is optional.
      }
    }
  };
  const off = player.on("state", sync);
  sync();

  return () => {
    off();
    for (const action of ACTIONS) {
      try {
        session.setActionHandler(action, null);
      } catch {
        // Ignored.
      }
    }
    session.metadata = null;
  };
}
