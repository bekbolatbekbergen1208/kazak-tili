import { test, expect } from "@playwright/test";
for (const width of [360, 390, 768, 1440]) {
  test(`journey surfaces at ${width}px`, async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: "Үйренуді бастау" }),
    ).toBeVisible();
    await expect(page.locator("body")).toHaveCSS("color", "rgb(36, 20, 61)");
    await page.screenshot({
      path: `test-results/journey-${width}-landing.png`,
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.goto("/learn?demo=1");
    await page.getByRole("button", { name: "English", exact: false }).click();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByLabel("Nickname").fill("Саяхатшы Әсемгүл");
    await page.getByRole("button", { name: "Create my path" }).click();
    await page.waitForURL("**/learn/q-level/quick");
    await page.goto("/learn");
    await expect(
      page.getByRole("heading", { name: "Сәлем, Саяхатшы Әсемгүл!" }),
    ).toBeVisible();
    for (const route of [
      "/learn",
      "/learn/map",
      "/learn/tourism-1",
      "/learn/national",
      "/learn/songs",
      "/kazakhstan",
      "/learn/vocabulary",
      "/learn/ranking",
      "/learn/settings",
      "/learn/q-level",
      "/learn/friend",
    ]) {
      await page.goto(route);
      await expect(page.locator(".qd-bar")).toBeVisible();
      await expect(page.locator("main h1").first()).toBeVisible();
      if (route === "/learn/national")
        await expect(page.locator(".vw-game-list > a")).toHaveCount(18);
      if (route === "/learn/tourism-1") {
        await page.getByRole("button", { name: "Start lesson", exact: true }).click();
        await expect(page.getByRole("button", { name: "Check answer" })).toBeVisible();
      }
      await page.screenshot({
        path: `test-results/journey-${width}-${route.replaceAll("/", "-")}.png`,
        fullPage: true,
        animations: "disabled",
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        route,
      ).toBe(true);
    }
    if (width <= 760) {
      await page.getByRole("button", { name: "Мәзірді ашу" }).click();
      await expect(
        page.locator("#learning-navigation a").first(),
      ).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("button", { name: "Мәзірді ашу" }),
      ).toBeFocused();
      await page.getByRole("button", { name: "Мәзірді ашу" }).click();
      await expect(
        page.getByRole("navigation", { name: "Navigation" }),
      ).toBeVisible();
      await page.getByRole("link", { name: "My path", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "Мәзірді ашу" }),
      ).toBeVisible();
    }
  });
}
