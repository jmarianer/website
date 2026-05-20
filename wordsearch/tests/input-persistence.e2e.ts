import { test, expect } from '@playwright/test';
import { startup } from './constants';

test('persists grid and words input after reload', async ({ page }) => {
  const { gridInput, wordsInput } = await startup(page);

  await gridInput.fill('ZX\nQW');
  await wordsInput.fill('ZX, QW');

  await expect(gridInput).toHaveValue('ZX\nQW');
  await expect(wordsInput).toHaveValue('ZX, QW');

  await page.reload();

  await expect(gridInput).toHaveValue('ZX\nQW');
  await expect(wordsInput).toHaveValue('ZX, QW');
});
