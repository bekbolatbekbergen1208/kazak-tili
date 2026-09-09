import { test, expect } from "@playwright/test";
test("Dossha reference API and mobile/desktop chat answer grammar questions", async ({
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
    page.getByText("Қазір қазақша анықтамалық режимі", { exact: false }),
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
test("Dossha live UI preserves context, restores failed messages and retries without duplicates (mocked provider)", async ({
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
