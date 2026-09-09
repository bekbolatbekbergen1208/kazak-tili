import { test, expect, type Page } from "@playwright/test";
async function onboard(page: Page) {
  await page.goto("/learn?demo=1");
  await expect(
    page.getByRole("heading", { name: "Как вам удобнее учиться?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "English", exact: false }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Nickname").fill("Test Learner");
  await page.getByRole("button", { name: "Create my path" }).click();
  await expect(
    page.getByRole("heading", { name: "Сәлем, Test Learner!" }),
  ).toBeVisible();
}
test("onboarding → lesson → rewards → persisted progress → language and goal", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await onboard(page);
  await page.getByRole("link", { name: "Continue learning" }).click();
  await page.getByRole("button", { name: "Start lesson", exact: true }).click();
  await page.getByRole("radio", { name: "Hello", exact: true }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(
    page.getByRole("heading", { name: "Дұрыс! Correct!" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Сәлеметсіз", exact: true }).click();
  await page.getByRole("button", { name: "бе", exact: true }).click();
  await page.getByRole("button", { name: "Check answer" }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("textbox", { name: "Your answer" }).fill("бе");
  await page.getByRole("button", { name: "Check answer" }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("radio", { name: "Сәлеметсіз бе", exact: true }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  const selects = page.getByRole("combobox");
  for (let i = 0; i < 3; i++) await selects.nth(i).selectOption(String(i));
  await page.getByRole("button", { name: "Check answer" }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page
    .getByRole("button", { name: "Finish and collect rewards" })
    .click();
  await page.getByRole("button", { name: "Keep in collection" }).click();
  await expect(
    page.getByRole("heading", { name: "Сабақ аяқталды!" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Жалғастыру", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Lesson complete!" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await expect(page.getByText("105 XP", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("105 XP", { exact: true })).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Settings", exact: true })
    .click();
  await page.getByRole("button", { name: /Русский/ }).click();
  await page.getByRole("button", { name: /Повседневная жизнь/ }).click();
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Настройки сохранены");
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Главная", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Моя семья большая" }),
  ).toBeVisible();
  await expect(page.getByText("105 XP", { exact: true })).toBeVisible();
  await page.screenshot({
    path: `test-results/dashboard-${test.info().project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
  expect(errors).toEqual([]);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
});
test("locked lessons, wrong answer retry and empty review", async ({
  page,
}) => {
  await onboard(page);
  await page.goto("/learn/tourism-2");
  await expect(
    page.getByRole("heading", { name: "This lesson is locked" }),
  ).toBeVisible();
  await page.goto("/learn/review");
  await expect(
    page.getByText("All clear: no mistakes to review yet."),
  ).toBeVisible();
  await page.goto("/learn/tourism-1");
  await page.getByRole("button", { name: "Start lesson", exact: true }).click();
  await page
    .getByRole("radio", { name: "How can I get to the airport", exact: true })
    .check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(
    page.getByText("Added to your review list. Try again first."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await page.getByRole("radio", { name: "Hello", exact: true }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await page.goto("/learn/review");
  await page.getByRole("button", { name: /Сәлеметсіз бе/ }).click();
  await page.getByRole("radio", { name: "Hello", exact: true }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await page.getByRole("button", { name: "Back to list" }).click();
  await expect(
    page.getByText("All clear: no mistakes to review yet."),
  ).toBeVisible();
});
test("registration UI, unauthenticated API and legacy pages", async ({
  page,
  request,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Нет аккаунта? Регистрация" }).click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByLabel("Ваше имя")).toBeVisible();
  await expect(page.getByLabel("Повторите пароль")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Зарегистрироваться", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Ваше имя").fill("Дос");
  await page.getByLabel("Email").fill("dos@example.com");
  await page.getByLabel("Пароль", { exact: true }).fill("password-1");
  await page.getByLabel("Повторите пароль").fill("password-2");
  await page
    .getByRole("button", { name: "Зарегистрироваться", exact: true })
    .click();
  await expect(page.locator(".loginCard .qd-error")).toContainText(
    "Пароли не совпадают",
  );
  await page.goto("/register");
  await expect(
    page.getByRole("button", { name: "Зарегистрироваться", exact: true }),
  ).toBeVisible();
  expect((await request.get("/api/learning")).status()).toBe(401);
  for (const path of [
    "/student",
    "/student/lessons",
    "/teacher",
    "/learn/books",
  ]) {
    const response = await request.get(path);
    expect(response?.status()).toBe(200);
  }
});
