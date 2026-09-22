# Doszhan model training

This package prepares QazaqDos data for Gemma 3 4B fine-tuning with Unsloth. It
is based on the official Unsloth `python_scripts/Gemma3_(4B).py` and
`python_scripts/Gemma3_(4B)-Vision.py` examples. Training is intentionally not
run on the production server.

## Knowledge inventory

The generator imports application modules directly; it does not maintain a
second hand-copied knowledge base.

| Domain                             | Source                                             |
| ---------------------------------- | -------------------------------------------------- |
| 1000 lessons                       | `lib/curriculum.ts`                                |
| Regions and travel                 | `lib/travel/catalog.ts` and its enrichment modules |
| History                            | `lib/history/catalog.ts`                           |
| Literature                         | `lib/books/catalog.ts`                             |
| National games                     | `lib/national/world-catalog.ts`                    |
| Kazakh grammar                     | `lib/friend/grammar.ts`                            |
| Vision vocabulary                  | `lib/vision/words.ts`                              |
| Robotics terms and unified records | `lib/dosha/knowledge.ts`                           |
| Doszhan style and safety rules     | `lib/dosha/prompt.ts`                              |

## 1. Generate datasets

```bash
npm install
npm run training:dataset
```

Outputs are written under `training/data/`:

- `dosha-train.jsonl`
- `dosha-validation.jsonl`
- `dosha-vision-train.jsonl`
- `dosha-vision-validation.jsonl`
- `manifest.json`

Rows use chat `messages`. The split is deterministic by record ID, so repeated
runs do not move examples randomly between train and validation.

### Vision images

The repository contains vocabulary metadata, but no licensed photo dataset for
the 30 Vision objects. Do not train object recognition on logos, unrelated
images, or duplicate synthetic cards. Add reviewed JPG, PNG, or WebP files:

```text
training/vision-images/book/001.jpg
training/vision-images/book/002.jpg
training/vision-images/apple/001.webp
```

Folder names must match IDs in `lib/vision/words.ts`. Keep image licenses and
consent records outside the model artifacts. Run the generator again; the
manifest lists missing classes. Vision training exits instead of silently
training an empty dataset.

## 2. Prepare a GPU environment

Use a separate Linux CUDA machine or Colab runtime. Gemma access may require a
Hugging Face account and accepted Gemma license.

```bash
python3 -m venv .venv-training
source .venv-training/bin/activate
pip install --upgrade pip
pip install -r training/requirements.txt
huggingface-cli login
```

Package pins mirror the referenced Unsloth notebooks. If the current Unsloth
installation guide requires a CUDA-specific install command, use that command
first, then install the remaining requirements.

The QazaqDos development Mac has no CUDA, Unsloth, or PyTorch installed. The
dataset can be generated there, but actual fine-tuning requires the separate GPU
runtime above. No model has been fine-tuned by the dataset-generation command.

## 3. Train Doszhan

Start with a short smoke run:

```bash
python training/train_dosha.py --max-steps 20
```

Then run the complete epoch after checking loss and sample quality:

```bash
python training/train_dosha.py \
  --epochs 1 \
  --max-steps -1 \
  --output training/artifacts/dosha-lora
```

The script uses 4-bit QLoRA, Gemma 3 chat formatting, and response-only loss.
Tune epochs and learning rate from held-out evaluation results, not only loss.
For compatibility with Gemma templates that do not expose a separate `system`
role, the formatter prepends the trusted Doszhan instruction to the first user
turn before tokenization.

## 4. Train Doszhan Vision

First ensure `manifest.json` reports enough balanced, reviewed images for every
class. Then run:

```bash
python training/train_dosha_vision.py --max-steps 20
python training/train_dosha_vision.py \
  --epochs 1 \
  --max-steps -1 \
  --output training/artifacts/dosha-vision-lora
```

The script follows Unsloth's Gemma 3 Vision format and uses
`UnslothVisionDataCollator`. Every target is the same structured JSON expected
by the existing `/api/dosha/vision` route.

## 5. Export and create Ollama models

Text export uses Unsloth's native GGUF exporter:

```bash
python training/export_to_ollama.py \
  --kind text \
  --quantization Q4_K_M \
  --create-ollama
ollama run dosha
```

Vision export merges the adapter into a Hugging Face model directory. Ollama
imports that directory so it retains the vision tower:

```bash
python training/export_to_ollama.py \
  --kind vision \
  --create-ollama
ollama run dosha-vision
```

For llama.cpp interoperability, clone and build a current llama.cpp, then ask
the exporter for both the language GGUF and multimodal projector:

```bash
git clone https://github.com/ggml-org/llama.cpp.git ../llama.cpp
cmake -S ../llama.cpp -B ../llama.cpp/build
cmake --build ../llama.cpp/build --target llama-quantize -j
python training/export_to_ollama.py \
  --kind vision \
  --llama-cpp ../llama.cpp
```

This produces `dosha-vision-f16.gguf`, a `mmproj-*.gguf`, and, when the
quantizer is built, `dosha-vision-Q4_K_M.gguf`. The separate projector pair is
for llama.cpp. The generated Ollama Modelfile uses the merged model directory,
because importing a standalone text GGUF would discard the vision tower.

## 6. Connect QazaqDos

After local evaluation, configure the existing backend without changing API
routes:

```dotenv
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=dosha
OLLAMA_VISION_MODEL=dosha-vision
```

```bash
ollama list
curl http://127.0.0.1:11434/api/chat \
  -d '{"model":"dosha","stream":false,"messages":[{"role":"user","content":"Барыс септігін түсіндір"}]}'
npm run typecheck
npm test
npm run build
```

Before deployment, compare base and fine-tuned models on the validation split,
unknown-fact refusal, Kazakh grammar, regional facts, and malformed/ambiguous
images. Fine-tuning supplements the runtime retrieval layer; it does not replace
the verified QazaqDos context sent by `/api/dosha/chat`.
