import { test as base, Browser, expect, Locator, Page } from '@playwright/test';
import dedent from 'dedent';

type Fixtures = {
  crossword: Crossword;
}

export const PUZZLE_TEMPLATE = dedent`
.....
.xxx.
.xxx.
.xxx.
.....`.trim();

export class Crossword {
  constructor(public readonly id: string, public readonly page: Page) {}

  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  async press(...keys: string[]) {
    for (const key of keys) {
      await this.page.keyboard.press(key);
    }
  }

  // Everything you set once lives behind the ⋯ button. Toggling something does
  // not close the menu, so one call covers several changes.
  async openMenu() {
    await this.page.getByRole('button', { name: 'Puzzle settings' }).click();
    await expect(this.page.getByRole('menu')).toBeVisible();
  }

  // The menu overlays the grid, so it has to be dismissed before the cells
  // underneath it can be reached again.
  async closeMenu() {
    await this.page.keyboard.press('Escape');
    await expect(this.page.getByRole('menu')).toBeHidden();
  }

  toggle(name: string): Locator {
    return this.page.getByRole('menuitemcheckbox', { name });
  }
}

export const test = base.extend<Fixtures>({
  // Note: This creates a crossword in the UI for each test that uses the
  // fixture, which is a bit inefficient. In the future, we may want to optimize
  // this by creating a crossword directly in the database or reusing the same
  // crossword across tests.  At the moment this has not caused too much pain
  // since the crossword creation is fairly fast, but it's something to keep in
  // mind if the tests start to slow down.
  crossword: async ({ page }, use) => {
    await page.goto('/create');
    await page.getByRole('textbox').fill(PUZZLE_TEMPLATE);
    await page.getByRole('button', { name: 'Done' }).click();
    const url = page.url();
    const match = url.match(/\/crossword\/(.+)$/);
    if (!match) {
      throw new Error(`Unexpected URL format: ${url}`);
    }
    const id = match[1];
    await expect(page.getByRole('grid')).toBeVisible();
    // TODO: Delete this once we've migrated to Svelte.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(new Crossword(id, page));
  }
});

export async function openCrossword(browser: Browser, id: string): Promise<Crossword> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`/crossword/${id}`);
  await expect(page.getByRole('grid')).toBeVisible();
  return new Crossword(id, page);
}