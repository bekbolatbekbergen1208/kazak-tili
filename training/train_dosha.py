#!/usr/bin/env python3
"""QLoRA fine-tuning for Dosha, based on Unsloth Gemma3_(4B).py."""

import argparse
from pathlib import Path

from datasets import load_dataset
from trl import SFTConfig, SFTTrainer
from unsloth import FastModel
from unsloth.chat_templates import get_chat_template, train_on_responses_only


def arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument("--train", default="training/data/dosha-train.jsonl")
    parser.add_argument("--validation", default="training/data/dosha-validation.jsonl")
    parser.add_argument("--model", default="unsloth/gemma-3-4b-it")
    parser.add_argument("--output", default="training/artifacts/dosha-lora")
    parser.add_argument("--max-seq-length", type=int, default=4096)
    parser.add_argument("--epochs", type=float, default=1.0)
    parser.add_argument("--max-steps", type=int, default=-1)
    parser.add_argument("--batch-size", type=int, default=2)
    parser.add_argument("--gradient-accumulation", type=int, default=4)
    parser.add_argument("--learning-rate", type=float, default=2e-4)
    parser.add_argument("--seed", type=int, default=3407)
    return parser.parse_args()


def main():
    args = arguments()
    for filename in (args.train, args.validation):
        if not Path(filename).is_file():
            raise SystemExit(f"Dataset not found: {filename}. Run npm run training:dataset")

    model, tokenizer = FastModel.from_pretrained(
        model_name=args.model,
        max_seq_length=args.max_seq_length,
        load_in_4bit=True,
        full_finetuning=False,
    )
    model = FastModel.get_peft_model(
        model,
        finetune_vision_layers=False,
        finetune_language_layers=True,
        finetune_attention_modules=True,
        finetune_mlp_modules=True,
        r=16,
        lora_alpha=16,
        lora_dropout=0,
        bias="none",
        random_state=args.seed,
    )
    tokenizer = get_chat_template(tokenizer, chat_template="gemma-3")
    dataset = load_dataset(
        "json",
        data_files={"train": args.train, "validation": args.validation},
    )

    def gemma_messages(messages):
        """Gemma templates without a system role receive it as trusted context."""
        system = "\n\n".join(
            item["content"] for item in messages if item["role"] == "system"
        )
        conversation = [dict(item) for item in messages if item["role"] != "system"]
        if system and conversation and conversation[0]["role"] == "user":
            conversation[0]["content"] = (
                f"[Досшаға арналған тұрақты нұсқау]\n{system}\n\n"
                f"[Оқушының сұрағы]\n{conversation[0]['content']}"
            )
        return conversation

    def format_rows(batch):
        return {
            "text": [
                tokenizer.apply_chat_template(
                    gemma_messages(messages),
                    tokenize=False,
                    add_generation_prompt=False,
                ).removeprefix("<bos>")
                for messages in batch["messages"]
            ]
        }

    dataset = dataset.map(format_rows, batched=True)
    trainer = SFTTrainer(
        model=model,
        processing_class=tokenizer,
        train_dataset=dataset["train"],
        eval_dataset=dataset["validation"],
        args=SFTConfig(
            output_dir=str(Path(args.output).parent / "dosha-checkpoints"),
            dataset_text_field="text",
            max_length=args.max_seq_length,
            per_device_train_batch_size=args.batch_size,
            per_device_eval_batch_size=1,
            gradient_accumulation_steps=args.gradient_accumulation,
            warmup_ratio=0.03,
            num_train_epochs=args.epochs,
            max_steps=args.max_steps,
            learning_rate=args.learning_rate,
            logging_steps=5,
            eval_strategy="steps",
            eval_steps=100,
            save_strategy="steps",
            save_steps=100,
            optim="adamw_8bit",
            weight_decay=0.001,
            lr_scheduler_type="cosine",
            seed=args.seed,
            report_to="none",
        ),
    )
    trainer = train_on_responses_only(trainer)
    trainer.train()
    model.save_pretrained(args.output)
    tokenizer.save_pretrained(args.output)


if __name__ == "__main__":
    main()
