import { expect, Page } from '@playwright/test';
import { test, drawOnCanvas } from './fixtures';

async function completeThreePlayerGame(
  playerPages: Page[],
  phrases: string[],
  descriptions: string[],
) {
  for (const [i, page] of playerPages.entries()) {
    await page.getByPlaceholder('e.g., A cat wearing a superhero cape').fill(phrases[i]);
    await page.getByRole('button', { name: 'Done' }).click();
  }
  for (const page of playerPages) {
    await expect(page.locator('#instructions')).toHaveText('Draw this phrase:');
    await drawOnCanvas(page);
    await page.getByRole('button', { name: 'Done' }).click();
  }
  for (const [i, page] of playerPages.entries()) {
    await expect(page.locator('#instructions')).toHaveText('Describe this drawing:');
    await page.getByPlaceholder('e.g., A cat wearing a superhero cape').fill(descriptions[i]);
    await page.getByRole('button', { name: 'Done' }).click();
  }
}

test('archive content: one slide of each SlideType', async ({ startedGame }) => {
  const { adminPage, playerPages, playerNames } = await startedGame(3);
  const [alice, bob, charlie] = playerNames;
  const phrases = ['phrase A', 'phrase B', 'phrase C'];
  const descriptions = ['desc 0', 'desc 1', 'desc 2'];

  await completeThreePlayerGame(playerPages, phrases, descriptions);

  await adminPage.getByRole('link', { name: 'View the archive' }).click();
  await expect(adminPage).toHaveURL(/\/archive$/);

  // Slide 0: Chain 1 title (Fullscreen)
  await expect(adminPage.getByText(/Chain 1/)).toBeInViewport();

  // Slide 1: Alice wrote phrase A (FirstText)
  await adminPage.keyboard.press('ArrowDown');
  const aliceWroteSlide = adminPage.locator('.slide')
    .filter({ hasText: `${alice} wrote:` })
    .filter({ hasText: phrases[0] });
  await expect(aliceWroteSlide).toBeInViewport();

  // Slide 2: Bob drew (Drawing)
  await adminPage.keyboard.press('ArrowDown');
  const bobDrewSlide = adminPage.locator('.slide').filter({ hasText: `${bob} drew:` });
  await expect(bobDrewSlide).toBeInViewport();
  await expect(bobDrewSlide.locator(`img[alt*="drawing by ${bob}"]`)).toBeVisible();

  // Slide 3: Charlie wrote desc 2 (LastText)
  await adminPage.keyboard.press('ArrowDown');
  const charlieWroteSlide = adminPage.locator('.slide')
    .filter({ hasText: `${charlie} wrote:` })
    .filter({ hasText: descriptions[2] });
  await expect(charlieWroteSlide).toBeInViewport();

  // Slide 4: end-of-chain "Started with Alice / Ended with Charlie" (Fullscreen)
  await adminPage.keyboard.press('ArrowDown');
  const endOfChain1 = adminPage.locator('.slide')
    .filter({ hasText: `Started with ${alice}:` })
    .filter({ hasText: `Ended with ${charlie}:` });
  await expect(endOfChain1).toBeInViewport();

  // Skip to "The end". 3 chains × 5 slides + 1 = 16 (indices 0..15). At slide 4 → press 11 more times.
  for (let i = 0; i < 11; i++) await adminPage.keyboard.press('ArrowDown');
  await expect(adminPage.getByText(/The end/)).toBeInViewport();
});

test('keyboard navigation: ArrowDown, ArrowUp, Space, Shift+Space', async ({ startedGame }) => {
  const { adminPage, playerPages } = await startedGame(3);
  await completeThreePlayerGame(playerPages, ['p1', 'p2', 'p3'], ['d1', 'd2', 'd3']);
  await adminPage.getByRole('link', { name: 'View the archive' }).click();

  // Chain N title is at slide N × 5.
  await expect(adminPage.getByText(/Chain 1/)).toBeInViewport();

  for (let i = 0; i < 5; i++) await adminPage.keyboard.press('ArrowDown');
  await expect(adminPage.getByText(/Chain 2/)).toBeInViewport();

  for (let i = 0; i < 5; i++) await adminPage.keyboard.press('ArrowUp');
  await expect(adminPage.getByText(/Chain 1/)).toBeInViewport();

  for (let i = 0; i < 10; i++) await adminPage.keyboard.press('Space');
  await expect(adminPage.getByText(/Chain 3/)).toBeInViewport();

  for (let i = 0; i < 5; i++) await adminPage.keyboard.press('Shift+Space');
  await expect(adminPage.getByText(/Chain 2/)).toBeInViewport();
});

test('click navigation: controls work; prev hidden at start, next hidden at end', async ({ startedGame }) => {
  const { adminPage, playerPages } = await startedGame(3);
  await completeThreePlayerGame(playerPages, ['p1', 'p2', 'p3'], ['d1', 'd2', 'd3']);
  await adminPage.getByRole('link', { name: 'View the archive' }).click();

  const prev = adminPage.locator('#previous-slide');
  const next = adminPage.locator('#next-slide');

  // Start: prev hidden (visibility: hidden), next visible
  await expect(prev).not.toBeVisible();
  await expect(next).toBeVisible();

  await next.click();
  await expect(prev).toBeVisible();
  await expect(next).toBeVisible();

  await prev.click();
  await expect(prev).not.toBeVisible();

  // 16 slides total (indices 0..15). At slide 0; click 15 times to reach end.
  for (let i = 0; i < 15; i++) await next.click();
  await expect(adminPage.getByText(/The end/)).toBeInViewport();
  await expect(next).not.toBeVisible();
  await expect(prev).toBeVisible();
});

test('deep link: /archive/:chain/:picture lands directly on that picture', async ({ startedGame }) => {
  const { adminPage, gameId, playerPages, playerNames } = await startedGame(3);
  const [, , charlie] = playerNames;
  await completeThreePlayerGame(playerPages, ['p1', 'p2', 'p3'], ['d1', 'd2', 'd3']);

  // Chain 2, picture 2 is round index 1 (a drawing) by player (1 + 1) % 3 = Charlie.
  await adminPage.goto(`/game/${gameId}/archive/2/2`);

  const charlieDrewSlide = adminPage.locator('.slide').filter({ hasText: `${charlie} drew:` });
  await expect(charlieDrewSlide).toBeInViewport();
  await expect(charlieDrewSlide.locator(`img[alt*="drawing by ${charlie}"]`)).toBeVisible();

  // And a chain title is reachable on its own.
  await adminPage.goto(`/game/${gameId}/archive/3`);
  await expect(adminPage.getByText(/Chain 3/)).toBeInViewport();
});

test('the URL follows the current slide', async ({ startedGame }) => {
  const { adminPage, gameId, playerPages } = await startedGame(3);
  await completeThreePlayerGame(playerPages, ['p1', 'p2', 'p3'], ['d1', 'd2', 'd3']);
  await adminPage.getByRole('link', { name: 'View the archive' }).click();

  // Chain 1: title, three pictures, then the summary; then chain 2's title.
  for (const path of ['1/1', '1/2', '1/3', '1/summary', '2']) {
    await adminPage.keyboard.press('ArrowDown');
    await expect(adminPage).toHaveURL(new RegExp(`/game/${gameId}/archive/${path}$`));
  }

  await adminPage.keyboard.press('ArrowUp');
  await expect(adminPage).toHaveURL(new RegExp(`/game/${gameId}/archive/1/summary$`));

  // Back leaves the archive rather than stepping through slides.
  await adminPage.goBack();
  await expect(adminPage).toHaveURL(new RegExp(`/game/${gameId}/admin$`));
});

test('an address that names no slide redirects to the start of the archive', async ({ startedGame }) => {
  const { adminPage, gameId, playerPages } = await startedGame(3);
  await completeThreePlayerGame(playerPages, ['p1', 'p2', 'p3'], ['d1', 'd2', 'd3']);

  for (const path of ['99', 'nonsense', '2/99']) {
    await adminPage.goto(`/game/${gameId}/archive/${path}`);
    await expect(adminPage).toHaveURL(new RegExp(`/game/${gameId}/archive$`));
    await expect(adminPage.getByText(/Chain 1/)).toBeInViewport();
  }
});
