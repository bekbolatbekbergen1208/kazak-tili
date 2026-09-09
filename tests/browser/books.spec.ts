import { test, expect, type Page } from "@playwright/test";
import { readingBooks, tasksFor, battleFor } from "../../lib/books/catalog";

async function onboard(page: Page) {
  await page.goto("/learn/books?demo=1");
  await expect(
    page.getByRole("heading", { name: "Как вам удобнее учиться?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "English", exact: false }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Nickname").fill("Book Explorer");
  await page.getByRole("button", { name: "Create my path" }).click();
  await expect(
    page.getByRole("heading", { name: "Сәлем, Book Explorer!" }),
  ).toBeVisible();
  await page.goto("/learn/books");
}
async function dismissRewards(page: Page) {
  const keep = page.getByRole("button", {
    name: "Keep in collection",
    exact: true,
  });
  if (await keep.isVisible()) await keep.click();
  const level = page
    .getByRole("dialog")
    .filter({ has: page.getByRole("heading", { name: /New level/ }) });
  if (await level.isVisible())
    await level.getByRole("button", { name: "Continue", exact: true }).click();
}
test("book journey: filter, read, nine activities, timed final, certificate, reload", async ({
  page,
}) => {
  test.setTimeout(120000);
  page.setDefaultTimeout(10000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await onboard(page);
  await expect(page.locator(".bw-card")).toHaveCount(15);
  await page.getByRole("button", { name: /^Жеңіл/ }).click();
  await expect(page.locator(".bw-card")).toHaveCount(3);
  await page.getByRole("button", { name: /^Барлығы/ }).click();
  await page
    .getByRole("textbox", { name: "Кітап немесе авторды іздеу" })
    .fill("Қожа");
  await expect(page.locator(".bw-card")).toHaveCount(1);
  await page
    .getByRole("textbox", { name: "Кітап немесе авторды іздеу" })
    .fill("табылмайтынкітап");
  await expect(page.getByRole("status")).toContainText("Кітап табылмады");
  await page
    .getByRole("textbox", { name: "Кітап немесе авторды іздеу" })
    .fill("");
  await page.screenshot({
    path: `test-results/books-shelf-${test.info().project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Менің атым Қожа кітабын ашу" }).click();
  await page.waitForURL("**/learn/books/qozha", { timeout: 15000 });
  await expect(page.getByRole("button", { name: /🎮 Ойындар/ })).toBeDisabled();
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: /^Оқыдым/ }).click();
  await expect(
    page.getByRole("heading", { name: "Оқиға енді сенің қолыңда" }),
  ).toBeVisible();
  const book = readingBooks[0];
  for (const task of tasksFor(book)) {
    await page
      .locator(".bw-game-card")
      .filter({
        has: page.getByRole("heading", { name: task.title, exact: true }),
      })
      .click();
    if (task.kind === "order") {
      for (const chapter of book.chapters)
        await page
          .getByRole("button", { name: `${chapter.title} +`, exact: true })
          .click();
    } else if (task.kind === "match") {
      for (const v of book.vocabulary)
        await page
          .getByRole("combobox", { name: v.word, exact: true })
          .selectOption(v.meaning);
    } else if (task.kind === "map") {
      for (const label of [
        "Мінезі",
        "Мақсаты",
        "Әрекеті",
        "Басқалармен байланысы",
      ])
        await page
          .getByLabel(label, { exact: true })
          .fill("Қожа өз қатесін түсініп, жақсы адам болуға ұмтылады.");
    } else if (task.kind === "ending") {
      await page
        .getByRole("textbox", { name: "Сенің жауабың" })
        .fill(
          "Қожа достарына көмектесті. Ол өз қатесін мойындады. Балалар бірге кітап оқыды.",
        );
    } else if (task.kind === "opinion") {
      await page
        .getByRole("textbox", { name: "Сенің жауабың" })
        .fill(
          "Мен Қожа сияқты қателігімді түсініп, достарыма көмектесуге тырысар едім.",
        );
    } else {
      if (task.kind === "character") {
        await page.getByRole("radio", { name: "Жантас", exact: true }).check();
        await page.getByRole("button", { name: "Жауапты тексеру" }).click();
        await expect(
          page.getByRole("status").filter({ hasText: "Тағы байқап көр" }),
        ).toBeVisible();
      }
      await page.getByRole("radio", { name: task.answer, exact: true }).check();
    }
    await page
      .getByRole("button", { name: /Жауапты (тексеру|сақтау)/ })
      .click();
    await expect(
      page.getByRole("status").filter({ hasText: "✓ Сақталды" }),
    ).toBeVisible();
    await dismissRewards(page);
    await page.getByRole("button", { name: "Тапсырмаларға оралу →" }).click();
  }
  await page.getByRole("button", { name: "⚡ Финал", exact: true }).click();
  await page
    .getByRole("button", { name: "Шайқасты бастау", exact: true })
    .click();
  await expect(page.getByRole("timer")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "⚡ Финал", exact: true }).click();
  for (let i = 0; i < 10; i++) {
    const prompt = await page.locator(".bw-battle h3").innerText();
    const question = battleFor(book).find((q) => q.prompt === prompt)!;
    expect(question).toBeTruthy();
    await page
      .locator(".bw-options")
      .getByRole("button", { name: question.answer, exact: true })
      .click();
  }
  await page.getByRole("button", { name: "Нәтижені сақтау" }).click();
  await expect(page.locator(".bw-score")).toHaveText("10 / 10");
  await dismissRewards(page);
  await page
    .getByRole("button", { name: "🏅 Сертификат", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "ОҚЫРМАН СЕРТИФИКАТЫ" }),
  ).toBeVisible();
  await expect(page.locator(".bw-reader-name")).toHaveText("Book Explorer");
  await page.screenshot({
    path: `test-results/books-certificate-${test.info().project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.reload();
  await expect(
    page.getByRole("progressbar", { name: "Кітап прогресі", exact: true }),
  ).toHaveAttribute("value", "100");
  await page
    .getByRole("button", { name: "🏅 Сертификат", exact: true })
    .click();
  await expect(page.locator(".bw-reader-name")).toHaveText("Book Explorer");
  expect(errors).toEqual([]);
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".bw-certificate")).toBeVisible();
  await expect(page.locator(".bw-tabs")).toBeHidden();
  await page.pdf({
    path: `test-results/books-certificate-${test.info().project.name}.pdf`,
    preferCSSPageSize: true,
    printBackground: true,
  });
});
