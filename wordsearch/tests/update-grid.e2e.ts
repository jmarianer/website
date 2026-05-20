import { test, expect } from '@playwright/test';
import { startup } from './constants';

test('updates solver output when the grid changes', async ({ page }) => {
  const { gridInput, wordsInput, cleanWords } = await startup(page);

  await gridInput.fill('AB\nCD');
  await wordsInput.fill('AB, CD');

  await expect(gridInput).toHaveValue('AB\nCD');
  await expect(wordsInput).toHaveValue('AB, CD');
  await expect(cleanWords.filter({ hasText: 'AB' })).toHaveCount(1);
  await expect(cleanWords.filter({ hasText: 'CD' })).toHaveCount(1);
});
