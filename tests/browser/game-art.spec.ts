import { test, expect } from "@playwright/test";
import { initialState } from "../../lib/learning/state";

for (const kind of ["asyk", "arqan", "baige", "aqsuiek", "ushty"]) {
  test(`${kind}: visual scene and lifecycle`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const state = initialState();
    state.profile.onboarded = true;
    await page.route("**/api/learning", (r) =>
      r.fulfill({
        json: { state, revision: 0, userId: "art-test", writable: false },
      }),
    );
    await page.goto(`/learn/national/${kind}`);
    await page
      .getByRole("button", { name: "Ойынды бастау", exact: true })
      .click();
    await expect(page.locator(".vw-scene")).toBeVisible();
    await page.addStyleTag({
      content: "nextjs-portal { display: none !important; }",
    });
    await page
      .getByRole("button", { name: "Үзіліс / сақтау", exact: true })
      .click();
    // Keep both compositions at the same game state and viewport for comparison.
    await page
      .locator(".vw-pause")
      .evaluate((el) => ((el as HTMLElement).style.visibility = "hidden"));
    await page.locator(".vw-stage").screenshot({
      path: `test-results/art-${process.env.ART_CAPTURE ?? "after"}-${kind}-${info.project.name}.png`,
    });
    if (kind === "asyk")
      await page.screenshot({
        path: `test-results/art-ui-${info.project.name}.png`,
        fullPage: true,
      });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Жалғастыру", exact: true }).click();
    await page.locator(".vw-controls button").first().click();
    await expect(page.locator(".vw-score")).toContainText("1");
    await page
      .getByRole("button", { name: "Раундты тоқтату", exact: true })
      .click();
    await expect(page.locator(".vw-result")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Қайта ойнау", exact: true }),
    ).toBeEnabled();
    await page
      .getByRole("button", { name: "Қайта ойнау", exact: true })
      .click();
    await expect(page.locator(".vw-result")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test("asyk: one saka, pause in flight and authoritative reload", async ({
  page,
}) => {
  const state = initialState();
  state.profile.onboarded = true;
  await page.route("**/api/learning", (r) =>
    r.fulfill({
      json: { state, revision: 0, userId: "flight-test", writable: false },
    }),
  );
  await page.goto("/learn/national/asyk");
  await page
    .getByRole("button", { name: "Ойынды бастау", exact: true })
    .click();
  await page.waitForTimeout(120);
  await expect(page.locator('[data-bone-kind="saka"]')).toHaveCount(1);
  await page.getByRole("button", { name: "Сақаны ат", exact: true }).click();
  await expect(page.locator(".qa-scene")).toHaveAttribute(
    "data-shot-active",
    "true",
  );
  await expect(page.locator('[data-bone-kind="saka"]')).toHaveCount(1);
  await page
    .getByRole("button", { name: "Үзіліс / сақтау", exact: true })
    .click();
  await page.waitForTimeout(100);
  const position = await page
    .locator('[data-bone-kind="saka"]')
    .getAttribute("transform");
  await page.waitForTimeout(200);
  await expect(page.locator('[data-bone-kind="saka"]')).toHaveAttribute(
    "transform",
    position!,
  );
  await page.reload();
  await expect(page.locator(".qa-scene")).toHaveAttribute(
    "data-shot-active",
    "false",
  );
  await expect(page.locator(".vw-score")).toContainText("1");
});

test("real victory rewards once, replay has no reward animation", async ({
  page,
}) => {
  const state = initialState();
  state.profile.onboarded = true;
  await page.route("**/api/learning", (r) =>
    r.fulfill({
      json: { state, revision: 0, userId: "reward-test", writable: false },
    }),
  );
  await page.goto("/learn/national/hantalapai");
  await page
    .getByRole("button", { name: "Ойынды бастау", exact: true })
    .click();
  const win = async () => {
    for (let i = 0; i < 9; i++) {
      await page.waitForTimeout(100);
      await page.locator(".vw-controls button").first().click();
    }
    await expect(
      page.getByRole("button", { name: "Қайта ойнау", exact: true }),
    ).toBeEnabled();
  };
  await win();
  await expect(page.locator(".qa-reward-earned")).toContainText("30 XP");
  const wallet = await page.getByLabel("Баланс", { exact: true }).innerText();
  await page.reload();
  await expect(page.getByLabel("Баланс", { exact: true })).toHaveText(wallet);
  await page.getByRole("button", { name: "Қайта ойнау", exact: true }).click();
  await win();
  await expect(page.locator(".qa-reward-earned")).toHaveCount(0);
  await expect(page.getByLabel("Баланс", { exact: true })).toHaveText(wallet);
});

test("system reduced motion stays effective when preference is toggled", async ({
  page,
}) => {
  const state = initialState();
  state.profile.onboarded = true;
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/learning", (r) =>
    r.fulfill({
      json: { state, revision: 0, userId: "motion-test", writable: false },
    }),
  );
  await page.goto("/learn/national/baige");
  await page
    .getByRole("button", { name: "Ойынды бастау", exact: true })
    .click();
  await page.getByLabel("Анимацияны азайту").click();
  await expect(page.locator(".vw-game")).toHaveClass(/vw-reduced/);
  await page.waitForTimeout(100);
  await page.getByRole("button", { name: "Үдет", exact: true }).click();
  await expect(page.locator(".vw-score")).toContainText("1");
});
