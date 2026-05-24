import { expect } from '@playwright/test';
import { test, joinPlayer } from './fixtures';

test('admin starts a game, 3 players join, admin starts play', async ({ joinedGame }) => {
  const { adminPage, playerPages, playerNames } = await joinedGame(3);

  for (const name of playerNames) {
    await expect(adminPage.getByText(name, { exact: true })).toBeVisible();
  }

  await adminPage.getByRole('button', { name: "That's everyone!" }).click();
  for (const page of playerPages) {
    await expect(page.locator('#instructions')).toHaveText('Write a phrase for others to draw:');
    await expect(page.locator('#round-indicator')).toHaveText('Round 1 of 3');
  }
});

test('joining with an existing name routes to that player slot, no duplicate', async ({ browser, newGame }) => {
  const { joinUrl, adminPage } = newGame;

  const firstAlice = await joinPlayer(browser, joinUrl, 'Alice');
  await expect(firstAlice).toHaveURL(/\/player\/0$/);

  const secondAlice = await joinPlayer(browser, joinUrl, 'Alice');
  await expect(secondAlice).toHaveURL(/\/player\/0$/);

  const paddedAlice = await joinPlayer(browser, joinUrl, '  Alice  ');
  await expect(paddedAlice).toHaveURL(/\/player\/0$/);

  await expect(adminPage.getByText('Alice', { exact: true })).toHaveCount(1);
});

test('joining via /join form accepts lowercase code and routes to a player slot', async ({ browser, newGame }) => {
  const { gameId } = newGame;

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/join');
  await page.getByPlaceholder('Game code').fill(gameId.toLowerCase());
  await page.getByPlaceholder('Your name').fill('Frank');
  await page.getByRole('button', { name: 'Join' }).click();
  await expect(page).toHaveURL(new RegExp(`/game/${gameId}/player/\\d+$`));
});

test("admin sees no 'That's everyone!' button before any player joins", async ({ newGame }) => {
  const { adminPage } = newGame;
  await expect(adminPage.getByRole('button', { name: "That's everyone!" })).not.toBeVisible();
  await expect(adminPage.getByText('No players have joined yet')).toBeVisible();
});
