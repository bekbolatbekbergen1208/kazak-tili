import { test, expect } from "@playwright/test";
import { initialState } from "../../lib/learning/state";
async function localLearning(page: import("@playwright/test").Page) {
  const state = initialState();
  state.profile.onboarded = true;
  state.profile.nickname = "Оқушы";
  await page.route("**/api/learning", async (r) =>
    r.fulfill({
      json: { state, revision: 0, userId: "local-user", writable: false },
    }),
  );
}
test("Vision shows uncatalogued objects, switches vocabulary and resizes large photos (mocked AI)", async ({
  page,
}) => {
  await localLearning(page);
  await page.route("**/api/vision", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { configured: true, signedIn: true } });
    expect(route.request().postDataJSON().image.length).toBeLessThan(4_500_000);
    return route.fulfill({
      json: {
        quality: "clear",
        summary: "Үстелде домбыра мен кітап тұр.",
        tip: "",
        word: null,
        confidence: 0.9,
        alternatives: [{ id: "book", kk: "кітап" }],
        objects: [
          {
            id: null,
            kk: "домбыра",
            ru: "домбра",
            en: "dombra",
            plural: "домбыралар",
            example: "Мен домбыра тартамын.",
            description: "Екі ішекті аспап.",
            confidence: 0.9,
          },
          {
            id: "book",
            kk: "кітап",
            ru: "книга",
            en: "book",
            plural: "кітаптар",
            example: "Мен кітап оқимын.",
            description: "Үстелдегі кітап.",
            confidence: 0.85,
          },
        ],
      },
    });
  });
  await page.goto("/learn/vision?demo=0");
  const png = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2200;
    canvas.height = 1000;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#dfede6";
    context.fillRect(0, 0, 2200, 1000);
    context.fillStyle = "#ae4234";
    context.fillRect(500, 200, 400, 600);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page.locator('input[type="file"]').setInputFiles({
    name: "objects.png",
    mimeType: "image/png",
    buffer: Buffer.from(png, "base64"),
  });
  await expect(
    page.getByRole("heading", { name: "домбыра", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Мен домбыра тартамын.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Жауапты тексеру" }),
  ).toHaveCount(0);
  const preview = page.getByAltText("Таңдалған кадр");
  await expect
    .poll(() => preview.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBe(1600);
  await page.getByRole("combobox", { name: "Кадрдағы зат" }).selectOption("1");
  await expect(
    page.getByRole("heading", { name: "кітап", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Жауапты тексеру" }),
  ).toBeVisible();
  await page.getByRole("combobox", { name: "Кадрдағы зат" }).selectOption("0");
  await expect(
    page.getByRole("heading", { name: "домбыра", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/vision-multi-${test.info().project.name}.png`,
    fullPage: true,
  });
  const panel = await page.locator(".vs-result").boundingBox();
  const manual = await page.locator(".vs-manual").boundingBox();
  const collection = await page.locator(".vs-collection").boundingBox();
  expect(manual!.y + manual!.height).toBeLessThanOrEqual(
    panel!.y + panel!.height,
  );
  expect(collection!.y).toBeGreaterThanOrEqual(panel!.y + panel!.height);
});
test("Vision cancels stale results, retries and rejects a broken image (mocked AI)", async ({
  page,
}) => {
  await localLearning(page);
  let calls = 0;
  let finish: (() => void) | undefined;
  const held = new Promise<void>((resolve) => {
    finish = resolve;
  });
  await page.route("**/api/vision", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { configured: true, signedIn: true } });
    calls++;
    if (calls === 1) await held;
    await route
      .fulfill({
        json: {
          word: { id: "book", kk: "кітап" },
          confidence: 0.9,
          alternatives: [],
        },
      })
      .catch(() => {});
  });
  await page.goto("/learn/vision?demo=0");
  const file = page.locator('input[type="file"]');
  await file.setInputFiles({
    name: "broken.png",
    mimeType: "image/png",
    buffer: Buffer.from("broken-image"),
  });
  await expect(page.locator(".vs-result")).not.toContainText(
    "Сурет өңделіп жатыр",
  );
  expect(calls).toBe(0);
  await file.setInputFiles({
    name: "book.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z9QAAAABJRU5ErkJggg==",
      "base64",
    ),
  });
  await expect.poll(() => calls).toBe(1);
  await page.getByRole("button", { name: "Тоқтату", exact: true }).click();
  await expect(page.locator(".vs-result")).toContainText("Тану тоқтатылды.");
  finish!();
  await page.getByRole("button", { name: "Қайта тану", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "кітап", exact: true }),
  ).toBeVisible();
  expect(calls).toBe(2);
  await page
    .getByRole("button", { name: "Басқа затты қарау", exact: true })
    .click();
  await expect(page.getByAltText("Таңдалған кадр")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "кітап", exact: true }),
  ).toHaveCount(0);
});
test("Vision uses upload fallback, confirms uncertain object, speaks and saves a valid sentence", async ({
  page,
}) => {
  await localLearning(page);
  await page.route("**/api/vision", async (r) => {
    if (r.request().method() === "GET")
      return r.fulfill({ json: { configured: true } });
    const body = r.request().postDataJSON();
    expect(body.image).toMatch(/^data:image\/jpeg;base64,/);
    return r.fulfill({
      json: {
        word: { id: "book", kk: "кітап" },
        confidence: 0.55,
        alternatives: [{ id: "notebook", kk: "дәптер" }],
      },
    });
  });
  await page.goto("/learn/vision?demo=0");
  await expect(
    page.getByRole("heading", { name: "Айналаңдағы қазақ тілі" }),
  ).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles({
    name: "book.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z9QAAAABJRU5ErkJggg==",
      "base64",
    ),
  });
  await expect(page.getByText("Меніңше, бұл — кітап")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "кітап", exact: true }),
  ).toBeVisible();
  await page.getByLabel("кітап сөзін дыбыстау").click();
  await page.getByPlaceholder("Қазақша жауап жаз…").fill("кітап");
  await page.getByRole("button", { name: "Жауапты тексеру" }).click();
  await expect(
    page.getByText("Жауапты қазақша толықтыр", { exact: false }),
  ).toBeVisible();
  await page.getByPlaceholder("Қазақша жауап жаз…").fill("Мен кітап оқимын.");
  await page.getByRole("button", { name: "Жауапты тексеру" }).click();
  await expect(
    page.getByText("коллекцияға қосылды", { exact: false }),
  ).toBeVisible();
  await expect(page.locator(".vs-collection")).toContainText("1 / 30");
  await page.screenshot({
    path: `test-results/vision-${test.info().project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
  await page.reload();
  await expect(page.locator(".vs-collection")).toContainText("1 / 30");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("Vision permission denial keeps file alternative usable", async ({
  page,
}) => {
  await localLearning(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: async () => {
          throw new DOMException("denied", "NotAllowedError");
        },
      },
    });
  });
  await page.goto("/learn/vision?demo=0");
  await page.getByRole("button", { name: /Камераны қосу/ }).click();
  await expect(page.locator(".vs-error")).toContainText("рұқсат берілмеді");
  await expect(
    page.getByRole("button", { name: /Сурет жүктеу/ }),
  ).toBeEnabled();
});
test("friendship hub supports enable, QR, request, accept, safe message and management UI", async ({
  page,
}) => {
  await localLearning(page);
  let enabled = false,
    requested = false,
    accepted = false,
    message = false;
  await page.route("**/api/friends", async (route) => {
    const method = route.request().method(),
      body = method === "POST" ? route.request().postDataJSON() : {};
    if (body.type === "enable") enabled = true;
    if (body.type === "request") requested = true;
    if (body.type === "respond") accepted = true;
    if (body.type === "message") message = true;
    const requests =
      requested && !accepted
        ? [
            {
              id: "00000000-0000-0000-0000-000000000002",
              otherName: "arman",
              incoming: true,
            },
          ]
        : [];
    const friends = accepted
      ? [
          {
            id: "00000000-0000-0000-0000-000000000003",
            username: "arman",
            points: 125,
            level: { name: "Оқу серіктестері", max: 299 },
            days: 4,
            streak: { current: 3, best: 4 },
            missions: [
              {
                id: "m",
                title: "Бірге 10 жаңа сөз жинаңдар",
                target: 10,
                a: 4,
                b: 6,
                total: 10,
                complete: true,
              },
            ],
            teamTasks: 1,
            lastMessage: message ? { message: "Жарайсың!" } : null,
          },
        ]
      : [];
    return route.fulfill({
      json: enabled
        ? {
            enabled: true,
            code: "AB12CD34",
            username: "learner",
            invitePath: "/learn/friends?invite=AB12CD34",
            requests,
            friends,
          }
        : { enabled: false },
    });
  });
  await page.goto("/learn/friends?demo=0&invite=AB12CD34");
  await page.getByRole("button", { name: "Дос кодын жасау" }).click();
  await expect(page.getByText("AB12CD34")).toBeVisible();
  await page.getByText("QR-кодты көрсету").click();
  await expect(
    page.getByAltText("Дос шақыру сілтемесінің QR-коды"),
  ).toBeVisible();
  await page.getByRole("button", { name: /Сұрау жіберу/ }).click();
  await page.getByRole("button", { name: "Қабылдау" }).click();
  await expect(page.getByText("Оқу серіктестері")).toBeVisible();
  await expect(page.getByText("Сен: 4 · Досың: 6")).toBeVisible();
  await page
    .getByRole("combobox", { name: "Қауіпсіз хабарлама" })
    .selectOption("Жарайсың!");
  await page.getByRole("button", { name: /Жіберу/ }).click();
  await expect(page.getByText("Соңғы реакция: «Жарайсың!»")).toBeVisible();
  await page.getByRole("button", { name: "Достықты басқару" }).click();
  await expect(page.getByRole("button", { name: /Бұғаттау/ })).toBeVisible();
  await page.screenshot({
    path: `test-results/friendship-${test.info().project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
