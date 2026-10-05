#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v nvidia-smi >/dev/null 2>&1; then
  echo "NVIDIA GPU is required for QLoRA training." >&2
  exit 1
fi

echo "== GPU =="
nvidia-smi

if [ ! -d .venv ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate

python -m pip install --upgrade pip
pip install -r training/requirements.txt

npm ci
npm run training:dataset
python training/validate_data.py

echo "== smoke training =="
python training/train_dosha.py --max-steps "${DOSHA_SMOKE_STEPS:-20}"

if [ "${DOSHA_FULL_TRAIN:-0}" != "1" ]; then
  echo "Smoke training completed. Set DOSHA_FULL_TRAIN=1 to run the full epoch."
  exit 0
fi

echo "== full training =="
python training/train_dosha.py --epochs "${DOSHA_EPOCHS:-1}"

echo "== export to Ollama =="
python training/export_to_ollama.py --kind text --create-ollama

echo "== models =="
ollama list

echo "Dosha training/export completed."
