#!/usr/bin/env python3
"""Vision QLoRA based on Unsloth Gemma3_(4B)-Vision.py."""

import argparse
import json
from pathlib import Path

from PIL import Image
from datasets import Dataset
from trl import SFTConfig, SFTTrainer
from unsloth import FastVisionModel, get_chat_template
from unsloth.trainer import UnslothVisionDataCollator


def arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument("--train", default="training/data/dosha-vision-train.jsonl")
    parser.add_argument("--model", default="unsloth/gemma-3-4b-pt")
    parser.add_argument("--output", default="training/artifacts/dosha-vision-lora")
    parser.add_argument("--epochs", type=float, default=1.0)
    parser.add_argument("--max-steps", type=int, default=-1)
    parser.add_argument("--learning-rate", type=float, default=2e-4)
    parser.add_argument("--seed", type=int, default=3407)
    return parser.parse_args()


def load_rows(filename):
    rows = []
    with Path(filename).open(encoding="utf-8") as handle:
        for line in handle:
            raw = json.loads(line)
            for message in raw["messages"]:
                if isinstance(message["content"], list):
                    for part in message["content"]:
                        if part.get("type") == "image":
                            image_path = Path(part["image"])
                            if not image_path.is_file():
                                raise SystemExit(f"Image not found: {image_path}")
                            part["image"] = Image.open(image_path).convert("RGB")
            rows.append({"messages": raw["messages"]})
    if not rows:
        raise SystemExit(
            "Vision dataset is empty. Add licensed images under "
            "training/vision-images/<word-id>/ and regenerate datasets."
        )
    return Dataset.from_list(rows)


def main():
    args = arguments()
    dataset = load_rows(args.train)
    model, processor = FastVisionModel.from_pretrained(
        args.model,
        load_in_4bit=True,
        use_gradient_checkpointing="unsloth",
    )
    model = FastVisionModel.get_peft_model(
        model,
        finetune_vision_layers=True,
        finetune_language_layers=True,
        finetune_attention_modules=True,
        finetune_mlp_modules=True,
        r=16,
        lora_alpha=16,
        lora_dropout=0,
        bias="none",
        random_state=args.seed,
        use_rslora=False,
        target_modules="all-linear",
    )
    processor = get_chat_template(processor, "gemma-3")
    FastVisionModel.for_training(model)
    trainer = SFTTrainer(
        model=model,
        train_dataset=dataset,
        processing_class=processor.tokenizer,
        data_collator=UnslothVisionDataCollator(model, processor),
        args=SFTConfig(
            output_dir=str(Path(args.output).parent / "dosha-vision-checkpoints"),
            per_device_train_batch_size=1,
            gradient_accumulation_steps=4,
            gradient_checkpointing=True,
            gradient_checkpointing_kwargs={"use_reentrant": False},
            max_grad_norm=0.3,
            warmup_ratio=0.03,
            num_train_epochs=args.epochs,
            max_steps=args.max_steps,
            learning_rate=args.learning_rate,
            logging_steps=5,
            save_strategy="steps",
            save_steps=100,
            optim="adamw_torch_fused",
            weight_decay=0.001,
            lr_scheduler_type="cosine",
            seed=args.seed,
            report_to="none",
            remove_unused_columns=False,
            dataset_text_field="",
            dataset_kwargs={"skip_prepare_dataset": True},
            max_length=2048,
        ),
    )
    trainer.train()
    model.save_pretrained(args.output)
    processor.save_pretrained(args.output)


if __name__ == "__main__":
    main()
