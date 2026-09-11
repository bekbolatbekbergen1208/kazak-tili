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
test("Vision uses upload fallback, confirms uncertain object, speaks and saves a valid sentence", async ({
  page,
}) => {
  await localLearning(page);
  await page.route("**/api/vision", async (r) => {
    if (r.request().method() === "GET")
      return r.fulfill({ json: { configured: true } });
    const body = r.request().postDataJSON();
    expect(body.image).toMatch(/^data:image\/png;base64,/);
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
