import { test, expect } from '@playwright/test';
import { startup } from './constants';

test('loads default wordsearch puzzle and displays solved words', async ({ page }) => {
  const { gridInput, cleanWords, problemWords } = await startup(page);

  await expect(page.locator('h1')).toHaveText('Word Search Solver');
  await expect(gridInput).toHaveValue(/SVELTE/);
  await expect(page.locator('table.word-grid tbody tr')).toHaveCount(10);
  await expect(cleanWords.filter({ hasText: /^SVELTE$/ })).toHaveCount(1);
  await expect(cleanWords.first()).not.toBeVisible();
  await expect(problemWords.filter({ hasText: /^SOLVER$/ })).toHaveCount(1);
  await expect(problemWords.first()).toBeVisible();
});
