# Dosha KZ training pipeline

QazaqDos uses a local Gemma 3 4B base model and QLoRA/Unsloth. The runtime Literary Intelligence / RAG layer and model fine-tuning are separate:

- **Fine-tuning** teaches Dosha how to answer in natural Kazakh.
- **RAG** supplies approved knowledge and language examples at request time.
- **Q-Level** controls learner difficulty.
- **Literary DNA** supplies abstract language traits only; it must not copy copyrighted prose.

## 1. Prerequisites

Use a Linux machine with an NVIDIA GPU for QLoRA. The ordinary web server does not need to train the model.

Install Node dependencies:

```bash
npm ci
```

Create a Python environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r training/requirements.txt
```

## 2. Generate and validate the dataset

```bash
npm run training:dataset
python3 training/validate_data.py
```

Expected text files:

- `training/data/dosha-train.jsonl`
- `training/data/dosha-validation.jsonl`

Literary DNA rows come from `training/literary-dna-rows.ts`. They use original QazaqDos examples and abstract profiles from `lib/literary/dna.ts`.

Do not add full copyrighted books to the dataset. For protected works, use metadata, rights-cleared excerpts, human-authored analysis, or original educational examples.

## 3. Smoke training

Before a full run:

```bash
python training/train_dosha.py --max-steps 20
```

If the smoke run succeeds and GPU memory is stable, start the normal run:

```bash
python training/train_dosha.py --epochs 1
```

Default base model:

```text
unsloth/gemma-3-4b-it
```

Output adapter:

```text
training/artifacts/dosha-lora
```

## 4. Export to Ollama

After training:

```bash
python training/export_to_ollama.py --kind text --create-ollama
```

Then verify:

```bash
ollama list
ollama run dosha
```

## 5. Evaluate

Keep evaluation prompts held out from training.

```bash
npm run training:evaluate
```

Review at least:

- grammar accuracy
- natural Kazakh word order
- Russian-calque avoidance
- A1–C1 level control
- dialogue naturalness
- literary description without author imitation
- refusal to fabricate quotations

## 6. Supabase / RAG

Apply migrations in order, including:

- `202610050014_literary_intelligence.sql`
- `202610050015_kazakh_vectors.sql`
- `202610050016_literary_dna.sql`

The vector migration enables pgvector automatically.

Runtime variables:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...

OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=dosha
OLLAMA_VISION_MODEL=gemma3:4b
QAZAQDOS_EMBEDDING_MODEL=embeddinggemma
```

Never commit secrets. Rotate any secret that has been pasted into a chat or log.

## 7. Recommended release flow

```text
reviewed Kazakh data
→ dataset generation
→ validation
→ QLoRA smoke run
→ full QLoRA
→ held-out evaluation
→ export to Ollama
→ deploy as dosha
→ monitor teacher feedback
→ review corrections
→ next training version
```

Do not automatically train on raw user conversations or unreviewed AI replies.
