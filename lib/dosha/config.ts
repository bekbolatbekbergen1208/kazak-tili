const trimUrl = (value: string | undefined) =>
  value?.trim().replace(/\/+$/, "");

export function ollamaBaseUrl() {
  return trimUrl(
    process.env.OLLAMA_BASE_URL ?? process.env.QAZAQDOS_AI_BASE_URL,
  );
}

export function doshaChatModel() {
  return (
    process.env.OLLAMA_MODEL?.trim() ||
    process.env.QAZAQDOS_CHAT_MODEL?.trim() ||
    "gemma3:4b"
  );
}

export function doshaVisionModel() {
  return (
    process.env.OLLAMA_VISION_MODEL?.trim() ||
    process.env.QAZAQDOS_VISION_MODEL?.trim() ||
    process.env.OLLAMA_MODEL?.trim() ||
    "gemma3:4b"
  );
}
