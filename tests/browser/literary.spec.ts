import { test, expect } from "@playwright/test";
import { initialState } from "../../lib/learning/state";
async function prepare(page: import("@playwright/test").Page) {
  const state = initialState();
  state.profile.onboarded = true;
  state.profile.nickname = "Оқушы";
  await page.addInitScript((s) => {
    if (!localStorage.getItem("qazaqdos-learning-demo-v1"))
      localStorage.setItem("qazaqdos-learning-demo-v1", JSON.stringify(s));
    sessionStorage.setItem("qd-demo", "1");
  }, state);
}
test("literature → word explanation → save → comprehension → writing → one XP reward → recall", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await prepare(page);
  await page.goto("/learn/literature?demo=1");
  await page.getByRole("button", { name: /Күнделікті сөздер/ }).click();
  await page
    .locator(".lit-excerpt")
    .getByRole("button", { name: "кітап", exact: true })
    .click();
  await expect(
    page
      .locator(".lit-word")
      .getByRole("heading", { name: "кітап", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Сөздікке сақтау", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Сөздікке сақталды" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Мектепке", exact: true }).click();
  await page
    .getByRole("button", { name: "Кітап пен дәптер", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Әдебиетке жазылым жауабы" })
    .fill("Мен таңертең мектепке барамын.");
  await page
    .getByRole("button", { name: "Жауапты сақтау", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Мәтінді аяқтау · +20 XP", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "✓ Аяқталды", exact: true }),
  ).toBeDisabled();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("qazaqdos-learning-demo-v1")!)
            .progress.xp,
      ),
    )
    .toBe(20);
  await page.reload();
  await page.getByRole("button", { name: /Күнделікті сөздер/ }).click();
  await expect(
    page.getByRole("button", { name: "✓ Аяқталды", exact: true }),
  ).toBeDisabled();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("qazaqdos-learning-demo-v1")!).progress
          .xp,
    ),
  ).toBe(20);
  await page.goto("/learn/vocabulary");
  await page.getByRole("textbox", { name: "Еске түсірген сөз" }).fill("кітап");
  await page.getByRole("button", { name: "Тексеру", exact: true }).click();
  await expect(
    page.getByText("Қазір қайталайтын сөз жоқ.", { exact: false }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.screenshot({
    path: `test-results/literary-vocabulary-${test.info().project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
  expect(errors).toEqual([]);
});
test("writing coach explains a natural correction and transforms style for the selected demo level", async ({
  page,
}) => {
  await prepare(page);
  await page.goto("/learn/writing-coach?demo=1");
  await page
    .getByRole("textbox", { name: "Тексерілетін мәтін" })
    .fill("Мен магазинге бардым.");
  await page.getByRole("button", { name: "Ұсынысты көру →" }).click();
  await expect(
    page.getByText("Мен дүкенге бардым.", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator(".lit-coach-compare")
      .getByText("Мен магазинге бардым.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Сөйлемді көркемдет" }).click();
  await page
    .getByRole("textbox", { name: "Тексерілетін мәтін" })
    .fill("Күн жақсы болды.");
  await page.getByRole("button", { name: "Ұсынысты көру →" }).click();
  await expect(
    page.getByText("Күн ашық әрі жылы болды.", { exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.screenshot({
    path: `test-results/literary-coach-${test.info().project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
});
test("corpus administration is private and anonymous writes are rejected", async ({
  page,
}) => {
  await page.goto("/admin/kazakh-corpus");
  await expect(
    page.getByText("Бұл бөлім уәкілетті әкімшіге арналған."),
  ).toBeVisible();
  const res = await page.request.post("/api/literary/admin", {
    data: { action: "seed" },
  });
  expect(res.status()).toBe(403);
});
