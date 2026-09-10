import { test, expect, type Page } from "@playwright/test";
import { historyCities } from "../../lib/history/catalog";
import { initialState } from "../../lib/learning/state";

async function onboard(page: Page) {
  await page.goto("/learn/history?demo=1");
  await expect(
    page.getByRole("heading", { name: "Как вам удобнее учиться?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "English", exact: false }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Nickname").fill("History Explorer");
  await page.getByRole("button", { name: "Create my path" }).click();
  await expect(
    page.getByRole("heading", { name: "Сәлем, History Explorer!" }),
  ).toBeVisible();
  await page.goto("/learn/history");
}
async function dismissRewards(page: Page) {
  const keep = page.getByRole("button", {
    name: /^(Keep in collection|Коллекцияда қалдыру)$/,
  });
  if (await keep.isVisible()) await keep.click();
  const level = page.getByRole("dialog").filter({
    has: page.getByRole("heading", { name: /New level|Жаңа деңгей/ }),
  });
  if (await level.isVisible())
    await level
      .getByRole("button", { name: /^(Continue|Жалғастыру)$/ })
      .click();
}
test("history: map, keyboard and touch, three complete cities, equipment, notebook and reload", async ({
  page,
}) => {
  test.setTimeout(180000);
  page.setDefaultTimeout(10000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await onboard(page);
  await expect(page.locator(".hs-pin")).toHaveCount(10);
  await expect(page.locator(".hs-country path")).toHaveCount(21);
  await page
    .getByRole("button", { name: "Сарайшық · жабық", exact: true })
    .click();
  await expect(page.locator(".hs-city-card")).toContainText(
    "Бұл деңгей әзірленуде",
  );
  await page
    .getByRole("button", { name: "Түркістан · жабық", exact: true })
    .click();
  await expect(page.locator(".hs-city-card")).toContainText("Алдымен Отырар");
  await page
    .getByRole("button", { name: "Отырар · ашық", exact: true })
    .click();
  await page.getByRole("button", { name: /Түнгі көрініс/ }).click();
  await expect(page.locator(".hs-world")).toHaveClass(/hs-night/);
  await page.getByRole("button", { name: /Күндіз/ }).click();
  await page.screenshot({
    path: `test-results/history-map-${test.info().project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
  await page
    .getByRole("link", { name: "Саяхатты бастау →", exact: true })
    .click();
  for (const city of historyCities.filter((c) => c.ready)) {
    await page.waitForURL(`**/learn/history/${city.id}`);
    await page.getByRole("button", { name: "Қалаға кіру →" }).click();
    await page.getByRole("button", { name: "Келесі →", exact: true }).click();
    await page.getByRole("button", { name: "Келесі →", exact: true }).click();
    await page
      .getByRole("button", { name: "Зерттеуді бастау", exact: true })
      .click();
    const scene = page.getByRole("region", {
      name: `${city.name} қаласын зерттеу`,
    });
    await expect(scene).toBeVisible();
    await expect(page.locator(".hs-task-card").first()).toBeDisabled();
    if (city.id === "otyrar") {
      await scene.focus();
      const before = await page
        .getByTestId("history-traveler")
        .getAttribute("style");
      await page.keyboard.down("d");
      await page.waitForTimeout(220);
      await page.keyboard.up("d");
      await expect(page.getByTestId("history-traveler")).not.toHaveAttribute(
        "style",
        before!,
      );
      const right = page.getByRole("button", { name: "Оңға", exact: true });
      await right.scrollIntoViewIfNeeded();
      const box = (await right.boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(130);
      await page.mouse.up();
      await page.getByRole("button", { name: "Тұрған орнымды сақтау" }).click();
      const saved = await page
        .getByTestId("history-traveler")
        .getAttribute("style");
      await page.reload();
      await expect(page.getByTestId("history-traveler")).toHaveAttribute(
        "style",
        saved!,
      );
    }
    await page.screenshot({
      path: `test-results/history-${city.id}-${test.info().project.name}.png`,
      fullPage: true,
      animations: "disabled",
    });
    for (const object of city.objects) {
      await scene
        .getByRole("button", { name: object.title, exact: true })
        .click();
      await expect(page.getByRole("dialog")).toContainText(object.fact);
      await page
        .getByRole("button", { name: "Дәптерге сақтау · +5 XP", exact: true })
        .click();
      await dismissRewards(page);
    }
    for (const task of city.tasks) {
      await page
        .locator(".hs-task-card")
        .filter({
          has: page.getByRole("heading", { name: task.title, exact: true }),
        })
        .click();
      const dialog = page.getByRole("dialog", {
        name: task.title,
        exact: true,
      });
      if (task.kind === "timeline" || task.kind === "route") {
        for (const option of JSON.parse(task.answer) as string[])
          await dialog
            .getByRole("button", { name: `${option} +`, exact: true })
            .click();
      } else if (task.kind === "match") {
        const answer = JSON.parse(task.answer) as string[];
        for (let i = 0; i < answer.length; i++)
          await dialog
            .getByRole("combobox", { name: task.labels![i], exact: true })
            .selectOption(answer[i]);
      } else if (task.kind === "build") {
        const answer = JSON.parse(task.answer) as string[];
        for (let i = 0; i < answer.length; i++) {
          await dialog
            .getByRole("button", { name: answer[i], exact: true })
            .click();
          await dialog
            .getByRole("button", {
              name: `${task.labels![i]}: бос`,
              exact: true,
            })
            .click();
        }
      } else {
        await dialog
          .getByRole("button", {
            name: task.options.find((o) => o !== task.answer)!,
            exact: true,
          })
          .click();
        await dialog
          .getByRole("button", { name: "Жауапты тексеру", exact: true })
          .click();
        await expect(dialog).toContainText("Ұпайың кемімейді");
        await expect(dialog).toContainText(task.hint);
        await dialog
          .getByRole("button", { name: task.answer, exact: true })
          .click();
      }
      await dialog
        .getByRole("button", { name: "Жауапты тексеру", exact: true })
        .click();
      await expect(dialog).toContainText("Тапсырма аяқталды");
      const newFriend = page.getByRole("button", {
        name: /^(Keep in collection|Коллекцияда қалдыру)$/,
      });
      if (await newFriend.isVisible()) await newFriend.click();
      await dialog
        .getByRole("button", { name: "Қалаға оралу", exact: true })
        .click();
      await dismissRewards(page);
    }
    await page
      .getByRole("button", { name: "Қорытындыны бастау", exact: true })
      .click();
    for (let i = 0; i < 3; i++) {
      const clue = await page.locator(".hs-hunt").innerText();
      const target = city.objects.find((o) => clue.includes(o.word.meaning))!;
      expect(target).toBeTruthy();
      await scene
        .getByRole("button", { name: target.title, exact: true })
        .click();
    }
    await dismissRewards(page);
    await expect(
      page.getByRole("heading", { name: `${city.badge}!`, exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Кейіпкерге тағу", exact: true })
      .click();
    await expect(page.locator(".hs-dossha")).toContainText(
      "Марапат кейіпкеріңе тағылды",
    );
    await expect(
      page.locator(`[data-item="${city.reward.itemId}"]`).first(),
    ).toBeAttached();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const next = historyCities.find((c) => c.previous === city.id);
    if (next?.ready)
      await page
        .getByRole("link", { name: `${next.name} ашылды →`, exact: true })
        .click();
  }
  await page
    .getByRole("link", { name: "Тарих дәптерін ашу", exact: true })
    .click();
  await page.waitForURL("**/learn/history/notebook");
  await expect(page.locator(".hs-artifact-grid>button")).toHaveCount(15);
  await expect(page.locator(".hs-notebook-summary")).toContainText("3 / 3");
  await page.reload();
  await expect(page.locator(".hs-artifact-grid>button")).toHaveCount(15);
  await page.locator(".hs-artifact-grid>button").first().click();
  await expect(page.getByRole("dialog")).toContainText(
    "АНИМАЦИЯЛЫҚ ОҚУ КАРТОЧКАСЫ",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.screenshot({
    path: `test-results/history-notebook-${test.info().project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
  expect(errors).toEqual([]);
});

test("history account fallback saves per user; failed map keeps city list usable", async ({
  page,
}) => {
  const state = initialState();
  state.profile.onboarded = true;
  state.profile.nickname = "Local Historian";
  let posts = 0;
  await page.route("**/api/learning", async (route) => {
    if (route.request().method() === "POST") posts++;
    await route.fulfill({
      json: {
        state,
        revision: 0,
        userId: "test-history-user",
        writable: false,
      },
    });
  });
  await page.route("**/travel/boundaries.json", (route) =>
    route.fulfill({ status: 503, body: "unavailable" }),
  );
  await page.goto("/learn/history?demo=0");
  await expect(page.locator(".hs-map-loading")).toContainText(
    "Карта жүктелмеді",
  );
  await page.getByRole("button", { name: /Түнгі көрініс/ }).click();
  await page.reload();
  await expect(page.locator(".hs-world")).toHaveClass(/hs-night/);
  await expect(page.locator(".hs-stats")).toContainText(
    "Осы браузерде сақталады",
  );
  await page
    .getByRole("link", { name: "Саяхатты бастау →", exact: true })
    .click();
  await page.getByRole("button", { name: "Қалаға кіру →" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Келесі →", exact: true }),
  ).toBeVisible();
  expect(posts).toBe(0);
  expect(
    await page.evaluate(
      () => !!localStorage.getItem("qazaqdos-learning-local-test-history-user"),
    ),
  ).toBe(true);
  await page.route("**/api/learning", (route) =>
    route.fulfill({
      json: { state, revision: 0, userId: "different-user", writable: false },
    }),
  );
  await page.goto("/learn/history/otyrar");
  await expect(
    page.getByRole("button", { name: "Қалаға кіру →" }),
  ).toBeVisible();
});
