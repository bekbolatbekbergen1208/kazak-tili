import { test, expect, type Page } from "@playwright/test";
import { initialState } from "../../lib/learning/state";
import { songLessons } from "../../lib/songs/content";
async function prepare(page: Page) {
  const s = initialState();
  s.profile.onboarded = true;
  s.profile.nickname = "Әнші";
  await page.addInitScript((s) => {
    if (!localStorage.getItem("qazaqdos-learning-demo-v1"))
      localStorage.setItem("qazaqdos-learning-demo-v1", JSON.stringify(s));
    sessionStorage.setItem("qd-demo", "1");
  }, s);
}
test("song: all stages, wrong answer review, shared vocabulary, persisted XP and no replay", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await prepare(page);
  await page.goto("/learn/songs?demo=1");
  await expect(
    page.getByRole("heading", { name: /Қазақша тыңда/ }),
  ).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Әнмен үйрен", exact: true })
    .click();
  await page
    .getByRole("link", { name: /Сабақты ашу/ })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Сабақты бастау", exact: true })
    .click();
  await expect(
    page.getByText("Бұл сабақтың аудиосы әзірленіп жатыр"),
  ).toBeVisible();
  expect(await page.locator("audio").count()).toBe(0);
  await page
    .getByRole("button", { name: "Мәтінді оқыдым, жалғастыру" })
    .click();
  for (const [i, w] of songLessons[0].words.entries()) {
    await page
      .locator(".song-word-tabs")
      .getByRole("button", { name: new RegExp(w.word) })
      .click();
    await page
      .getByRole("button", { name: "Мағынасын түсіндім", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "✓ Қарап шықтым", exact: true }),
    ).toBeDisabled();
    if (i === 0) {
      await page
        .getByRole("button", { name: "Менің сөздеріме қосу", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "✓ Сөздікке қосылды" }),
      ).toBeDisabled();
    }
  }
  await page.getByRole("button", { name: /Келесі кезең: Ойна/ }).click();
  const games = page.locator(".song-game");
  await games.nth(0).getByRole("radio", { name: "Теңіз", exact: true }).check();
  await games.nth(0).getByRole("button", { name: "Жауапты тексеру" }).click();
  await expect(games.nth(0).getByRole("status")).toContainText(
    "Қайта байқап көр",
  );
  await games.nth(0).getByRole("radio", { name: "Сәлем", exact: true }).check();
  await games.nth(0).getByRole("button", { name: "Жауапты тексеру" }).click();
  await expect(games.nth(0).getByRole("status")).toContainText("Дұрыс");
  for (const word of ["Менің", "атым", "Айдана"])
    await games.nth(1).getByRole("button", { name: word, exact: true }).click();
  await games.nth(1).getByRole("button", { name: "Жауапты тексеру" }).click();
  await expect(games.nth(1).getByRole("status")).toContainText("Дұрыс");
  for (const [i, w] of songLessons[0].words.slice(0, 3).entries())
    await games.nth(2).getByRole("combobox").nth(i).selectOption(w.ru);
  await games.nth(2).getByRole("button", { name: "Жауапты тексеру" }).click();
  await games
    .nth(3)
    .getByRole("radio", { name: "Амандасу және танысу", exact: true })
    .check();
  await games.nth(3).getByRole("button", { name: "Жауапты тексеру" }).click();
  await page.getByRole("button", { name: /Келесі кезең: Айт/ }).click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Дауыстап оқып жаттық" }),
  ).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: () => Promise.reject(new Error("denied")) },
    });
  });
  await page.getByRole("button", { name: "Дауысымды жазу" }).click();
  await expect(page.locator(".song-recorder").getByRole("alert")).toContainText(
    "Микрофонға рұқсат берілмеді",
  );
  await page
    .getByRole("textbox", { name: "Айтқан сөйлемің немесе мәтіндік жаттығуың" })
    .fill("Сәлем! Менің атым — Әнші.");
  await page
    .getByRole("button", { name: "Жаттығуды сақтау", exact: true })
    .click();
  await page.getByRole("button", { name: /Келесі кезең: Қолдан/ }).click();
  await page
    .getByRole("textbox", { name: "Өзің туралы 2–3 сөйлем", exact: true })
    .fill("Сәлем, досым! Мен қазақша үйренемін.");
  await page
    .getByRole("button", { name: "Өз сөйлемдерімді сақтау", exact: true })
    .click();
  await page.route("**/api/ai-friend", (r) =>
    r.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Досша сервисі уақытша қолжетімсіз." }),
    }),
  );
  await page.getByRole("button", { name: "Досшадан көмек сұрау" }).click();
  await expect(page.locator(".song-error")).toContainText(
    "уақытша қолжетімсіз",
  );
  await page.getByRole("button", { name: /Келесі кезең: Қайтала/ }).click();
  const checks = page.locator(".song-check");
  await checks
    .nth(0)
    .getByRole("button", { name: "Сәлем", exact: true })
    .click();
  await checks
    .nth(1)
    .getByRole("button", { name: "друг", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "song:salem қайталау" })
    .fill("сәлем");
  await page.getByRole("button", { name: "Қайталауды тексеру" }).click();
  await expect(
    page.getByText("✓ Дұрыс! Ертең тағы қайталаймыз."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Сабақты аяқтау · +20 XP", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "✓ +20 XP сақталды" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "✓ +20 XP сақталды" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("qazaqdos-learning-demo-v1")!).progress
          .xp,
    ),
  ).toBe(20);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await page.screenshot({
    path: `test-results/songs-complete-${test.info().project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
  expect(errors).toEqual([]);
});
test("hub filters, diagnostic level, creator two exercises and honest audio fallback", async ({
  page,
}) => {
  await prepare(page);
  await page.addInitScript(() =>
    localStorage.setItem(
      "qd-qlevel-demo-v1",
      JSON.stringify({ history: [{ level: "A2", score: 42 }] }),
    ),
  );
  await page.goto("/learn/songs?demo=1");
  await expect(page.getByText("Q-Level нәтижесі:")).toBeVisible();
  await page
    .getByRole("combobox", { name: "Ән деңгейі бойынша сүзгі" })
    .selectOption("A2");
  await expect(page.locator(".song-card")).toHaveCount(2);
  await page
    .getByRole("combobox", { name: "Ән тақырыбы бойынша сүзгі" })
    .selectOption("Саяхат");
  await expect(page.locator(".song-card")).toHaveCount(1);
  await page
    .getByRole("textbox", { name: "Өзің туралы 3–4 сөйлем" })
    .fill(
      "Мен Ақтауда тұрамын. Қаламда теңіз бар. Мен теңізге барғанды ұнатамын.",
    );
  await page
    .getByRole("button", { name: "Оқу әнінің мәтінін жасау", exact: true })
    .click();
  await expect(page.locator(".song-generated")).toBeVisible();
  await expect(page.locator(".song-generated")).toContainText(
    "Әуені бар аудио жасалған жоқ",
  );
  await expect(page.locator(".song-generated .song-check")).toHaveCount(2);
  await page.getByRole("button", { name: "Мәтінді дауыстап оқу" }).click();
  await page.screenshot({
    path: `test-results/songs-hub-${test.info().project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  const response = await page.request.post("/api/learning", {
    data: { action: { type: "song-finish", lessonId: "salem" }, revision: 0 },
  });
  expect(response.status()).toBe(401);
});

test.describe("local recording lifecycle", () => {
  test("synthetic microphone recording can stop, play locally and be deleted", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["microphone"]);
    await page.addInitScript(() => {
      Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
        configurable: true,
        value: async () => {
          const ctx = new AudioContext();
          await ctx.resume();
          const destination = ctx.createMediaStreamDestination();
          const source = ctx.createOscillator();
          source.connect(destination);
          source.start();
          return destination.stream;
        },
      });
    });
    const s = initialState();
    s.profile.onboarded = true;
    s.progress.songs = {
      lessons: {
        salem: { stage: 3, seen: [], answers: {}, checks: [], xp: 0 },
      },
      reviews: {},
    };
    await page.addInitScript((s) => {
      localStorage.setItem("qazaqdos-learning-demo-v1", JSON.stringify(s));
      sessionStorage.setItem("qd-demo", "1");
    }, s);
    await page.goto("/learn/songs/salem?demo=1");
    await page.getByRole("button", { name: "Дауысымды жазу" }).click();
    await expect(page.getByText("● Дауыс жазылып жатыр…")).toBeVisible();
    await page.waitForTimeout(700);
    await page.getByRole("button", { name: "Жазуды тоқтату" }).click();
    const player = page.locator(".song-recorder audio");
    await expect(player).toBeVisible();
    await expect(player).toHaveAttribute("src", /^blob:/);
    await player.evaluate(async (el: HTMLAudioElement) => {
      await el.play();
      el.pause();
    });
    await page.getByRole("button", { name: "Жазбаны өшіру" }).click();
    await expect(player).toHaveCount(0);
    expect(
      await page.evaluate(() =>
        JSON.stringify(
          JSON.parse(localStorage.getItem("qazaqdos-learning-demo-v1")!),
        ).includes("blob:"),
      ),
    ).toBe(false);
  });
});

test("hub resumes the latest lesson with its name and stage after reload", async ({
  page,
}) => {
  await prepare(page);
  await page.goto("/learn/songs/salem?demo=1");
  await page
    .getByRole("button", { name: "Сабақты бастау", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Мәтінді оқыдым, жалғастыру" })
    .click();
  await page.goto("/learn/songs/aktau?demo=1");
  await page
    .getByRole("button", { name: "Сабақты бастау", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Мәтінді оқыдым, жалғастыру" })
    .click();
  await page.goto("/learn/songs?demo=1");
  await page.reload();
  const continuation = page.getByRole("region", {
    name: "Жалғастырылатын сабақ",
  });
  await expect(
    continuation.getByRole("heading", { name: "Ақтауға саяхат" }),
  ).toBeVisible();
  await expect(continuation).toContainText("2/6 кезең");
  await continuation
    .getByRole("link", { name: "Жалғастыру", exact: true })
    .click();
  await expect(page).toHaveURL(/\/songs\/aktau/);
  await expect(
    page.getByRole("heading", { name: "Сөзді түсін, сөйлемде қолдан" }),
  ).toBeVisible();
});

test("microphone permission pending prevents repeat requests and unsupported recording has text fallback", async ({
  page,
}) => {
  const s = initialState();
  s.profile.onboarded = true;
  s.progress.songs = {
    lessons: { salem: { stage: 3, seen: [], answers: {}, checks: [], xp: 0 } },
    reviews: {},
  };
  await page.addInitScript((s) => {
    localStorage.setItem("qazaqdos-learning-demo-v1", JSON.stringify(s));
    sessionStorage.setItem("qd-demo", "1");
  }, s);
  await page.goto("/learn/songs/salem?demo=1");
  await page.evaluate(() =>
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: () => new Promise(() => {}) },
    }),
  );
  await page.getByRole("button", { name: "Дауысымды жазу" }).click();
  await expect(
    page.getByRole("button", { name: "Микрофон рұқсатын күтіп тұрмын…" }),
  ).toBeDisabled();
  await page.reload();
  await page.evaluate(() =>
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: undefined,
    }),
  );
  await page.getByRole("button", { name: "Дауысымды жазу" }).click();
  await expect(page.locator(".song-recorder").getByRole("alert")).toContainText(
    "дауыс жазу қолжетімсіз",
  );
  await page
    .getByRole("textbox", { name: "Айтқан сөйлемің немесе мәтіндік жаттығуың" })
    .fill("Сәлем, досым!");
  await page
    .getByRole("button", { name: "Жаттығуды сақтау", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Келесі кезең: Қолдан/ }),
  ).toBeEnabled();
});
