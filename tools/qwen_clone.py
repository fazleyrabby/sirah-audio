"""Clone a reference voice with the local Qwen3-TTS MLX model and synthesise text.

The reference voice is supplied as an audio file (any format ffmpeg can read) plus,
for in-context-learning cloning, a transcript of that audio. Without --ref-text the
model falls back to speaker-embedding (x-vector) cloning.

Python environment: .tools/tts-qwen-venv

Usage:
  .tools/tts-qwen-venv/bin/python tools/qwen_clone.py \
      --ref auditions/gemini-bn-storyteller.mp3 \
      --ref-text-file content/chapters/07-the-first-revelation/script-bn.md \
      --text "..." --lang english --out out.wav
"""

import argparse
import json
import pathlib
import subprocess
import time

import numpy as np
import soundfile as sf

ROOT = pathlib.Path(__file__).resolve().parent.parent
DEFAULT_MODEL = pathlib.Path.home() / "Models/Qwen3-TTS-1.7B"
LANGS = ["auto", "chinese", "english", "german", "italian", "portuguese",
         "spanish", "japanese", "korean", "french", "russian"]


def to_wav(src: pathlib.Path, dst: pathlib.Path, sample_rate: int = 24000) -> pathlib.Path:
    dst.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(src),
         "-ar", str(sample_rate), "-ac", "1", "-c:a", "pcm_s16le", str(dst)],
        check=True,
    )
    return dst


def write_audio(path: pathlib.Path, audio: np.ndarray, sample_rate: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    wav = path.with_suffix(".wav")
    sf.write(str(wav), audio.astype(np.float32), sample_rate)
    if path.suffix.lower() == ".mp3":
        subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav),
             "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "44100", "-ac", "1",
             "-codec:a", "libmp3lame", "-b:a", "128k", str(path)],
            check=True,
        )
        wav.unlink(missing_ok=True)


def read_ref_text(args) -> str | None:
    text = args.ref_text
    if args.ref_text_file:
        text = args.ref_text_file.read_text("utf-8").strip()
    return text or None


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ref", type=pathlib.Path, required=True, help="Reference audio file")
    parser.add_argument("--ref-text", help="Transcript of the reference audio (enables ICL cloning)")
    parser.add_argument("--ref-text-file", type=pathlib.Path, help="File whose contents are the reference transcript")
    parser.add_argument("--text", required=True, help="Text to synthesise")
    parser.add_argument("--lang", default="english", choices=LANGS)
    parser.add_argument("--out", type=pathlib.Path, required=True, help="Output .wav or .mp3")
    parser.add_argument("--model", type=pathlib.Path, default=DEFAULT_MODEL)
    parser.add_argument("--temperature", type=float, default=0.9)
    parser.add_argument("--top-k", type=int, default=50)
    parser.add_argument("--repetition-penalty", type=float, default=1.05)
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    ref_wav = to_wav(args.ref, ROOT / ".tools/qwen_ref" / (args.ref.stem + ".wav"))
    ref_text = read_ref_text(args)

    from mlx_audio.tts.utils import load_model

    print(f"Loading {args.model} ...", flush=True)
    started = time.time()
    model = load_model(str(args.model))
    print(f"Loaded in {time.time() - started:.1f}s (sample rate {model.sample_rate})", flush=True)

    mode = "ICL" if ref_text else "x-vector"
    print(f"Synthesising [{args.lang}, {mode}] -> {args.out}", flush=True)
    started = time.time()
    results = model.generate(
        text=args.text,
        ref_audio=str(ref_wav),
        ref_text=ref_text,
        lang_code=args.lang,
        temperature=args.temperature,
        top_k=args.top_k,
        repetition_penalty=args.repetition_penalty,
        verbose=args.verbose,
    )
    chunks = [np.array(r.audio, copy=False) for r in results]
    audio = np.concatenate(chunks) if chunks else np.zeros(0, dtype=np.float32)
    duration = len(audio) / model.sample_rate

    write_audio(args.out, audio, model.sample_rate)
    print(json.dumps({
        "out": str(args.out),
        "mode": mode,
        "lang": args.lang,
        "seconds": round(duration, 2),
        "wall": round(time.time() - started, 1),
    }))


if __name__ == "__main__":
    main()
