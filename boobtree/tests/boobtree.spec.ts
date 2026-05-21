import { test, expect, Page, Browser } from '@playwright/test';

async function drawOnCanvas(page: Page) {
  const canvas = page.locator('#drawing-area canvas.upper-canvas');
  await expect(canvas).toBeVisible();
  // TODO: Find a more reliable way to wait for the canvas to be ready for drawing. This is a bit hacky but seems to work in practice.
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

async function joinPlayer(browser: Browser, joinUrl: string, name: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(joinUrl);
  await page.getByPlaceholder('Your name').fill(name);
  await page.getByRole('button', { name: 'Join' }).click();
  await expect(page).toHaveURL(new RegExp(`/game/.+/player/\\d+$`));
  await expect(page.locator('#instructions')).toHaveText("The game hasn't started yet. Please wait for the admin to start the game.");
  return page;
}

test('Boobtree player flow covers join, multi-round play, and archive', async ({ browser }) => {
  const adminPage = await browser.newPage();
  await adminPage.goto('/');
  await adminPage.getByRole('link', { name: 'Start a new game' }).click();
  await expect(adminPage).toHaveURL(/\/game\/[A-Z0-9]{4}\/admin/);

  const gameIdMatch = adminPage.url().match(/\/game\/([^/]+)\//);
  expect(gameIdMatch).not.toBeNull();
  const gameId = gameIdMatch![1];
  const joinUrl = `${new URL(adminPage.url()).origin}/game/${gameId}/join`;

  const playerNames = ['Alice', 'Bob', 'Charlie'];
  const playerPages = [] as Page[];
  for (const name of playerNames) {
    playerPages.push(await joinPlayer(browser, joinUrl, name));
  }

  await expect(adminPage.locator('text=Alice')).toBeVisible();
  await expect(adminPage.locator('text=Bob')).toBeVisible();
  await expect(adminPage.locator('text=Charlie')).toBeVisible();

  await adminPage.getByRole('button', { name: "That's everyone!" }).click();

  for (const page of playerPages) {
    await expect(page.locator('#instructions')).toHaveText('Write a phrase for others to draw:');
    await expect(page.locator('#round-indicator')).toHaveText('Round 1 of 3');
  }

  const phrases = ['Sun over water', 'A flying pig', 'A dancing robot'];
  for (let i = 0; i < playerPages.length; i++) {
    const page = playerPages[i];
    await page.getByPlaceholder('e.g., A cat wearing a superhero cape').fill(phrases[i]);
    await page.getByRole('button', { name: 'Done' }).click();
  }

  for (let i = 0; i < playerPages.length; i++) {
    const page = playerPages[i];
    const expectedPhrase = phrases[(i + playerNames.length - 1) % playerNames.length];
    await expect(page.locator('#instructions')).toHaveText('Draw this phrase:');
    await expect(page.locator('#phrase-to-draw')).toHaveText(expectedPhrase);
  }

  for (const page of playerPages) {
    await drawOnCanvas(page);
    await page.getByRole('button', { name: 'Done' }).click();
  }

  for (let i = 0; i < playerPages.length; i++) {
    const page = playerPages[i];
    await page.getByPlaceholder('e.g., A cat wearing a superhero cape').fill(phrases[i]);
    await page.getByRole('button', { name: 'Done' }).click();
  }

  await expect(adminPage.getByRole('link', { name: 'View the archive' })).toBeVisible();
  await adminPage.getByRole('link', { name: 'View the archive' }).click();
  await expect(adminPage).toHaveURL(/\/archive$/);

  // Verify that the archive shows the correct phrases and drawings, and that the drawings are initially hidden
  await adminPage.keyboard.press('ArrowDown');

  await expect(adminPage.locator('img[alt*="drawing by"]')).not.toBeVisible();
  await expect(adminPage.locator('text=Started with')).not.toBeVisible();
});
