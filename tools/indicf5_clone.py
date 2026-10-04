"""Clone a reference voice with the local MLX IndicF5 model and synthesise text.

IndicF5 (ai4bharat) is a zero-shot voice cloner covering 11 Indian languages
including Bengali. This tool adapts the yogenghodke/indic-f5-mlx port to the
installed MLX version and to Indic sentence punctuation.

Python environment: .tools/indicf5-venv

Usage:
  .tools/indicf5-venv/bin/python tools/indicf5_clone.py \
      --ref auditions/gemini-bn-storyteller.mp3 \
      --ref-text-file ref.txt \
      --text "..." --out out.mp3
"""

import argparse
import pathlib
import re
import subprocess
import time

import numpy as np
import soundfile as sf


def _patch_mlx_random() -> None:
    import mlx.core as mx

    original = mx.random.normal

    def normal(*args, **kwargs):
        if "shape" in kwargs:
            kwargs["shape"] = tuple(int(s) for s in kwargs["shape"])
        elif args:
            args = (tuple(int(s) for s in args[0]),) + args[1:]
        return original(*args, **kwargs)

    mx.random.normal = normal


def _patch_sentence_splitter(no_split: bool) -> None:
    import f5_tts_mlx.generate as generate_module

    if no_split:
        generate_module.split_sentences = lambda text: [text.strip()]
        return

    terminators = re.compile(r"[.!?;:।॥。！？；：]")

    def split_sentences(text):
        sentences, current = [], ""
        for char in text.strip():
            current += char
            if terminators.match(char):
                if current.strip():
                    sentences.append(current.strip())
                current = ""
        if current.strip():
            sentences.append(current.strip())
        return sentences

    generate_module.split_sentences = split_sentences


def to_ref_wav(src: pathlib.Path, dst: pathlib.Path, max_seconds: float | None) -> pathlib.Path:
    dst.parent.mkdir(parents=True, exist_ok=True)
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(src)]
    if max_seconds:
        cmd += ["-t", str(max_seconds)]
    cmd += ["-ar", "24000", "-ac", "1", "-c:a", "pcm_s16le", str(dst)]
    subprocess.run(cmd, check=True)
    return dst


def write_audio(path: pathlib.Path, audio: np.ndarray, sample_rate: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.suffix.lower() == ".mp3":
        wav = path.with_suffix(".wav")
        sf.write(str(wav), audio.astype(np.float32), sample_rate)
        subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav),
             "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "44100", "-ac", "1",
             "-codec:a", "libmp3lame", "-b:a", "128k", str(path)],
            check=True,
        )
        wav.unlink(missing_ok=True)
    else:
        sf.write(str(path), audio.astype(np.float32), sample_rate)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ref", type=pathlib.Path, required=True)
    parser.add_argument("--ref-text", help="Transcript of the reference audio")
    parser.add_argument("--ref-text-file", type=pathlib.Path)
    parser.add_argument("--ref-seconds", type=float, default=None, help="Trim reference to this many seconds")
    parser.add_argument("--text")
    parser.add_argument("--text-file", type=pathlib.Path)
    parser.add_argument("--out", type=pathlib.Path, required=True)
    parser.add_argument("--steps", type=int, default=16)
    parser.add_argument("--cfg-strength", type=float, default=2.0)
    parser.add_argument("--sway", type=float, default=-1.0)
    parser.add_argument("--no-split", action="store_true", help="Process the whole text as one chunk (fewer reference re-runs)")
    args = parser.parse_args()

    ref_text = args.ref_text
    if args.ref_text_file:
        ref_text = args.ref_text_file.read_text("utf-8").strip()
    if not ref_text:
        parser.error("a reference transcript is required (--ref-text or --ref-text-file)")

    text = args.text
    if args.text_file:
        text = args.text_file.read_text("utf-8").strip()
    if not text:
        parser.error("provide --text or --text-file")

    _patch_mlx_random()
    _patch_sentence_splitter(args.no_split)

    from indic_f5_mlx import load_indicf5, generate

    ref_wav = to_ref_wav(args.ref, pathlib.Path(".tools/indicf5_ref") / (args.ref.stem + ".wav"), args.ref_seconds)

    print("Loading IndicF5 ...", flush=True)
    started = time.time()
    model, _ = load_indicf5()
    print(f"Loaded in {time.time() - started:.1f}s", flush=True)

    print(f"Synthesising -> {args.out}", flush=True)
    started = time.time()
    audio = np.asarray(
        generate(
            model,
            ref_audio_path=str(ref_wav),
            ref_text=ref_text,
            text=text,
            steps=args.steps,
            cfg_strength=args.cfg_strength,
            sway_sampling_coef=args.sway,
        ),
        dtype=np.float32,
    )
    duration = len(audio) / 24000
    write_audio(args.out, audio, 24000)
    print(f"{args.out}: {duration:.2f}s audio in {time.time() - started:.1f}s", flush=True)


if __name__ == "__main__":
    main()
