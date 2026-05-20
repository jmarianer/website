import { test, expect } from '@playwright/test';
import { startup } from './constants';

test('updates solver output when the word list changes', async ({ page }) => {
  const { wordsInput, cleanWords, problemWords } = await startup(page);

  await wordsInput.fill('svelte, missingword');
  await expect(wordsInput).toHaveValue('svelte, missingword');
  await expect(problemWords.filter({ hasText: 'MISSINGWORD' })).toBeVisible();
  await expect(cleanWords.filter({ hasText: 'SVELTE' })).toHaveCount(1);
});
