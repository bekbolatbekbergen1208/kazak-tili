import { test, expect } from "@playwright/test";
import { initialState } from "../../lib/learning/state";

test("full editorial lesson: dictionary, retry, saved answers, module next and mobile layout", async ({
  page,
}) => {
  const state = initialState();
  state.profile.onboarded = true;
  state.profile.language = "en";
  state.profile.goal = "daily";
  await page.addInitScript((s) => {
    if (!localStorage.getItem("qazaqdos-learning-demo-v1"))
      localStorage.setItem("qazaqdos-learning-demo-v1", JSON.stringify(s));
    sessionStorage.setItem("qd-demo", "1");
  }, state);
  await page.goto("/learn/daily-content-door-greeting?demo=1");
  await expect(
    page.getByRole("heading", { name: "Көршімен амандасу", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Айша үйден шықты.", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Менің сөздеріме қосу", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "✓ Сөздікке сақталды" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Start lesson", exact: true }).click();
  await page.getByRole("radio", { name: "Кассирмен", exact: true }).check();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(
    page.getByText("Added to your review list. Try again first."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await page.getByRole("radio", { name: "Көршісімен", exact: true }).check();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await page.reload();
  await page.getByRole("textbox", { name: "Your answer" }).fill("  БЕ!  ");
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  for (const word of ["Мен", "көршімен", "амандастым"])
    await page.getByRole("button", { name: word, exact: true }).click();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page
    .getByRole("radio", {
      name: "Жақсы, рақмет! Өзіңіз қалайсыз?",
      exact: true,
    })
    .check();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.route("**/api/ai-friend", (route) =>
    route.fulfill({ status: 503, contentType: "application/json", body: "{}" }),
  );
  await page.getByRole("button", { name: "Досшадан бағыт сұрау" }).click();
  await expect(
    page.locator(".qd-content-hint").getByRole("alert"),
  ).toContainText("Досша қазір жауап бермеді");
  await page
    .getByRole("textbox", { name: "Your answer" })
    .fill("Сәлеметсіз бе, көрші! Қалыңыз қалай?");
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page
    .getByRole("button", { name: "Finish and collect rewards" })
    .click();
  // Existing reward modals remain part of the platform.
  const keep = page.getByRole("button", { name: "Keep in collection" });
  if (await keep.isVisible()) await keep.click();
  const continueButton = page.getByRole("button", {
    name: "Жалғастыру",
    exact: true,
  });
  if (await continueButton.isVisible()) await continueButton.click();
  await expect(
    page.getByRole("heading", { name: "Lesson complete!" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Next lesson", exact: true }),
  ).toHaveAttribute("href", "/learn/daily-content-new-classmate");
  const xp = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("qazaqdos-learning-demo-v1")!).progress
        .xp,
  );
  await page.reload();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("qazaqdos-learning-demo-v1")!).progress
          .xp,
    ),
  ).toBe(xp);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});

test("map filters and region links expose the authored lessons", async ({
  page,
}) => {
  const state = initialState();
  state.profile.onboarded = true;
  state.profile.language = "en";
  await page.addInitScript((s) => {
    localStorage.setItem("qazaqdos-learning-demo-v1", JSON.stringify(s));
    sessionStorage.setItem("qd-demo", "1");
  }, state);
  await page.goto("/learn/map?demo=1");
  await page.getByLabel("Оқу бағыты", { exact: true }).selectOption("study");
  await page.getByLabel("Сабақ деңгейі", { exact: true }).selectOption("B2");
  await expect(
    page.getByText("Жобаны таныстыру", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Сабақ деңгейі", { exact: true }).selectOption("A1");
  await expect(page.getByText("Жобаны таныстыру", { exact: true })).toHaveCount(
    0,
  );
  await page.goto("/kazakhstan/mangystau?demo=1");
  await expect(
    page.locator('a[href="/learn/tourism-content-mangystau-coast"]'),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
