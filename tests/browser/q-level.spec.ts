import { test, expect } from "@playwright/test";
import { initialState } from "../../lib/learning/state";
import { questionBank } from "../../lib/q-level/questions";
async function prepare(page: import("@playwright/test").Page) {
  const state = initialState();
  state.profile.onboarded = true;
  state.profile.nickname = "Бекболат";
  await page.addInitScript((s) => {
    localStorage.setItem("qazaqdos-learning-demo-v1", JSON.stringify(s));
    sessionStorage.setItem("qd-demo", "1");
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      value: class {
        constructor(public text: string) {}
      },
    });
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        getVoices: () => [{ lang: "kk-KZ" }],
        cancel: () => {},
        speak: (u: SpeechSynthesisUtterance) =>
          setTimeout(
            () => u.onend?.(new Event("end") as SpeechSynthesisEvent),
            10,
          ),
      },
    });
  }, state);
}
test("quick test resumes after refresh; results, passport, PNG, progress and mobile layout work", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await prepare(page);
  await page.goto("/learn/q-level/quick?demo=1");
  await page
    .getByRole("button", { name: "Деңгейді анықтау →", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(() => !!localStorage.getItem("qd-qlevel-demo-v1")),
    )
    .toBe(true);
  for (let i = 0; i < 16; i++) {
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("qd-qlevel-demo-v1")!),
    );
    const question = questionBank.find(
      (q) => q.id === saved.attempt.questionId,
    )!;
    await expect(
      page.getByRole("heading", { name: question.question, exact: true }),
    ).toBeVisible();
    if (question.skill === "listening") {
      await page.getByRole("button", { name: "Аудионы тыңдау" }).click();
      await expect(page.getByText("1 рет тыңдалды")).toHaveText(
        "1 рет тыңдалды",
      );
    }
    await page
      .getByRole("button", {
        name: new RegExp(String(question.correct_answer) + "$"),
      })
      .click();
    await page
      .getByRole("button", { name: "Жауап беру →", exact: true })
      .click();
    await expect
      .poll(async () =>
        page.evaluate(
          () =>
            JSON.parse(localStorage.getItem("qd-qlevel-demo-v1")!).attempt
              .answers.length,
        ),
      )
      .toBe(i + 1);
    if (i === 3) {
      await page.reload();
      await expect(page.getByText("5 / 16", { exact: true })).toBeVisible();
    }
  }
  await expect(
    page.getByRole("heading", { name: /Q-Level (B|C)/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Qazaq Passport ашу →" }).click();
  await expect(page.getByText("QAZAQ PASSPORT", { exact: true })).toBeVisible();
  await page.evaluate(() =>
    Object.defineProperty(navigator, "canShare", { value: () => false }),
  );
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Профильді бөлісу" }).click();
  expect((await download).suggestedFilename()).toBe("qazaq-passport.png");
  await page.getByRole("link", { name: "Прогресс", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Әр қадамың — прогресс" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.screenshot({
    path: `test-results/q-level-${test.info().project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
  expect(errors).toEqual([]);
});
test("demo passport and default growth leaderboard are clearly labelled", async ({
  page,
}) => {
  await prepare(page);
  await page.goto("/learn/q-level?demo=1");
  await page.getByRole("button", { name: "Демо нәтижені қарау" }).click();
  await expect(
    page.getByText("Үлгі деректер · бұл сенің тест нәтижең емес"),
  ).toBeVisible();
  await page.getByRole("link", { name: "Рейтинг", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Апталық прогресс", exact: true }),
  ).toHaveClass("active");
  await expect(
    page.locator(".ql-rank-row").filter({ hasText: "Нұрсұлтан" }),
  ).toBeVisible();
});
test("full diagnostic completes five sections and keeps writing/speaking pending", async ({
  page,
}) => {
  await prepare(page);
  await page.goto("/learn/q-level/full?demo=1");
  await page
    .getByRole("button", { name: "Деңгейді анықтау →", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(() => !!localStorage.getItem("qd-qlevel-demo-v1")),
    )
    .toBe(true);
  for (let i = 0; i < 20; i++) {
    const id = await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("qd-qlevel-demo-v1")!).attempt
          .questionId,
    );
    const q = questionBank.find((x) => x.id === id)!;
    await expect(
      page.getByRole("heading", { name: q.question, exact: true }),
    ).toBeVisible();
    if (q.skill === "listening") {
      await page.getByRole("button", { name: "Аудионы тыңдау" }).click();
      await expect(page.getByText("1 рет тыңдалды")).toHaveText(
        "1 рет тыңдалды",
      );
    }
    await page
      .getByRole("button", { name: new RegExp(String(q.correct_answer) + "$") })
      .click();
    await page
      .getByRole("button", { name: "Жауап беру →", exact: true })
      .click();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            JSON.parse(localStorage.getItem("qd-qlevel-demo-v1")!).attempt
              .answers.length,
        ),
      )
      .toBe(i + 1);
  }
  await page
    .getByRole("textbox", { name: "Жауап мәтіні" })
    .fill("Қазақ тілін күн сайын үйренемін. Менің қаламда кітапхана бар.");
  await page.getByRole("button", { name: "Жауап беру →", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Сөйлеуді жазу" }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Жауап мәтіні" })
    .fill(
      "Мен қалам туралы айтып беремін. Табиғатты қорғау бәрімізге маңызды.",
    );
  await page.getByRole("button", { name: "Жауап беру →", exact: true }).click();
  await expect(page.getByText(/Айтылым \/ жазылым бағаланбаған/)).toBeVisible();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("qd-qlevel-demo-v1")!),
  );
  expect(saved.history.at(-1).pending).toBe(true);
  expect(saved.history.at(-1).skills.speaking.score).toBeNull();
  expect(saved.review).toHaveLength(22);
});
