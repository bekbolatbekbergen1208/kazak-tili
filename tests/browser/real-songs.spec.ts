import { test, expect } from "@playwright/test";
import { initialState } from "../../lib/learning/state";
test("real recordings appear first; masked quiz retries and completes without revealing a wrong answer", async ({
  page,
}) => {
  const state = initialState();
  state.profile.onboarded = true;
  await page.addInitScript((state) => {
    localStorage.setItem("qazaqdos-learning-demo-v1", JSON.stringify(state));
    sessionStorage.setItem("qd-demo", "1");
  }, state);
  await page.route("https://altynqor.com/audios/**", (route) => route.abort());
  await page.route("https://www.youtube-nocookie.com/**", (route) =>
    route.fulfill({
      body: "<html>Embedded player test</html>",
      contentType: "text/html",
    }),
  );
  await page.goto("/learn/songs?demo=1");
  await expect(page.locator(".song-card").first()).toContainText("Атамекен");
  await expect(page.locator(".song-card").nth(1)).toContainText(
    "Қазақстанның Әнұраны",
  );
  await page
    .locator(".song-card")
    .first()
    .getByRole("link", { name: "Сөзді тап", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "жайлау", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Әнді ашу · Атамекен" }).click();
  const captions = page.locator(".song-real-player .song-karaoke-captions");
  await expect(captions).toBeVisible();
  await expect(captions.locator(".song-karaoke-caption-line")).toContainText(
    "Жасыл жайлау",
  );
  await captions
    .getByRole("button", { name: "2-жол: Қайда жүрсем, атамекен" })
    .click();
  await expect(captions.locator(".song-karaoke-caption-line")).toContainText(
    "Қайда жүрсем, атамекен",
  );
  await expect(page.locator("iframe")).toHaveAttribute("src", /dwlW30-Bw1s/);
  await page.getByRole("button", { name: "мектеп", exact: true }).click();
  await expect(page.locator(".song-find .song-current-line")).toContainText(
    "____",
  );
  await expect(page.getByRole("status").last()).toContainText(
    "Әлі сәйкес келмеді",
  );
  await page.getByRole("button", { name: "жайлау", exact: true }).click();
  await page.getByRole("button", { name: "Келесі сөз →" }).click();
  await page.getByRole("button", { name: "атамекен", exact: true }).click();
  await page.getByRole("button", { name: "Жаттығуды аяқтау" }).click();
  await expect(page.getByText("✓ Екі сөзді де таптың!")).toBeVisible();
  await page.goto("/learn/songs/anuran/karaoke?demo=1");
  await page
    .getByRole("button", { name: "Әнді ашу · Қазақстанның Әнұраны" })
    .click();
  await expect(page.locator("iframe")).toHaveAttribute("src", /ZZnvsrlZkOA/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});

test("karaoke dot follows audio play and pause beneath the player", async ({
  page,
}) => {
  const state = initialState();
  state.profile.onboarded = true;
  await page.addInitScript((saved) => {
    localStorage.setItem("qazaqdos-learning-demo-v1", JSON.stringify(saved));
    sessionStorage.setItem("qd-demo", "1");
  }, state);
  await page.route("https://altynqor.com/audios/**", (route) =>
    route.fulfill({
      path: `${process.cwd()}/public/audio/listening/tanysu-e087eea7f3c47578.mp3`,
      contentType: "audio/mpeg",
    }),
  );
  await page.goto("/learn/songs/atameken/karaoke?demo=1");
  await page.getByRole("button", { name: "Әнді ашу · Атамекен" }).click();
  const player = page.locator(".song-real-player");
  const captions = player.locator(".song-karaoke-captions");
  await expect(player.locator("audio")).toBeVisible();
  await expect(captions).toHaveAttribute("data-playing", "true");
  await expect(captions.locator(".song-karaoke-ball")).toBeVisible();
  await player
    .locator("audio")
    .evaluate((audio: HTMLAudioElement) => audio.pause());
  await expect(captions).not.toHaveAttribute("data-playing", "true");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
