import { test, expect, type Page } from "@playwright/test";
import { initialState } from "../../lib/learning/state";
async function prepare(page: Page) {
  const s = initialState();
  s.profile.onboarded = true;
  await page.addInitScript((s) => {
    if (!localStorage.getItem("qazaqdos-learning-demo-v1"))
      localStorage.setItem("qazaqdos-learning-demo-v1", JSON.stringify(s));
    sessionStorage.setItem("qd-demo", "1");
  }, s);
}
test("cards link independent modes; missing audio stays draft, text karaoke stays available", async ({
  page,
}) => {
  await prepare(page);
  await page.goto("/learn/songs?demo=1");
  const card = page.locator(".song-card").first();
  await expect(
    card.getByRole("link", { name: "Сөзді тап", exact: true }),
  ).toHaveAttribute("href", "/learn/songs/salem/find");
  await card.getByRole("link", { name: "Сөзді тап", exact: true }).click();
  await expect(
    page.getByText("Аудио режимі — жоба күйінде", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("audio")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Үзіндіні тыңдау", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText(/осы 6 тапсырма ашылады/)).toBeVisible();
  await page
    .getByRole("navigation", { name: "Ән режимдері" })
    .getByRole("link", { name: "Караоке", exact: true })
    .click();
  await expect(
    page.getByText("Бұл — мәтіндік дайындық. Нақты уақытпен синхрондау жоқ."),
  ).toBeVisible();
  await page.locator(".song-lyrics button").nth(2).click();
  await expect(
    page.locator(".song-karaoke-window .song-current-line"),
  ).toHaveText("Сенің атың кім?");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
test("manual speech comparison is labelled; participation restores and pays once without recognition penalties", async ({
  page,
}) => {
  await prepare(page);
  await page.route("**/api/songs/transcribe", (r) =>
    r.fulfill({ json: { available: false } }),
  );
  await page.goto("/learn/songs/salem/speak?demo=1");
  await expect(page.getByText(/Қазақша тану сервисі қосылмаған/)).toBeVisible();
  await page
    .getByLabel("Салыстырылатын мәтін")
    .fill("Сәлем, досым! Қалың жақсы?");
  await page
    .getByRole("button", { name: "Мәтіндерді салыстыру", exact: true })
    .click();
  await expect(page.locator(".song-comparison")).toContainText(
    "Өзің енгізген мәтін",
  );
  await expect(page.locator(".song-comparison")).toContainText(
    "↻ Өзгеше танылған",
  );
  await expect(page.locator(".song-comparison")).toContainText("қалай → жақсы");
  await expect(page.locator(".song-comparison")).toContainText(
    "айтылым, акцент немесе ән айту сапасының бағасы емес",
  );
  await page
    .getByRole("button", { name: "Айту жаттығуына қатысуды сақтау" })
    .click();
  await expect(page.locator(".song-mode-result")).toContainText("Режим XP: 5");
  await page.reload();
  await expect(page.getByLabel("Салыстырылатын мәтін")).toHaveValue(
    "Сәлем, досым! Қалың жақсы?",
  );
  await page
    .getByRole("button", { name: "Мәтіндерді салыстыру", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Айту жаттығуына қатысуды сақтау" }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Айту жаттығуына қатысуды сақтау" })
    .click();
  await expect(page.locator(".song-mode-result")).toContainText("Режим XP: 5");
  await page.getByLabel("Салыстырылатын мәтін").fill("басқа нәрсе");
  await page
    .getByRole("button", { name: "Мәтіндерді салыстыру", exact: true })
    .click();
  await expect(page.locator(".song-comparison")).toContainText(
    "Бұл үзіндіні анық тани алмадық",
  );
  await expect(page.locator(".song-mode-result")).toContainText("Режим XP: 5");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
test("microphone is opt-in; recording stops tracks; STT requires consent and failure retains local playback", async ({
  page,
  context,
}) => {
  await prepare(page);
  await context.grantPermissions(["microphone"]);
  await page.addInitScript(() => {
    const metrics = { requests: 0, stopped: 0 };
    (window as unknown as { micMetrics: typeof metrics }).micMetrics = metrics;
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: async () => {
        metrics.requests++;
        const ctx = new AudioContext();
        await ctx.resume();
        const dest = ctx.createMediaStreamDestination();
        const oscillator = ctx.createOscillator();
        oscillator.connect(dest);
        oscillator.start();
        for (const track of dest.stream.getTracks()) {
          const stop = track.stop.bind(track);
          track.stop = () => {
            metrics.stopped++;
            stop();
            oscillator.stop();
            void ctx.close();
          };
        }
        return dest.stream;
      },
    });
  });
  let uploads = 0;
  await page.route("**/api/songs/transcribe", (r) => {
    if (r.request().method() === "GET")
      return r.fulfill({ json: { available: true } });
    uploads++;
    return r.fulfill({
      status: 503,
      json: { error: "Тану сәтсіз аяқталды. Музыкасыз айтып көр." },
    });
  });
  await page.goto("/learn/songs/salem/speak?demo=1");
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { micMetrics: { requests: number } }).micMetrics
          .requests,
    ),
  ).toBe(0);
  await page
    .getByRole("button", { name: "Дауысымды жазу", exact: true })
    .click();
  await expect(page.getByText("● Дауыс жазылып жатыр…")).toBeVisible();
  await page.waitForTimeout(1200);
  await page
    .getByRole("button", { name: "Жазуды тоқтату", exact: true })
    .click();
  await expect(page.locator(".song-recorder audio")).toHaveAttribute(
    "src",
    /^blob:/,
  );
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { micMetrics: { stopped: number } }).micMetrics
          .stopped,
    ),
  ).toBeGreaterThan(0);
  const send = page.getByRole("button", {
    name: "Жазбаны тануға жіберу",
    exact: true,
  });
  await expect(send).toBeDisabled();
  expect(uploads).toBe(0);
  await page.getByRole("checkbox").check();
  await send.click();
  await expect(page.locator(".song-error")).toContainText(
    "Музыкасыз айтып көр",
  );
  expect(uploads).toBe(1);
  await page
    .locator(".song-recorder audio")
    .evaluate(async (el: HTMLAudioElement) => {
      await el.play();
      el.pause();
    });
  await page
    .getByRole("button", { name: "Жазбаны өшіру", exact: true })
    .click();
  await expect(page.locator(".song-recorder audio")).toHaveCount(0);
  await expect(send).toHaveCount(0);
});
