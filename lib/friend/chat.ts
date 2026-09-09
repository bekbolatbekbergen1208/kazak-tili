export type ChatMessage = { role: "user" | "assistant"; content: string };
export function parseChat(body: unknown): {
  message: string;
  history: ChatMessage[];
  language: string;
} {
  if (!body || typeof body !== "object") throw Error("Invalid message");
  const b = body as Record<string, unknown>;
  if (
    typeof b.message !== "string" ||
    !b.message.trim() ||
    b.message.length > 2000
  )
    throw Error("Invalid message");
  const history = b.history ?? [];
  if (!Array.isArray(history) || history.length > 20)
    throw Error("Invalid history");
  for (const m of history)
    if (
      !m ||
      !["user", "assistant"].includes(m.role) ||
      typeof m.content !== "string" ||
      m.content.length > 7000
    )
      throw Error("Invalid history");
  if (history.reduce((sum, m) => sum + m.content.length, 0) > 24000)
    throw Error("History too long");
  return {
    message: b.message.trim(),
    history: history as ChatMessage[],
    language:
      typeof b.language === "string" &&
      ["kk", "ru", "en", "zh", "es", "de", "fr"].includes(b.language)
        ? b.language
        : "kk",
  };
}
export function boundedHistory(messages: ChatMessage[], max = 20) {
  const result: ChatMessage[] = [];
  let length = 0;
  for (const message of messages.slice(-max).reverse()) {
    if (length + message.content.length > 24000) break;
    result.unshift(message);
    length += message.content.length;
  }
  return result;
}
export const dosshaInstructions = `Сен — QazaqDos платформасындағы Досша, жылы сөйлейтін қазақ тілі мұғалімі және оқу серігісің.
Қазақ тіліне қатысты кез келген сұрақты түсінуге тырыс: фонетика, орфография, морфология, синтаксис, пунктуация, сөздік, тұрақты тіркес, мәтін түзету, эссе, әдеби шығарма және аударма. Тек «саяхат» немесе «ұшақ» тақырыбымен шектелме.
Әдепкіде қазақша жауап бер. Пайдаланушы түсіндіру не аудару тілін нақты сұраса, сол тілін ұстан. Сөйлеу үлгілерін қазақша да көрсет.
Сұраққа бірден нақты жауап бер, кейін қажет болса қысқа ереже, 2 мысал және бір шағын жаттығу ұсын. Қарапайым сұраққа ұзақ дәріс жазба. Сөйлем түзетуде түпнұсқа → дұрыс нұсқа → себебі тәртібін қолдан. Аудармада алдымен аударманы бер.
Сұрақ түсініксіз болса, бір нақтылау сұрағын қой. Алдыңғы хабарламалардағы контексті есте ұста. Қате пікірді сыпайы түзет. Оқушыны кемсітпе. Сенімді болмасаң, ашық айт; дерек, ереже, кітап оқиғасы немесе дәйексөз ойлап таппа. Түпнұсқа кітапты толық көшірме, қысқаша мазмұнда.
Сен оқу көмекшісісің. Жеке құпия деректерді сұрама. Жасына лайық түсіндір. Басқа тақырыптағы сұраққа қысқаша көмектесіп, қажет болса қазақ тіліндегі пайдалы мысалға байланыстыр.
Жауапты қарапайым мәтінмен бер: қысқа абзацтар мен нөмірленген тізімдер қолдануға болады, HTML жазба.`;
export async function requestDossha({
  key,
  model,
  history,
  message,
  language,
  context,
  fetcher = fetch,
}: {
  key: string;
  model: string;
  history: ChatMessage[];
  message: string;
  language: string;
  context?: string;
  fetcher?: typeof fetch;
}) {
  const response = await fetcher("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions: `${dosshaInstructions}\nТүсіндіру тілінің таңдауы: ${language}.${context ? `\nОқу анықтамасы:\n${context}` : ""}`,
      input: [...boundedHistory(history), { role: "user", content: message }],
      max_output_tokens: 1800,
      store: false,
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok)
    throw Error(response.status === 429 ? "AI_BUSY" : "AI_UNAVAILABLE");
  const data = await response.json();
  const output = Array.isArray(data.output) ? data.output : [];
  const reply = output
    .flatMap(
      (item: {
        type?: string;
        content?: { type?: string; text?: string; refusal?: string }[];
      }) =>
        item.type === "message" && Array.isArray(item.content)
          ? item.content
              .filter((c) => c.type === "output_text" || c.type === "refusal")
              .map((c) => c.text ?? c.refusal ?? "")
          : [],
    )
    .join("\n")
    .trim();
  if (!reply || data.status === "incomplete" || data.error)
    throw Error("AI_UNAVAILABLE");
  return reply.slice(0, 7000);
}
