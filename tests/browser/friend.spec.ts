import { test, expect } from "@playwright/test";
test("Doszhan reference API and mobile/desktop chat answer grammar questions", async ({
  page,
  request,
}) => {
  const response = await request.post("/api/ai-friend", {
    data: { message: "Қазақ тілінде неше септік бар?" },
  });
  expect(response.ok()).toBe(true);
  expect((await response.json()).reply).toContain("7 септік");
  const invalid = await request.post("/api/ai-friend", {
    data: { message: "" },
  });
  expect(invalid.status()).toBe(400);
  const crossOrigin = await request.post("/api/ai-friend", {
    headers: { origin: "https://invalid.example" },
    data: { message: "Сәлем" },
  });
  expect(crossOrigin.status()).toBe(403);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/student/friend");
  await expect(
    page.getByRole("heading", { name: "Досжан", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Қазір жергілікті анықтамалық режимі", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Қазақ тілінде неше септік бар?",
      exact: true,
    })
    .click();
  await expect(page.getByRole("log")).toContainText("7 септік");
  await page
    .getByRole("textbox", { name: "Хабарлама", exact: true })
    .fill("Зат есім деген не?");
  await page.getByRole("button", { name: "Жіберу", exact: true }).click();
  await expect(page.getByRole("log")).toContainText("Жалқы есім");
  await page.screenshot({
    path: `test-results/dossha-${test.info().project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
  const profile = await page.locator(".chat > aside").boundingBox();
  const chat = await page.locator(".chat > section").boundingBox();
  if (test.info().project.name === "mobile")
    expect(chat!.y).toBeGreaterThanOrEqual(profile!.y + profile!.height - 1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test("Doszhan live UI preserves context, restores failed messages and retries without duplicates (mocked provider)", async ({
  page,
}) => {
  let attempts = 0;
  await page.route("**/api/ai-friend", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({
        json: {
          mode: "ai",
          signedIn: true,
          aiConfigured: true,
          persistence: true,
          history: [
            { role: "user", content: "Сәлем" },
            { role: "assistant", content: "Сәлем, бірге үйренейік!" },
          ],
        },
      });
    const body = route.request().postDataJSON();
    expect(body.language).toBe("es");
    expect(body.history).toHaveLength(2);
    expect(body.message).toBe("Мына сөйлемді аудар");
    attempts++;
    if (attempts === 1)
      return route.fulfill({
        status: 503,
        json: { error: "Қайта жіберіп көр." },
      });
    return route.fulfill({
      json: {
        mode: "ai",
        reply: "Қай сөйлемді аудару керек? Мәтінді жібер.",
        saved: true,
      },
    });
  });
  await page.goto("/student/friend");
  await expect(page.getByRole("log")).toContainText("бірге үйренейік!");
  await page.getByRole("combobox", { name: "Жауап тілі" }).selectOption("es");
  await page
    .getByRole("textbox", { name: "Хабарлама", exact: true })
    .fill("Мына сөйлемді аудар");
  await page.getByRole("button", { name: "Жіберу", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Қайта жіберіп көр." }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Хабарлама", exact: true }),
  ).toHaveValue("Мына сөйлемді аудар");
  await page.getByRole("button", { name: "Жіберу", exact: true }).click();
  await expect(page.getByRole("log")).toContainText(
    "Қай сөйлемді аудару керек?",
  );
  await expect(
    page.getByRole("log").getByText("Мына сөйлемді аудар", { exact: true }),
  ).toHaveCount(1);
  expect(attempts).toBe(2);
});
test("writing mode sends the selected genre and style", async ({ page }) => {
  let requestBody: Record<string, unknown> | undefined;
  await page.route("**/api/ai-friend", (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({
        json: { mode: "ai", signedIn: true, history: [] },
      });
    requestBody = route.request().postDataJSON();
    return route.fulfill({
      json: { mode: "ai", reply: "Түзетілген мәтін: ..." },
    });
  });
  await page.goto("/student/friend");
  await page.getByRole("checkbox", { name: "Мәтінді түзету" }).check();
  await page
    .getByRole("combobox", { name: "Жанр" })
    .selectOption("formalLetter");
  await page.getByRole("combobox", { name: "Стиль" }).selectOption("formal");
  await page
    .getByRole("textbox", { name: "Хабарлама" })
    .fill("Маған жауап беріңіз тез.");
  await page.getByRole("button", { name: "Жіберу" }).click();
  await expect(page.getByRole("log")).toContainText("Түзетілген мәтін");
  expect(requestBody?.writing).toEqual({
    genre: "formalLetter",
    style: "formal",
  });
});

test("voice screen speaks one caption at a time and returns the dialog to chat", async ({
  page,
}) => {
  await page.route("**/api/dossha/voice", (route) =>
    route.fulfill({ status: 503, json: { error: "unavailable" } }),
  );
  await page.addInitScript(() => {
    const w = window as typeof window & {
      __recognition?: {
        onresult?: ((event: unknown) => void) | null;
      };
      __utterances?: Array<{ text: string; onend?: () => void }>;
      __cancelled?: number;
    };
    class FakeRecognition {
      lang = "";
      interimResults = false;
      continuous = false;
      onresult: ((event: unknown) => void) | null = null;
      onerror: ((event: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      start() {
        w.__recognition = this;
      }
      stop() {
        this.onend?.();
      }
      abort() {
        this.onend?.();
      }
    }
    class FakeUtterance {
      lang = "";
      rate = 1;
      voice = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(public text: string) {}
    }
    w.__utterances = [];
    w.__cancelled = 0;
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: FakeRecognition,
    });
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: FakeUtterance,
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        getVoices: () => [],
        cancel: () => {
          w.__cancelled = (w.__cancelled ?? 0) + 1;
        },
        speak: (utterance: { text: string; onend?: () => void }) => {
          w.__utterances?.push(utterance);
        },
      },
    });
  });
  await page.route("**/api/ai-friend", (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({
        json: { mode: "reference", signedIn: false, history: [] },
      });
    return route.fulfill({
      json: {
        mode: "reference",
        reply: "Бірінші сөйлем. Екінші сөйлем.",
        saved: false,
      },
    });
  });
  await page.goto("/student/friend");
  await page
    .getByRole("button", { name: "Досжанмен дауыспен сөйлесу" })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Досжанмен дауыстық әңгіме",
  });
  await expect(dialog).toBeVisible();
  await page.evaluate(() => {
    const w = window as typeof window & {
      __recognition?: { onresult?: (event: unknown) => void };
    };
    w.__recognition?.onresult?.({
      results: [{ 0: { transcript: "Сәлем, Досжан" }, isFinal: true }],
    });
  });
  await expect(dialog.getByRole("status")).toHaveText("Бірінші сөйлем.");
  await page.evaluate(() => {
    const w = window as typeof window & {
      __utterances?: Array<{ onend?: () => void }>;
    };
    w.__utterances?.[0]?.onend?.();
  });
  await expect(dialog.getByRole("status")).toHaveText("Екінші сөйлем.");
  await page
    .getByRole("button", { name: "Дауыстық режимді жабу және чатқа оралу" })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("log")).toContainText("Сәлем, Досжан");
  await expect(page.getByRole("log")).toContainText(
    "Бірінші сөйлем. Екінші сөйлем.",
  );
});

test("voice subtitle stays visible if the browser cannot synthesize sound", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const w = window as typeof window & {
      __recognition?: { onresult?: ((event: unknown) => void) | null };
    };
    class FakeRecognition {
      lang = "";
      interimResults = false;
      continuous = false;
      onresult: ((event: unknown) => void) | null = null;
      onerror = null;
      onend = null;
      start() {
        w.__recognition = this;
      }
      stop() {}
      abort() {}
    }
    class FakeUtterance {
      lang = "";
      rate = 1;
      voice = null;
      onend = null;
      onerror: ((event: unknown) => void) | null = null;
      constructor(public text: string) {}
    }
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: FakeRecognition,
    });
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: FakeUtterance,
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        getVoices: () => [],
        cancel: () => {},
        speak: (utterance: FakeUtterance) =>
          utterance.onerror?.({ error: "synthesis-failed" }),
      },
    });
  });
  await page.route("**/api/dossha/voice", (route) =>
    route.fulfill({ status: 503 }),
  );
  await page.route("**/api/ai-friend", (route) =>
    route.fulfill({
      json:
        route.request().method() === "GET"
          ? { mode: "reference", history: [] }
          : { mode: "reference", reply: "Досжанның жауабы көрініп тұр." },
    }),
  );
  await page.goto("/student/friend");
  await page
    .getByRole("button", { name: "Досжанмен дауыспен сөйлесу" })
    .click();
  await page.evaluate(() => {
    const w = window as typeof window & {
      __recognition?: { onresult?: (event: unknown) => void };
    };
    w.__recognition?.onresult?.({
      results: [{ 0: { transcript: "Сәлем" }, isFinal: true }],
    });
  });
  const dialog = page.getByRole("dialog", {
    name: "Досжанмен дауыстық әңгіме",
  });
  await expect(dialog.getByRole("status")).toHaveText(
    "Досжанның жауабы көрініп тұр.",
  );
  await expect(dialog.getByRole("alert")).toContainText(
    "дауысын ойнату мүмкін болмады",
  );
  await expect(dialog.getByRole("status")).toHaveText(
    "Досжанның жауабы көрініп тұр.",
  );
});
