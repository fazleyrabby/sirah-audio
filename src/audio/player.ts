// One audio element for the whole app, so playback can carry on from chapter to chapter
// without a fresh user gesture. Native HTML audio only (SPEC 59).

export type PlayerEvent = "time" | "state" | "ended" | "error";

class AudioPlayer extends EventTarget {
  readonly element = new Audio();
  private frame = 0;

  constructor() {
    super();
    const audio = this.element;
    audio.preload = "metadata";
    const emit = (type: PlayerEvent) => () => this.dispatchEvent(new Event(type));
    for (const type of ["play", "pause", "playing", "waiting", "stalled", "canplay", "loadedmetadata", "durationchange", "ratechange", "volumechange"]) {
      audio.addEventListener(type, emit("state"));
    }
    // timeupdate is too coarse for subtitles; follow the audio clock every frame while playing.
    audio.addEventListener("playing", () => this.tick());
    audio.addEventListener("pause", () => cancelAnimationFrame(this.frame));
    audio.addEventListener("timeupdate", emit("time"));
    audio.addEventListener("seeked", emit("time"));
    audio.addEventListener("ended", emit("ended"));
    audio.addEventListener("error", emit("error"));
  }

  private tick(): void {
    cancelAnimationFrame(this.frame);
    const loop = () => {
      this.dispatchEvent(new Event("time"));
      if (!this.element.paused) this.frame = requestAnimationFrame(loop);
    };
    this.frame = requestAnimationFrame(loop);
  }

  get time(): number {
    return this.element.currentTime;
  }

  get duration(): number {
    return Number.isFinite(this.element.duration) ? this.element.duration : 0;
  }

  get playing(): boolean {
    return !this.element.paused && !this.element.ended;
  }

  get waiting(): boolean {
    return this.playing && this.element.readyState < HTMLMediaElement.HAVE_FUTURE_DATA;
  }

  load(source: string, startAt = 0): void {
    const audio = this.element;
    audio.src = source;
    audio.load();
    if (startAt > 0) {
      const seek = () => {
        audio.currentTime = startAt;
      };
      if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) seek();
      else audio.addEventListener("loadedmetadata", seek, { once: true });
    }
  }

  unload(): void {
    this.element.pause();
    this.element.removeAttribute("src");
    this.element.load();
  }

  // Browsers may refuse to play without a user gesture; that is not an error to surface.
  async play(): Promise<boolean> {
    try {
      await this.element.play();
      return true;
    } catch (error) {
      if ((error as DOMException).name !== "NotAllowedError" && (error as DOMException).name !== "AbortError") {
        this.dispatchEvent(new Event("error"));
      }
      return false;
    }
  }

  pause(): void {
    this.element.pause();
  }

  toggle(): void {
    if (this.playing) this.pause();
    else void this.play();
  }

  seekTo(time: number): void {
    const limit = this.duration || Number.MAX_SAFE_INTEGER;
    this.element.currentTime = Math.min(Math.max(0, time), Math.max(0, limit - 0.05));
  }

  seekBy(seconds: number): void {
    this.seekTo(this.time + seconds);
  }

  setSpeed(speed: number): void {
    this.element.defaultPlaybackRate = speed;
    this.element.playbackRate = speed;
  }

  setVolume(volume: number): void {
    this.element.volume = Math.min(Math.max(0, volume), 1);
  }

  setMuted(muted: boolean): void {
    this.element.muted = muted;
  }

  on(type: PlayerEvent, handler: () => void): () => void {
    this.addEventListener(type, handler);
    return () => this.removeEventListener(type, handler);
  }
}

export const player = new AudioPlayer();

// iOS Safari ignores script-set volume; the control is hidden there (SPEC 45).
export function volumeIsAdjustable(): boolean {
  const probe = new Audio();
  try {
    probe.volume = 0.5;
  } catch {
    return false;
  }
  return probe.volume === 0.5;
}
