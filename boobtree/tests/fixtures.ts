/* eslint-disable react-hooks/rules-of-hooks */
// The react-hooks plugin pattern-matches `use*` identifiers; Playwright fixtures
// call `await use(...)`, which trips the rule. TODO: Remove once migrated to Svelte.

import { test as base, expect, Browser, Page } from '@playwright/test';

type NewGame = {
  adminPage: Page;
  gameId: string;
  joinUrl: string;
};

type JoinedGame = NewGame & {
  playerPages: Page[];
  playerNames: string[];
};

type Fixtures = {
  newGame: NewGame;
  joinedGame: (n: number) => Promise<JoinedGame>;
  startedGame: (n: number) => Promise<JoinedGame>;
};

const DEFAULT_NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace'];

export function expectedTotalRounds(n: number): number {
  return n % 2 === 0 ? n - 1 : n;
}

export async function joinPlayer(browser: Browser, joinUrl: string, name: string): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(joinUrl);
  await page.getByPlaceholder('Your name').fill(name);
  await page.getByRole('button', { name: 'Join' }).click();
  await expect(page).toHaveURL(/\/game\/.+\/player\/\d+$/);
  await expect(page.locator('#instructions')).toHaveText(
    "The game hasn't started yet. Please wait for the admin to start the game."
  );
  return page;
}

export async function drawOnCanvas(page: Page) {
  const canvas = page.locator('#drawing-area canvas.upper-canvas');
  await expect(canvas).toBeVisible();
  // TODO: Find a more reliable way to wait for the canvas to be ready for drawing.
  // This can wait until after we're done with the Svelte migration.
  await page.waitForTimeout(500);
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas bounding box not found');

  await canvas.click();
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.25);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.4);
  await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.75);
  await page.mouse.up();
}

export const test = base.extend<Fixtures>({
  newGame: async ({ browser }, use) => {
    const adminPage = await browser.newPage();
    await adminPage.goto('/');
    await adminPage.getByRole('link', { name: 'Start a new game' }).click();
    await expect(adminPage).toHaveURL(/\/game\/[A-Z0-9]{4}\/admin/);
    const instructionsLocator = adminPage.locator('#instructions');
    await expect(instructionsLocator).toHaveText(
      /^Please share this join link or the code [A-Z]{4} with the rest of your party$/
    );
    const gameId = (await instructionsLocator.textContent())!.match(/code ([A-Z]{4})/)![1];

    const joinHref = await adminPage.getByRole('link', { name: 'join link' }).getAttribute('href');
    expect(joinHref).toEqual(`/game/${gameId}/join`);
    const joinUrl = new URL(joinHref!, adminPage.url()).toString();

    await use({ adminPage, gameId, joinUrl });
  },

  joinedGame: async ({ browser, newGame }, use) => {
    await use(async (n: number) => {
      const names = DEFAULT_NAMES.slice(0, n);
      const playerPages: Page[] = [];
      for (const name of names) {
        playerPages.push(await joinPlayer(browser, newGame.joinUrl, name));
      }
      return { ...newGame, playerPages, playerNames: names };
    });
  },

  startedGame: async ({ joinedGame }, use) => {
    await use(async (n: number) => {
      const game = await joinedGame(n);
      await game.adminPage.getByRole('button', { name: "That's everyone!" }).click();
      for (const page of game.playerPages) {
        await expect(page.locator('#round-indicator')).toHaveText(
          `Round 1 of ${expectedTotalRounds(n)}`
        );
      }
      return game;
    });
  },
});
