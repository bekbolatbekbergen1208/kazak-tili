import { test, expect, type Page } from "@playwright/test";
import { initialState } from "../../lib/learning/state";
import { worldGames } from "../../lib/national/world-catalog";
async function seed(page: Page) {
  const state = initialState();
  state.profile.onboarded = true;
  await page.route("**/api/learning", (r) =>
    r.fulfill({
      json: { state, revision: 0, userId: "world-test", writable: false },
    }),
  );
}
test("village has 18 accessible destinations and no horizontal overflow", async ({
  page,
}, info) => {
  await seed(page);
  await page.goto("/learn/national");
  await expect(
    page.getByRole("heading", { name: "Ұлттық ойындар әлемі", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".vw-game-list>a")).toHaveCount(18);
  await page.waitForTimeout(450);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/world-village-${info.project.name}.png`,
    fullPage: true,
  });
});
for (const game of worldGames)
  test(`${game.name}: opens, controls, result, replay and village`, async ({
    page,
  }, info) => {
    test.setTimeout(120000);
    await seed(page);
    await page.goto(`/learn/national/${game.id}`);
    await page
      .getByRole("button", { name: "Ойынды бастау", exact: true })
      .click();
    await expect(page.locator(".vw-score")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const result = page.locator(".vw-result");
    const click = async (name: string) => {
      await page.getByRole("button", { name, exact: true }).click();
      await page.waitForTimeout(150);
    };
    if (game.id === "togyz") {
      await page.locator(".vw-board .vw-pits button:enabled").first().click();
      await page
        .getByRole("button", {
          name: "Тоғызқұмалақ: үйрету режимі",
          exact: true,
        })
        .click();
      await expect(page.locator(".vw-tutorial .vw-pits")).toBeVisible();
      await click("Раундты тоқтату");
    } else
      for (let i = 0; i < 45 && !(await result.count()); i++) {
        switch (game.id) {
          case "asyk":
            await click("Сақаны ат");
            break;
          case "arqan":
            await click("Тарт");
            break;
          case "tenge":
            await click("Еңкей · жина");
            break;
          case "baige":
          case "qyzquu":
            await click(i % 3 === 2 ? "Демал" : "Үдет");
            break;
          case "aqsuiek":
          case "soqyrteke":
          case "kokpar":
            await click("Оңға →");
            break;
          case "saqina":
            await page.waitForTimeout(2300);
            await click("1-алақан");
            break;
          case "audaryspaq":
            await click(i % 3 === 2 ? "Демал" : "Солға");
            break;
          case "jamby":
            await click("Жебені ат");
            break;
          case "altybaqan":
            await click(i % 2 ? "Оң" : "Сол");
            break;
          case "oramal":
            await click("Жүгір");
            break;
          case "hantalapai":
            await page.locator(".vw-controls button").first().click();
            await page.waitForTimeout(150);
            break;
          case "bestas":
            await page.locator(".vw-controls button").first().click();
            await page.waitForTimeout(150);
            break;
          case "aigolek":
            await page.locator(".vw-controls button").first().click();
            await page.waitForTimeout(150);
            break;
          case "ushty":
            await click("Ұшты");
            break;
        }
      }
    await expect(result).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Қайта ойнау", exact: true }),
    ).toBeEnabled();
    await page.screenshot({
      path: `test-results/world-${game.id}-${info.project.name}.png`,
      fullPage: true,
    });
    await click("Қайта ойнау");
    await expect(result).toHaveCount(0);
    await click("Раундты тоқтату");
    await page.getByRole("link", { name: "Ауылға оралу", exact: true }).click();
    await expect(page.locator(".vw-game-list>a")).toHaveCount(18);
  });
test("pause persists a round, reduced motion and live FPS indicator", async ({
  page,
}, info) => {
  await seed(page);
  await page.goto("/learn/national/ushty");
  await page
    .getByRole("button", { name: "Ойынды бастау", exact: true })
    .click();
  await page.waitForTimeout(2200);
  console.log(
    `${info.project.name} measured ${await page.locator('[title="Осы браузердегі белсенді кадрлар"]').innerText()}`,
  );
  await page.getByRole("button", { name: "Ұшты", exact: true }).click();
  await page
    .getByRole("button", { name: "Үзіліс / сақтау", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Ұшты", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await expect(page.locator(".vw-score")).toContainText("1");
  await page.getByLabel("Анимацияны азайту").check();
  await expect(page.locator(".vw-game")).toHaveClass(/vw-reduced/);
});
