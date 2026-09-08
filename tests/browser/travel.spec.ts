import { test, expect, type Page } from "@playwright/test";
import { initialState } from "../../lib/learning/state";
import { regions } from "../../lib/travel/catalog";
async function seed(page: Page) {
  const s = initialState();
  s.profile.onboarded = true;
  s.progress.travel = {
    regions: {},
    settings: { sound: false, animation: "off", follow: true, introSeen: true },
    achievements: [],
    announced: [],
  };
  await page.addInitScript((s) => {
    if (!localStorage.getItem("qd-travel-test")) {
      localStorage.setItem("qazaqdos-learning-demo-v1", JSON.stringify(s));
      localStorage.setItem("qd-travel-test", "1");
    }
    sessionStorage.setItem("qd-demo", "1");
  }, s);
}
async function closeAward(page: Page) {
  for (let i = 0; i < 4; i++) {
    const dialog = page.getByRole("dialog");
    if (!(await dialog.count())) break;
    const action = dialog
      .getByRole("button", {
        name: /Саяхатты жалғастыру|Оставить в коллекции|Продолжить/,
      })
      .first();
    if (await action.isVisible()) await action.click();
    else break;
  }
}

test("geographic map, all region routes, reload, and text fallback", async ({
  page,
}) => {
  await seed(page);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/kazakhstan");
  await expect(page.locator(".travel-boundary")).toHaveCount(20);
  await expect(page.locator(".travel-region-list a")).toHaveCount(20);
  await page.getByPlaceholder("Өңірді ізде…").fill("Алматы");
  await expect(page.locator(".travel-region-list a")).toHaveCount(2);
  await page.getByPlaceholder("Өңірді ізде…").fill("");
  await page.screenshot({
    path: `test-results/travel-map-${test.info().project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
  for (const r of regions) {
    await page.goto(`/kazakhstan/${r.slug}`);
    await expect(
      page.getByRole("heading", { name: r.nameKk, exact: true }),
    ).toBeVisible();
    await closeAward(page);
  }
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Шымкент қаласы", exact: true }),
  ).toBeVisible();
  await page.goto("/kazakhstan");
  await page.route("**/travel/boundaries.json", (route) => route.abort());
  await page.reload();
  await expect(
    page.getByText("Карта жүктелмеді.", { exact: false }),
  ).toBeVisible();
  await expect(page.locator(".travel-region-list a")).toHaveCount(20);
  await closeAward(page);
  await page
    .locator('.travel-region-list a[href="/kazakhstan/astana"]')
    .click();
  await expect(
    page.getByRole("heading", { name: "Астана қаласы", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("object learning, all three games and progress persist without replay awards", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/kazakhstan/mangystau");
  await expect(
    page.getByRole("heading", { name: "Маңғыстау облысы", exact: true }),
  ).toBeVisible();
  await closeAward(page);
  await page
    .getByRole("button", { name: "Каспий итбалығы зерттеу", exact: true })
    .click();
  await expect(page.locator(".travel-object-detail")).toContainText("Каспийде");
  await page.getByRole("button", { name: "Нысан карточкасын жабу" }).click();
  await page
    .locator(".travel-word-grid button")
    .filter({ hasText: "түбек" })
    .click();
  await page
    .getByLabel("Орысша немесе ағылшынша аудармасын жаз")
    .fill("peninsula");
  await page.getByRole("button", { name: "Тексеру", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Дұрыс");
  await page.getByLabel("Орысша немесе ағылшынша аудармасын жаз").fill("wrong");
  await page.getByRole("button", { name: "Тексеру", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Қайталап көр");
  const r = regions.find((r) => r.id === "mangystau")!;
  for (let i = 0; i < 5; i++)
    await page
      .locator(".travel-quiz>div")
      .nth(i)
      .getByRole("radio", { name: r.games.quiz[i].answer, exact: true })
      .check();
  await page.getByRole("button", { name: "Quiz нәтижесін тексеру" }).click();
  await expect(page.locator(".travel-correct")).toHaveCount(5);
  await page
    .getByRole("button", { name: "Суретті сәйкестендір", exact: true })
    .click();
  for (let i = 0; i < 3; i++)
    await page
      .getByLabel(`Сурет ${i + 1} атауы`)
      .selectOption(r.games.matching[i]);
  await page.getByRole("button", { name: "Жұптарды тексеру" }).click();
  await expect(page.getByText("✓ Барлық жұп дұрыс!")).toBeVisible();
  await page
    .getByRole("button", { name: "Сөйлем құрастыр", exact: true })
    .click();
  for (const word of r.games.sentence)
    await page
      .locator(".travel-word-bank")
      .getByRole("button", { name: word, exact: true })
      .click();
  await page.getByRole("button", { name: "Сөйлемді тексеру" }).click();
  await expect(page.getByText("✓ Сөйлем дұрыс!")).toBeVisible();
  await page.reload();
  await expect(page.locator(".travel-region-progress")).toContainText("60 XP");
  await expect(page.locator(".travel-region-progress")).toContainText(
    "Сөздер: 1/10",
  );
  await page.screenshot({
    path: `test-results/travel-region-${test.info().project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await page.getByRole("button", { name: "Қазақша тыңдау" }).count(),
  ).toBe(0);
});
test("interruptible movement, zoom shares coordinates and reduced motion", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/kazakhstan");
  await expect(page.locator(".travel-boundary")).toHaveCount(20);
  await page.getByText("Саяхат баптаулары", { exact: true }).click();
  await page.getByLabel("Анимация", { exact: true }).selectOption("full");
  await page
    .getByRole("button", { name: "Астана қаласы таңдау", exact: true })
    .click();
  await page.getByRole("button", { name: "Үлкейту", exact: true }).click();
  await page
    .locator(".travel-boundary")
    .filter({ has: page.locator("title", { hasText: "Маңғыстау облысы" }) })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".travel-destination h2")).toHaveText(
    "Маңғыстау облысы",
  );
  await page.getByRole("button", { name: /Бірден өту/ }).click();
  await expect(page).toHaveURL(/\/kazakhstan\/mangystau$/);
  await expect(
    page.getByRole("heading", { name: "Маңғыстау облысы", exact: true }),
  ).toBeVisible();
  await closeAward(page);
  await page.goBack();
  await expect(page.locator(".travel-map-tools")).toContainText("2×");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".travel-map-block")).toHaveClass(/motion-off/);
});

test("full Mangystau completion queues a stamp and persists exactly one reward", async ({
  page,
}) => {
  const { applyAction } = await import("../../lib/learning/state");
  const { coreSections } = await import("../../lib/travel/types");
  const r = regions.find((r) => r.id === "mangystau")!;
  let s = initialState();
  s.profile.onboarded = true;
  s.profile.animations = false;
  s = applyAction(s, { type: "travel-visit", regionId: r.id });
  s = applyAction(s, { type: "travel-announce", id: "first" });
  for (const sectionId of coreSections)
    s = applyAction(s, { type: "travel-section", regionId: r.id, sectionId });
  for (const word of r.vocabulary)
    s = applyAction(s, {
      type: "travel-word",
      regionId: r.id,
      wordId: word.id,
      answer: word.en,
    });
  s = applyAction(s, {
    type: "travel-game",
    regionId: r.id,
    game: "quiz",
    answers: r.games.quiz.map((q) => q.answer),
  });
  s = applyAction(s, {
    type: "travel-game",
    regionId: r.id,
    game: "matching",
    answers: r.games.matching,
  });
  await page.addInitScript((value) => {
    if (!localStorage.getItem("qd-complete-seeded")) {
      localStorage.setItem("qazaqdos-learning-demo-v1", JSON.stringify(value));
      localStorage.setItem("qd-complete-seeded", "1");
    }
    sessionStorage.setItem("qd-demo", "1");
  }, s);
  await page.goto("/kazakhstan/mangystau");
  await page
    .getByRole("button", { name: "Сөйлем құрастыр", exact: true })
    .click();
  for (const word of r.games.sentence)
    await page
      .locator(".travel-word-bank")
      .getByRole("button", { name: word, exact: true })
      .click();
  await page.getByRole("button", { name: "Сөйлемді тексеру" }).click();
  await page
    .getByRole("button", { name: "Оставить в коллекции", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Жаңа мөр ашылды!", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Саяхатты жалғастыру", exact: true })
    .click();
  await expect(page.locator(".travel-region-progress")).toContainText("195 XP");
  await expect(page.locator(".travel-region-progress")).toContainText(
    "✓ Мөр алынды",
  );
  await page.reload();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Сөйлем құрастыр", exact: true })
    .click();
  for (const word of r.games.sentence)
    await page
      .locator(".travel-word-bank")
      .getByRole("button", { name: word, exact: true })
      .click();
  await page.getByRole("button", { name: "Сөйлемді тексеру" }).click();
  await expect(page.locator(".travel-region-progress")).toContainText("195 XP");
});

test("map objects focus at 4x; panning and returning to region preserve usable controls", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/kazakhstan");
  await expect(page.locator(".travel-boundary")).toHaveCount(20);
  await page.getByRole("button", { name: "Үлкейту", exact: true }).click();
  const object = page.getByRole("button", {
    name: "Каспий итбалығы картада зерттеу",
    exact: true,
  });
  await object.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".travel-map-tools")).toContainText("4×");
  await expect(page.locator(".travel-object-detail")).toContainText("Каспийде");
  const before = await page.locator(".travel-camera").getAttribute("style");
  await page.getByRole("button", { name: "Картаны шығысқа жылжыту" }).click();
  await expect(page.locator(".travel-camera")).not.toHaveAttribute(
    "style",
    before!,
  );
  await page.getByRole("button", { name: "Өңір көрінісіне қайту" }).click();
  await expect(page.locator(".travel-map-tools")).toContainText("2×");
  await expect(page.locator(".travel-object-detail")).toHaveCount(0);
  await page.getByRole("button", { name: "Толық карта", exact: true }).click();
  await expect(page.locator(".travel-map-svg")).toHaveCSS(
    "touch-action",
    "pan-y",
  );
});
