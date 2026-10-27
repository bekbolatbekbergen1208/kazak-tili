import { test, expect } from "@playwright/test";
import { initialState } from "../../lib/learning/state";
test("audio loading failure keeps grading disabled and offers transcript", async ({ page }) => {
  const state = initialState();
  state.profile.onboarded = true;
  await page.addInitScript(s => {
    sessionStorage.setItem("qd-demo", "1");
    localStorage.setItem("qazaqdos-learning-demo-v1", JSON.stringify(s));
  }, state);
  await page.route('**/audio/listening/*.mp3', route => route.abort());
  await page.goto('/learn/listening?demo=1');
  await expect(page.getByRole('heading', { name: 'Тыңдап үйрен', exact: true })).toBeVisible();
  await page.locator('audio').evaluate(async (a: HTMLAudioElement) => { a.muted = true; await a.play().catch(() => {}); });
  await expect(page.locator('.listen-lesson [role="alert"]')).toContainText('Аудио жүктелмеді');
  await expect(page.getByRole('button', { name: 'Жауаптарды тексеру' })).toBeDisabled();
  await page.getByRole('button', { name: 'Диалог мәтінін ашу' }).click();
  await expect(page.locator('.listen-transcript')).toContainText('Айгүл:');
  await expect(page.locator('.listen-transcript')).toContainText('Дәулет:');
  await page.getByRole('button', { name: 'A1–A2 · Дүкендегі сауда' }).click();
  await expect(page.getByRole('heading', { name: 'Дүкендегі сауда', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Диалог мәтінін ашу' })).toHaveAttribute('aria-expanded', 'false');
});

test("generated dialogue plays and grades answers with explanations", async ({ page }) => {
  const state = initialState();
  state.profile.onboarded = true;
  await page.addInitScript(s => {
    sessionStorage.setItem("qd-demo", "1");
    localStorage.setItem("qazaqdos-learning-demo-v1", JSON.stringify(s));
  }, state);
  await page.goto('/learn/listening?demo=1');
  const audio = page.locator('audio');
  await expect(audio).toBeVisible();
  await expect(page.getByRole('button', { name: 'Жауаптарды тексеру' })).toBeDisabled();
  await audio.evaluate(async (el: HTMLAudioElement) => {
    el.muted = true;
    await el.play();
  });
  await expect.poll(() => audio.evaluate((el: HTMLAudioElement) => Number.isFinite(el.duration) && el.duration > 20)).toBe(true);
  // Playback end unlocks questions; seeking keeps the integration test bounded.
  await audio.evaluate((el: HTMLAudioElement) => { el.currentTime = el.duration - 0.15; });
  await expect(page.getByRole('radio').first()).toBeEnabled();
  for (const i of [1, 0, 2, 1].keys()) {
    await page.locator('fieldset').nth(i).getByRole('radio').nth([1, 0, 2, 1][i]).check();
  }
  await page.getByRole('button', { name: 'Жауаптарды тексеру' }).click();
  await expect(page.getByRole('heading', { name: 'Нәтиже: 4/4' })).toBeVisible();
  await expect(page.locator('.listen-correct')).toHaveCount(4);
  await page.getByRole('button', { name: 'A1–A2 · Дүкендегі сауда' }).click();
  await expect(page.getByRole('button', { name: 'Жауаптарды тексеру' })).toBeDisabled();
});

test("Q-Level audio API provides a real recording without exposing its transcript", async ({ request }) => {
  const start = await request.post('/api/q-level', { data: { action: 'start', type: 'quick', demo: true } });
  expect(start.ok()).toBe(true);
  const s = await start.json();
  expect(s.question.skill).toBe('listening');
  expect(s.question.text_content).toBeUndefined();
  expect(s.question.correct_answer).toBeUndefined();
  const response = await request.post('/api/q-level', { data: { action: 'audio', demo: true, attempt: s.attempt, questionId: s.question.id } });
  expect(response.ok()).toBe(true);
  const audio = await response.json();
  expect(audio.speechText).toBeUndefined();
  expect(audio.audioUrl).toMatch(/^\/audio\/listening\/.+\.mp3$/);
  const file = await request.get(audio.audioUrl);
  expect(file.ok()).toBe(true);
  expect(file.headers()['content-type']).toContain('audio/');
  expect((await file.body()).length).toBeGreaterThan(1000);
});

test("catalog lesson completes only after its recorded listening task", async ({ page }) => {
  const { courseLessons } = await import('../../lib/curriculum');
  const { courseTasks } = await import('../../lib/learning/course-tasks');
  const tasks = courseTasks(courseLessons[0]);
  await page.goto('/student/lesson/1');
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (task.kind === 'typing') await page.getByRole('textbox').fill(task.answer);
    else await page.getByRole('button', { name: task.answer, exact: true }).click();
    const check = page.getByRole('button', { name: 'Тексеру', exact: true });
    if (task.kind === 'listening') {
      await expect(check).toBeDisabled();
      const audio = page.locator('audio');
      await audio.evaluate(async (a: HTMLAudioElement) => { a.muted = true; await a.play(); });
      await expect.poll(() => audio.evaluate((a: HTMLAudioElement) => a.duration > 0)).toBe(true);
      await audio.evaluate((a: HTMLAudioElement) => { a.currentTime = a.duration - 0.15; });
    }
    await expect(check).toBeEnabled();
    await check.click();
    await page.getByRole('button', { name: i === tasks.length - 1 ? 'Нәтиже' : 'Келесі', exact: false }).click();
  }
  await expect(page.getByRole('heading', { name: 'Сабақ меңгерілді!' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('qazaqdos-unlocked-lesson'))).toBe('2');
});

test("learning exercise uses a recording and persists the listening answer", async ({ page }) => {
  const { lessons } = await import('../../lib/learning/content');
  const lesson = lessons.find(l => l.id === 'tourism-2')!;
  const e = lesson.exercises[3];
  const state = initialState();
  state.profile.onboarded = true;
  state.profile.language = 'en';
  state.profile.goal = 'tourism';
  state.progress.lessons['tourism-1'] = { status: 'completed', answers: {}, firstAnswers: {}, correct: 0 };
  const answers = Object.fromEntries(lesson.exercises.slice(0, 3).map(e => [e.id, e.answer]));
  state.progress.lessons[lesson.id] = { status: 'started', answers, firstAnswers: { ...answers }, correct: 3 };
  await page.addInitScript(s => {
    sessionStorage.setItem('qd-demo', '1');
    localStorage.setItem('qazaqdos-learning-demo-v1', JSON.stringify(s));
  }, state);
  await page.goto('/learn/tourism-2?demo=1');
  await page.getByRole('radio', { name: e.answer, exact: true }).check();
  const check = page.getByRole('button', { name: 'Check answer', exact: true });
  await expect(check).toBeDisabled();
  const audio = page.locator('audio');
  await audio.evaluate(async (a: HTMLAudioElement) => { a.muted = true; await a.play(); });
  await expect.poll(() => audio.evaluate((a: HTMLAudioElement) => a.duration > 0)).toBe(true);
  await audio.evaluate((a: HTMLAudioElement) => { a.currentTime = a.duration - 0.15; });
  await expect(check).toBeEnabled();
  await check.click();
  await expect.poll(() => page.evaluate(id => JSON.parse(localStorage.getItem('qazaqdos-learning-demo-v1')!).progress.lessons['tourism-2'].answers[id], e.id)).toBe(e.answer);
});
