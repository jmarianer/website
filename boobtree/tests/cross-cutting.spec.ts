import { expect } from '@playwright/test';
import { test } from './fixtures';

test('reload mid-game preserves player state', async ({ startedGame }) => {
  const { playerPages } = await startedGame(3);
  const N = playerPages.length;
  const phrases = ['phrase A', 'phrase B', 'phrase C'];

  // All players write their phrases; round advances to drawing
  for (let i = 0; i < N; i++) {
    await playerPages[i].getByPlaceholder('e.g., A cat wearing a superhero cape').fill(phrases[i]);
    await playerPages[i].getByRole('button', { name: 'Done' }).click();
  }

  const page = playerPages[0];
  await expect(page.locator('#instructions')).toHaveText('Draw this phrase:');
  // Player 0 in round 2 sees player (0 + N - 1) % N = N-1's phrase
  await expect(page.locator('#phrase-to-draw')).toHaveText(phrases[N - 1]);

  await page.reload();

  // After reload, the realtime subscription re-attaches and the same assignment shows
  await expect(page.locator('#instructions')).toHaveText('Draw this phrase:');
  await expect(page.locator('#phrase-to-draw')).toHaveText(phrases[N - 1]);
});
