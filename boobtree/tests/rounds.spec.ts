import { expect } from '@playwright/test';
import { test, drawOnCanvas } from './fixtures';

test('3-player full flow: write → draw → describe → archive', async ({ startedGame }) => {
  const { adminPage, playerPages } = await startedGame(3);
  const N = playerPages.length;
  const phrases = ['Sun over water', 'A flying pig', 'A dancing robot'];

  // Round 1: write phrases
  for (let i = 0; i < N; i++) {
    const page = playerPages[i];
    await expect(page.locator('#round-indicator')).toHaveText('Round 1 of 3');
    await expect(page.locator('#instructions')).toHaveText('Write a phrase for others to draw:');
    await page.getByPlaceholder('e.g., A cat wearing a superhero cape').fill(phrases[i]);
    await page.getByRole('button', { name: 'Done' }).click();
  }

  // Round 2: draw the previous player's phrase
  for (let i = 0; i < N; i++) {
    const page = playerPages[i];
    const expectedPhrase = phrases[(i + N - 1) % N];
    await expect(page.locator('#round-indicator')).toHaveText('Round 2 of 3');
    await expect(page.locator('#instructions')).toHaveText('Draw this phrase:');
    await expect(page.locator('#phrase-to-draw')).toHaveText(expectedPhrase);
    await drawOnCanvas(page);
    await page.getByRole('button', { name: 'Done' }).click();
  }

  // Round 3: describe the previous player's drawing
  for (let i = 0; i < N; i++) {
    const page = playerPages[i];
    await expect(page.locator('#round-indicator')).toHaveText('Round 3 of 3');
    await expect(page.locator('#instructions')).toHaveText('Describe this drawing:');
    const drawingImg = page.locator('#drawing-to-describe');
    await expect(drawingImg).toBeVisible();
    await expect(drawingImg).toHaveAttribute('alt', 'Previous drawing');
    await expect(drawingImg).toHaveAttribute('src', /^data:image/);
    await page.getByPlaceholder('e.g., A cat wearing a superhero cape').fill(`description ${i}`);
    await page.getByRole('button', { name: 'Done' }).click();
  }

  await expect(adminPage.getByRole('link', { name: 'View the archive' })).toBeVisible();
});

test('4 players play 3 rounds (even count rule: totalRounds = players - 1)', async ({ startedGame }) => {
  const { playerPages } = await startedGame(4);
  for (const page of playerPages) {
    await expect(page.locator('#round-indicator')).toHaveText('Round 1 of 3');
  }
});

test('admin sees ✓/✗ per player as they submit during a round', async ({ startedGame }) => {
  const { adminPage, playerPages, playerNames } = await startedGame(3);

  for (const name of playerNames) {
    await expect(adminPage.getByText(`✗ ${name}`)).toBeVisible();
  }

  await playerPages[0].getByPlaceholder('e.g., A cat wearing a superhero cape').fill('Sun over water');
  await playerPages[0].getByRole('button', { name: 'Done' }).click();
  await expect(adminPage.getByText(`✓ ${playerNames[0]}`)).toBeVisible();
  await expect(adminPage.getByText(`✗ ${playerNames[1]}`)).toBeVisible();
  await expect(adminPage.getByText(`✗ ${playerNames[2]}`)).toBeVisible();

  await playerPages[2].getByPlaceholder('e.g., A cat wearing a superhero cape').fill('A flying pig');
  await playerPages[2].getByRole('button', { name: 'Done' }).click();
  await expect(adminPage.getByText(`✓ ${playerNames[0]}`)).toBeVisible();
  await expect(adminPage.getByText(`✗ ${playerNames[1]}`)).toBeVisible();
  await expect(adminPage.getByText(`✓ ${playerNames[2]}`)).toBeVisible();
});

test('please-wait screen shows live "X of N" counter and audio toggle', async ({ startedGame }) => {
  const { playerPages } = await startedGame(3);

  await playerPages[0].getByPlaceholder('e.g., A cat wearing a superhero cape').fill('Sun over water');
  await playerPages[0].getByRole('button', { name: 'Done' }).click();

  await expect(playerPages[0].locator('#instructions')).toHaveText(
    'Please wait for other players to finish this round...'
  );
  await expect(playerPages[0].getByText('1 of 3 are done.')).toBeVisible();
  await expect(playerPages[0].getByText('Play sound when next round starts')).toBeVisible();

  await playerPages[1].getByPlaceholder('e.g., A cat wearing a superhero cape').fill('A flying pig');
  await playerPages[1].getByRole('button', { name: 'Done' }).click();
  await expect(playerPages[0].getByText('2 of 3 are done.')).toBeVisible();
});
