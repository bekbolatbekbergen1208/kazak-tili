import { test, expect, type Page } from "@playwright/test";
import { initialState, applyAction } from "../../lib/learning/state";
import { hydrateCharacters, getCollection } from "../../lib/characters/state";
import { characters } from "../../lib/characters/config";
async function seed(page: Page, xp: number, coins = 0) {
  let s = initialState();
  s.profile = {
    ...s.profile,
    language: "en",
    nickname: "Explorer",
    onboarded: true,
  };
  s.progress.xp = xp;
  s = applyAction(s, { type: "profile", profile: s.profile });
  s.progress.coins = coins;
  s = hydrateCharacters(s);
  getCollection(s).announcedIds = characters
    .filter((c) => xp >= c.unlockXP)
    .map((c) => c.id);
  await page.addInitScript((value) => {
    if (!localStorage.getItem("qd-test-seeded")) {
      localStorage.setItem("qazaqdos-learning-demo-v1", JSON.stringify(value));
      localStorage.setItem("qd-test-seeded", "1");
    }
    sessionStorage.setItem("qd-demo", "1");
  }, s);
}
test("100 XP unlocks Balapan, reveals once, selection follows learner", async ({
  page,
}) => {
  await seed(page, 90);
  await page.goto("/learn/tourism-1");
  await page.getByRole("button", { name: "Start lesson", exact: true }).click();
  await page.getByRole("radio", { name: "Hello", exact: true }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "A new friend unlocked!" }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "Балапан", exact: true }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Choose as companion" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.locator('.char-companion [data-character="balapan"]'),
  ).toBeVisible();
  await page.goto("/learn/characters");
  await expect(
    page
      .getByTestId("character-card-balapan")
      .getByRole("button", { name: "Selected" }),
  ).toBeDisabled();
  await expect(page.locator(".char-card.is-locked")).toHaveCount(6);
  await expect(
    page.getByText("250 XP to unlock Қоңыр", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page
      .getByTestId("character-card-balapan")
      .getByRole("button", { name: "Selected" }),
  ).toBeDisabled();
  await page.screenshot({
    path: `test-results/characters-${test.info().project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
test("preview, buy, equip and remove skins/accessories preserve balance and inventory", async ({
  page,
}) => {
  await seed(page, 1000, 100);
  await page.goto("/learn/shop");
  const skin = page.getByTestId("shop-item-skin-steppe");
  await skin.getByRole("button", { name: "Preview Steppe gold" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "No coins have been spent.",
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Back", exact: true })
    .click();
  await expect(page.locator(".char-balance")).toHaveText("100");
  await skin.getByRole("button", { name: "Buy", exact: true }).click();
  await expect(page.locator(".char-balance")).toHaveText("60");
  await skin.getByRole("button", { name: "Equip", exact: true }).click();
  await expect(
    skin.getByRole("button", { name: "Equipped", exact: true }),
  ).toBeDisabled();
  const glasses = page.getByTestId("shop-item-glasses");
  await glasses.getByRole("button", { name: "Buy", exact: true }).click();
  await glasses.getByRole("button", { name: "Equip", exact: true }).click();
  await expect(
    page.locator('.char-dressing-room [data-item="glasses"]'),
  ).toBeVisible();
  await expect(page.locator(".char-balance")).toHaveText("40");
  await expect(
    page
      .getByTestId("shop-item-shapan")
      .getByRole("button", { name: "25 more coins needed" }),
  ).toBeDisabled();
  await page.goto("/learn/inventory");
  await expect(page.getByTestId("shop-item-skin-steppe")).toBeVisible();
  await expect(page.getByTestId("shop-item-glasses")).toBeVisible();
  await page.reload();
  await expect(
    page.locator('.char-dressing-room [data-item="glasses"]'),
  ).toBeVisible();
  await page.getByRole("button", { name: "Remove Explorer glasses" }).click();
  await expect(
    page.locator('.char-dressing-room [data-item="glasses"]'),
  ).toHaveCount(0);
  await expect(
    page
      .getByTestId("shop-item-glasses")
      .getByRole("button", { name: "Equip", exact: true }),
  ).toBeEnabled();
  await expect(page.locator(".char-balance")).toHaveText("40");
  await page.screenshot({
    path: `test-results/inventory-${test.info().project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
});
test("all eight SVG companions, emotion preview and reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seed(page, 1000, 0);
  await page.goto("/learn/characters");
  await expect(page.locator(".char-card")).toHaveCount(8);
  await expect(page.locator(".char-card.is-locked")).toHaveCount(0);
  for (const id of [
    "qonyr",
    "qyran",
    "aibar",
    "aqbota",
    "danaqulaq",
    "samuryq",
  ]) {
    await page
      .getByTestId(`character-card-${id}`)
      .getByRole("button", { name: "Choose", exact: true })
      .click();
    await expect(
      page.locator(`.char-feature-stage [data-character="${id}"]`),
    ).toBeVisible();
  }
  await page.getByRole("button", { name: "Victory", exact: true }).click();
  await expect(
    page.locator('.char-feature-stage [data-mood="victory"]'),
  ).toBeVisible();
  expect(
    await page
      .locator(".char-feature-stage .char-body")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  await page.screenshot({
    path: `test-results/collection-all-${test.info().project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
});
