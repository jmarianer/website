import { test, expect } from '@playwright/test';

const PUZZLE_TEMPLATE = `xxxxx
x...x
x...x
x...x
xxxxx`;

test('Crosswords creation and realtime sync', async ({ browser }) => {
  const page = await browser.newPage();
  await page.goto('/');
  await page.getByRole('link', { name: 'Create new crossword' }).click();
  await expect(page).toHaveURL('/create');

  await page.getByRole('textbox').fill(PUZZLE_TEMPLATE);
  await page.getByRole('button', { name: 'Done' }).click();

  await expect(page).toHaveURL(/\/crossword\/.+/);
  await expect(page.locator('h1')).toHaveText("Joey's awesome crossword app");

  const crosswordUrl = page.url();
  const playerTwo = await browser.newContext();
  const secondPage = await playerTwo.newPage();
  await secondPage.goto(crosswordUrl);
  await expect(secondPage.locator('h1')).toHaveText("Joey's awesome crossword app");

  const firstCell = page.locator('td.empty').first();
  await firstCell.click();
  await page.keyboard.press('A');

  await expect(page.locator('td.empty span.solution').first()).toHaveText('A');
  await expect(secondPage.locator('td.empty span.solution').first()).toHaveText('A');
});
