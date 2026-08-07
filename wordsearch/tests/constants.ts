import type { Locator, Page } from 'playwright';

const BASE_URL = 'http://localhost:4173';

export async function startup(page: Page): Promise<{
  gridInput: Locator;
  wordsInput: Locator;
  cleanWords: Locator;
  problemWords: Locator;
}> {
  await page.goto(BASE_URL);

  return {
    gridInput: page.locator('textarea[placeholder="Enter your grid here..."]'),
    wordsInput: page.locator('textarea').nth(1),
    cleanWords: page.locator('table.clean-vectors .word'),
    problemWords: page.locator('table.problem-vectors .word')
  };
}
