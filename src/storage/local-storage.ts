// Storage may be blocked (private mode, quota). It must never break playback.
const KEY = "sirah.state";

export function readStored(): unknown {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeStored(value: unknown): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // Ignored: progress simply is not persisted.
  }
}
