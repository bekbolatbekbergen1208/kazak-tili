#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
voice_dir="$project_dir/.voice"
model_dir="$voice_dir/models"
model_name="kk_KZ-iseke-x_low.onnx"
base_url="https://huggingface.co/rhasspy/piper-voices/resolve/main/kk/kk_KZ/iseke/x_low"

if [[ "$(uname -s)" != "Linux" || "$(uname -m)" != "x86_64" ]]; then
  printf 'Автоматическая установка Piper поддерживает Linux x86_64.\n' >&2
  exit 1
fi
mkdir -p "$voice_dir"
if [[ ! -x "$voice_dir/piper/piper" ]]; then
  curl --fail --location --retry 2 --output "$voice_dir/piper_linux_x86_64.tar.gz" \
    'https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz'
  tar -xzf "$voice_dir/piper_linux_x86_64.tar.gz" -C "$voice_dir"
  rm "$voice_dir/piper_linux_x86_64.tar.gz"
fi
mkdir -p "$model_dir"
for file in "$model_name" "$model_name.json" MODEL_CARD; do
  if [[ ! -s "$model_dir/$file" ]]; then
    curl --fail --location --retry 2 --output "$model_dir/$file" "$base_url/$file"
  fi
done
printf '%s\n' '1674f3f4ce48981d77e500741afa4ff9  '"$model_dir/$model_name" | md5sum --check --status
printf 'Досжанның қазақша дауысы дайын.\n'
