import { expect, Page } from '@playwright/test';
import { test, drawOnCanvas } from './fixtures';

async function advanceToDrawingRound(playerPages: Page[]) {
  for (const page of playerPages) {
    await page.getByPlaceholder('e.g., A cat wearing a superhero cape').fill('a phrase');
    await page.getByRole('button', { name: 'Done' }).click();
  }
  for (const page of playerPages) {
    await expect(page.locator('#instructions')).toHaveText('Draw this phrase:');
  }
}

test('Done is disabled on a blank canvas and enabled after a stroke', async ({ startedGame }) => {
  const { playerPages } = await startedGame(3);
  await advanceToDrawingRound(playerPages);

  const page = playerPages[0];
  const done = page.getByRole('button', { name: 'Done' });
  await expect(done).toBeDisabled();
  await drawOnCanvas(page);
  await expect(done).toBeEnabled();

  await done.click();
  await expect(page.locator('#instructions')).toHaveText(
    'Please wait for other players to finish this round...'
  );
});

test('clicking a color swatch moves the active class', async ({ startedGame }) => {
  const { playerPages } = await startedGame(3);
  await advanceToDrawingRound(playerPages);

  const colorPicker = playerPages[0].locator('#color-picker');

  // Default selected color is black
  await expect(colorPicker.locator('.swatch-container.black')).toHaveClass(/active/);

  await colorPicker.locator('.swatch-container.red').click();
  await expect(colorPicker.locator('.swatch-container.red')).toHaveClass(/active/);
  await expect(colorPicker.locator('.swatch-container.black')).not.toHaveClass(/active/);
});

test('clicking a thickness swatch moves the active class', async ({ startedGame }) => {
  const { playerPages } = await startedGame(3);
  await advanceToDrawingRound(playerPages);

  const swatches = playerPages[0].locator('#thickness-picker > div.swatch-container');
  await expect(swatches.nth(2)).toHaveClass(/active/);

  await swatches.nth(0).click();
  await expect(swatches.nth(0)).toHaveClass(/active/);
  await expect(swatches.nth(2)).not.toHaveClass(/active/);
});
