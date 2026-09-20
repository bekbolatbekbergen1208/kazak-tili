#!/usr/bin/env python3
"""Merge Dosha adapters, export GGUF files, and optionally create Ollama models."""

import argparse
import subprocess
from pathlib import Path


def run(*command):
    print("+", " ".join(map(str, command)), flush=True)
    subprocess.run([str(item) for item in command], check=True)


def arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument("--kind", choices=("text", "vision", "all"), default="all")
    parser.add_argument("--text-adapter", default="training/artifacts/dosha-lora")
    parser.add_argument(
        "--vision-adapter", default="training/artifacts/dosha-vision-lora"
    )
    parser.add_argument("--output", default="training/artifacts/export")
    parser.add_argument("--llama-cpp", help="Path to a current llama.cpp checkout")
    parser.add_argument("--quantization", default="Q4_K_M")
    parser.add_argument("--create-ollama", action="store_true")
    return parser.parse_args()


def export_text(args, output):
    from unsloth import FastModel

    adapter = Path(args.text_adapter)
    if not adapter.is_dir():
        raise SystemExit(f"Text adapter not found: {adapter}")
    model, tokenizer = FastModel.from_pretrained(
        model_name=str(adapter), max_seq_length=4096, load_in_4bit=True
    )
    destination = output / "dosha"
    model.save_pretrained_gguf(
        str(destination), tokenizer, quantization_method=args.quantization
    )
    candidates = sorted(destination.parent.glob(f"{destination.name}*.gguf"))
    if not candidates:
        candidates = sorted(destination.glob("*.gguf"))
    if not candidates:
        raise SystemExit("Unsloth did not produce a Dosha GGUF file")
    modelfile = output / "Modelfile.dosha.generated"
    template = Path("training/Modelfile.dosha").read_text(encoding="utf-8")
    modelfile.write_text(
        template.replace("./artifacts/dosha.gguf", str(candidates[0].resolve())),
        encoding="utf-8",
    )
    if args.create_ollama:
        run("ollama", "create", "dosha", "-f", modelfile)


def export_vision(args, output):
    from unsloth import FastVisionModel

    adapter = Path(args.vision_adapter)
    if not adapter.is_dir():
        raise SystemExit(f"Vision adapter not found: {adapter}")
    model, processor = FastVisionModel.from_pretrained(
        model_name=str(adapter), load_in_4bit=True
    )
    merged = output / "dosha-vision-merged"
    model.save_pretrained_merged(str(merged), processor)

    modelfile = output / "Modelfile.dosha-vision.generated"
    template = Path("training/Modelfile.dosha-vision").read_text(encoding="utf-8")
    modelfile.write_text(
        template.replace(
            "./artifacts/dosha-vision-merged", str(merged.resolve())
        ),
        encoding="utf-8",
    )
    if args.create_ollama:
        run("ollama", "create", "dosha-vision", "-f", modelfile)

    if args.llama_cpp:
        converter = Path(args.llama_cpp) / "convert_hf_to_gguf.py"
        quantizer = Path(args.llama_cpp) / "build/bin/llama-quantize"
        if not converter.is_file():
            raise SystemExit(f"llama.cpp converter not found: {converter}")
        f16 = output / "dosha-vision-f16.gguf"
        run("python3", converter, merged, "--outfile", f16, "--outtype", "f16")
        run(
            "python3",
            converter,
            merged,
            "--outfile",
            f16,
            "--outtype",
            "f16",
            "--mmproj",
        )
        if quantizer.is_file():
            run(quantizer, f16, output / "dosha-vision-Q4_K_M.gguf", args.quantization)
        else:
            print(f"Skip quantization; build llama.cpp first: {quantizer}")


def main():
    args = arguments()
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    if args.kind in ("text", "all"):
        export_text(args, output)
    if args.kind in ("vision", "all"):
        export_vision(args, output)


if __name__ == "__main__":
    main()
