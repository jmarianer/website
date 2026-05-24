import { expect, Page } from '@playwright/test';
import { test } from './fixtures';

async function assertNoBoobs(page: Page) {
  const text = await page.locator('body').textContent();
  expect(text?.toLowerCase() ?? '', `text on ${page.url()}`).not.toContain('boob');

  const srcs = await page.locator('img').evaluateAll((imgs) =>
    imgs.map((i) => i.getAttribute('src') ?? '')
  );
  for (const src of srcs) {
    if (src.startsWith('data:')) continue;
    expect(src.toLowerCase(), `img src on ${page.url()}: ${src}`).not.toContain('boob');
  }
}

test('passthepic: no "boob" appears anywhere in the happy path', async ({ browser, startedGame }) => {
  // Homepage
  const homepageContext = await browser.newContext();
  const homepage = await homepageContext.newPage();
  await homepage.goto('/');
  await assertNoBoobs(homepage);

  // Admin + a player after joining
  const { adminPage, playerPages } = await startedGame(3);
  await assertNoBoobs(adminPage);
  await assertNoBoobs(playerPages[0]);

  // Mid-game (drawing round)
  for (const page of playerPages) {
    await page.getByPlaceholder('e.g., A cat wearing a superhero cape').fill('phrase');
    await page.getByRole('button', { name: 'Done' }).click();
  }
  await expect(playerPages[0].locator('#instructions')).toHaveText('Draw this phrase:');
  await assertNoBoobs(playerPages[0]);
});
