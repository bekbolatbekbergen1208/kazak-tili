import { test, expect, type Page } from "@playwright/test";
import { initialState } from "../../lib/learning/state";
import { freshNational } from "../../lib/national/state";
import { hydrateCharacters, getCollection } from "../../lib/characters/state";
import { questions } from "../../lib/national/catalog";
async function seed(page: Page, xp = 0) {
  const input = initialState();
  input.profile.onboarded = true;
  input.profile.animations = false;
  input.progress.xp = xp;
  input.progress.coins = 100;
  input.progress.national = freshNational();
  input.progress.national.crystals = 10;
  const s = hydrateCharacters(input);
  getCollection(s).announcedIds = getCollection(s).unlocked.map(
    (c) => c.characterId,
  );
  await page.addInitScript((s) => {
    if (!localStorage.getItem("national-test")) {
      localStorage.setItem("qazaqdos-learning-demo-v1", JSON.stringify(s));
      localStorage.setItem("national-test", "1");
    }
    sessionStorage.setItem("qd-demo", "1");
  }, s);
}
async function correctAnswer(page: Page) {
  const panel = page.locator(".ng-question"),
    prompt = await panel.locator("h2").innerText(),
    q = questions.find((q) => q.prompt === prompt)!;
  await panel
    .getByRole("button", { name: q.options[q.answer], exact: true })
    .click();
}
test("village onboarding, locked game and responsive pages", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/learn/national");
  await expect(
    page.getByRole("heading", { name: "Ұлттық ойындар", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Түсіндім, бастайық!" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Түсіндім, бастайық!" }),
  ).toHaveCount(0);
  await expect(page.getByText("🔒 2-деңгейде ашылады")).toBeVisible();
  await page.screenshot({
    path: `test-results/national-village-${test.info().project.name}.png`,
    fullPage: true,
  });
  for (const screen of [
    "character",
    "upgrade",
    "shop",
    "daily",
    "rewards",
    "result",
  ]) {
    await page.goto(`/learn/national/${screen}`);
    await expect(page.locator(".ng-heading h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
  }
});
test("asyk keyboard shot persists after reload and finishes with result", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/learn/national/asyk");
  await page.getByRole("button", { name: "Бастау", exact: true }).click();
  await correctAnswer(page);
  const slider = page.getByRole("slider").last();
  await slider.focus();
  await page.keyboard.press("End");
  await page.getByRole("button", { name: "Ату →", exact: true }).click();
  await expect(page.getByText("4 соққы қалды")).toBeVisible();
  await page.reload();
  await expect(page.getByText("4 соққы қалды")).toBeVisible();
  for (let i = 0; i < 4; i++) {
    if (page.url().includes("/result")) break;
    await correctAnswer(page);
    await page.getByRole("button", { name: "Ату →", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Сақа қозғалып жатыр…" }),
    ).toHaveCount(0);
  }
  await expect(page).toHaveURL(/\/result/);
  await expect(page.getByText("Марапатың дайын!")).toBeVisible();
});
test("arqan wins through knowledge and records reward once", async ({
  page,
}) => {
  await seed(page, 210);
  await page.goto("/learn/national/arqan");
  await page.getByRole("button", { name: "Бастау", exact: true }).click();
  for (let i = 0; i < 4; i++) {
    await correctAnswer(page);
  }
  await expect(page).toHaveURL(/\/result/);
  await expect(
    page.getByRole("heading", { name: "Жарайсың! Жеңіске жеттің!" }),
  ).toBeVisible();
  const wallet = await page.locator(".ng-top span").innerText();
  await page.reload();
  await expect(page.locator(".ng-top span")).toHaveText(wallet);
});
test("shop confirmation and crystal upgrades persist", async ({ page }) => {
  await seed(page);
  await page.goto("/learn/national/shop");
  const card = page.locator("article").filter({
    has: page.getByRole("heading", { name: "Шашу · Жеңіс жұлдыздары" }),
  });
  await card.getByRole("button", { name: "Сатып алу" }).click();
  await page.getByRole("button", { name: "Бас тарту", exact: true }).click();
  await expect(page.locator(".ng-top span")).toContainText("💎 10");
  await card.getByRole("button", { name: "Сатып алу" }).click();
  await page.getByRole("button", { name: "Растау", exact: true }).click();
  await expect(page.locator(".ng-top span")).toContainText("💎 4");
  await expect(
    card.getByRole("button", { name: "✓ Сатып алынды" }),
  ).toBeDisabled();
  await page.goto("/learn/national/upgrade");
  await page.getByRole("button", { name: "Дамыту · 3 💎" }).first().click();
  await page.getByRole("button", { name: "Растау", exact: true }).click();
  await page.reload();
  await expect(page.getByText("Күш · 1 / 5")).toBeVisible();
  await expect(page.locator(".ng-top span")).toContainText("💎 1");
});

test("saka supports actual mouse/touch dragging", async ({ page }, info) => {
  await seed(page);
  await page.goto("/learn/national/asyk");
  await page.getByRole("button", { name: "Бастау", exact: true }).click();
  await correctAnswer(page);
  const canvas = page.locator("canvas");
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!,
    x = box.x + box.width * 0.5,
    y = box.y + box.height * 0.88,
    endY = Math.min(y + 45, (page.viewportSize()?.height ?? 900) - 4);
  if (info.project.name === "mobile") {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x - 15, y: endY }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await cdp.detach();
  } else {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 15, endY, { steps: 6 });
    await page.mouse.up();
  }
  await expect(page.getByText("4 соққы қалды")).toBeVisible();
  await page.screenshot({
    path: `test-results/national-asyk-${info.project.name}.png`,
    fullPage: true,
  });
});
