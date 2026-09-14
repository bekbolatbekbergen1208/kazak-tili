export type LocalAiMessage =
  | { role: "system" | "user" | "assistant"; content: string }
  | {
      role: "user";
      content: (
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      )[];
    };

export function localAiConfigured(model: string | undefined) {
  return Boolean(process.env.QAZAQDOS_AI_BASE_URL && model);
}

export async function requestLocalChat({
  model,
  messages,
  maxTokens,
  temperature = 0.2,
  signal,
  fetcher = fetch,
}: {
  model: string;
  messages: LocalAiMessage[];
  maxTokens: number;
  temperature?: number;
  signal?: AbortSignal;
  fetcher?: typeof fetch;
}) {
  const baseUrl = process.env.QAZAQDOS_AI_BASE_URL?.replace(/\/+$/, "");
  if (!baseUrl) throw Error("AI_DISABLED");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.QAZAQDOS_AI_KEY)
    headers.Authorization = `Bearer ${process.env.QAZAQDOS_AI_KEY}`;
  const imageMessages = messages.map((message) => {
    if (typeof message.content === "string") return message;
    const text = message.content
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n");
    const images = message.content
      .filter((part) => part.type === "image_url")
      .map((part) => part.image_url.url.match(/^data:image\/png;base64,(.+)$/)?.[1])
      .filter((part): part is string => Boolean(part));
    return { role: message.role, content: text, images };
  });
  const hasImage = imageMessages.some(
    (message) => "images" in message && message.images.length,
  );
  if (hasImage) {
    const ollamaUrl = baseUrl.endsWith("/v1")
      ? baseUrl.slice(0, -3)
      : baseUrl.replace(/\/openai$/i, "");
    const response = await fetcher(`${ollamaUrl}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: imageMessages,
        options: {
          temperature,
          num_predict: maxTokens,
        },
        stream: false,
      }),
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(45000)])
        : AbortSignal.timeout(45000),
    });
    if (!response.ok)
      throw Error(response.status === 429 ? "AI_BUSY" : "AI_UNAVAILABLE");
    const data = await response.json();
    const reply =
      typeof data?.message?.content === "string" ? data.message.content.trim() : "";
    if (!reply) throw Error("AI_UNAVAILABLE");
    return reply;
  }
  const response = await fetcher(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    }),
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(45000)])
      : AbortSignal.timeout(45000),
  });
  if (!response.ok)
    throw Error(response.status === 429 ? "AI_BUSY" : "AI_UNAVAILABLE");
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  const text = Array.isArray(content)
    ? content.map((part) => part?.text ?? "").join("\n")
    : typeof content === "string"
      ? content
      : "";
  const reply = text.trim();
  if (!reply) throw Error("AI_UNAVAILABLE");
  return reply;
}
