import { test, PUZZLE_TEMPLATE } from './fixtures';
import { expect } from '@playwright/test';

test('Crosswords creation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Create new crossword' }).click();
  await expect(page).toHaveURL('/create');

  await page.getByRole('textbox').fill(PUZZLE_TEMPLATE);
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page).toHaveURL(/\/crossword\/(.+)$/);
  await expect(page.getByRole('grid')).toBeVisible();
});

test('Crosswords real-time sync', async ({ browser, page, crosswordId }) => {
  const playerTwo = await browser.newContext();
  const secondPage = await playerTwo.newPage();
  await secondPage.goto(`/crossword/${crosswordId}`);
  await expect(page.getByRole('grid')).toBeVisible();
  await expect(secondPage.getByRole('grid')).toBeVisible();

  await page.getByTestId('cell-1-1').click();
  await page.keyboard.press('A');
  await expect(page.getByTestId('cell-1-1').getByTestId('solution')).toHaveText('A');
  await expect(secondPage.getByTestId('cell-1-1').getByTestId('solution')).toHaveText('A');

  // Test that lowercase input gets uppercased.
  await page.keyboard.press('b');
  await expect(page.getByTestId('cell-1-2').getByTestId('solution')).toHaveText('B');
  await expect(secondPage.getByTestId('cell-1-2').getByTestId('solution')).toHaveText('B');
});

test.describe('Creation validation', () => {
  test('Rejects empty grids', async ({ page }) => {
    await page.goto('/create');
    await expect(page.getByRole('button', { name: 'Done' })).toBeDisabled();
    await expect(page.getByTestId('empty-grid').getByTestId('icon')).toHaveText('❌');
    await expect(page.getByTestId('empty-grid').getByTestId('message')).toHaveText('Grid is empty');
  });

  test('Rejects grids where no fillable cells exist', async ({ page }) => {
    await page.goto('/create');
    await page.getByRole('textbox').fill('xx\nxx');
    await expect(page.getByRole('button', { name: 'Done' })).toBeDisabled();
    await expect(page.getByTestId('no-clues').getByTestId('icon')).toHaveText('❌');
    await expect(page.getByTestId('no-clues').getByTestId('message')).toHaveText('No clues found');
  });

  test('Rejects grids where no two-cell words exist', async ({ page }) => {
    await page.goto('/create');
    await page.getByRole('textbox').fill('x.\n.x');
    await expect(page.getByRole('button', { name: 'Done' })).toBeDisabled();
    await expect(page.getByTestId('no-clues').getByTestId('icon')).toHaveText('❌');
    await expect(page.getByTestId('no-clues').getByTestId('message')).toHaveText('No clues found');
  });

  test('Warns about non-rotational symmetry', async ({ page }) => {
    await page.goto('/create');
    await page.getByRole('textbox').fill('xx.\nxx.\nxxx');
    await expect(page.getByRole('button', { name: 'Done' })).toBeEnabled();
    await expect(page.getByTestId('symmetric').getByTestId('icon')).toHaveText('⚠️');
    await expect(page.getByTestId('symmetric').getByTestId('message')).toHaveText('Not rotationally symmetric');
  });

  // TODO: Bug in the `isConnected` check in `Crossword.tsx`. Fix the bug, then unskip this test.
  test.skip('Warns about disconnected components', async ({ page }) => {
    await page.goto('/create');
    await page.getByRole('textbox').fill('xx.\n.xx');
    await expect(page.getByRole('button', { name: 'Done' })).toBeEnabled();
    await expect(page.getByTestId('connected').getByTestId('icon')).toHaveText('⚠️');
    await expect(page.getByTestId('connected').getByTestId('message')).toHaveText('White cells form multiple disconnected regions');
  });

  test('All good conditions', async ({ page }) => {
    await page.goto('/create');
    await page.getByRole('textbox').fill('x.x\n...\nx.x');
    await expect(page.getByRole('button', { name: 'Done' })).toBeEnabled();
    await expect(page.getByTestId('empty-grid').getByTestId('icon')).toHaveText('✓');
    await expect(page.getByTestId('empty-grid').getByTestId('message')).toHaveText('Grid is not empty');
    await expect(page.getByTestId('no-clues').getByTestId('icon')).toHaveText('✓');
    await expect(page.getByTestId('no-clues').getByTestId('message')).toHaveText('Clues found');
    await expect(page.getByTestId('symmetric').getByTestId('icon')).toHaveText('✓');
    await expect(page.getByTestId('symmetric').getByTestId('message')).toHaveText('Rotationally symmetric');
    await expect(page.getByTestId('connected').getByTestId('icon')).toHaveText('✓');
    await expect(page.getByTestId('connected').getByTestId('message')).toHaveText('White cells form a single connected region');
  });
});

test.describe('Basic keyboard interactions', () => {
  test('Arrow keys move selection', async ({ page, crosswordId: _ }) => {
    await page.getByTestId('cell-1-1').click();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('cell-1-2')).toHaveClass(/active/);
    await page.keyboard.press('ArrowDown');
    await expect(page.getByTestId('cell-5-2')).toHaveClass(/active/);
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByTestId('cell-5-1')).toHaveClass(/active/);
    await page.keyboard.press('ArrowUp');
    await expect(page.getByTestId('cell-4-1')).toHaveClass(/active/);
  });

  test.describe('Horizontal clue typing', () => {
    test('Typing a letter moves right', async ({ page, crosswordId: _ }) => {
      await page.getByTestId('cell-1-1').click();
      await page.keyboard.press('A');
      await expect(page.getByTestId('cell-1-1').getByTestId('solution')).toHaveText('A');
      await expect(page.getByTestId('cell-1-2')).toHaveClass(/active/);
    });

    test('Backspacing removes letter', async ({ page, crosswordId: _ }) => {
      await page.getByTestId('cell-1-1').click();
      await page.keyboard.press('A');
      await page.keyboard.press('B');
      await expect(page.getByTestId('cell-1-1').getByTestId('solution')).toHaveText('A');
      await expect(page.getByTestId('cell-1-2').getByTestId('solution')).toHaveText('B');
      await expect(page.getByTestId('cell-1-3')).toHaveClass(/active/);
      await page.keyboard.press('Backspace');
      await expect(page.getByTestId('cell-1-2')).toHaveClass(/active/);
      await page.keyboard.press('Backspace');
      await expect(page.getByTestId('cell-1-2').getByTestId('solution')).toHaveText('');
      await expect(page.getByTestId('cell-1-1')).toHaveClass(/active/);
    });
  });

  test.describe('Vertical clue typing', () => {
    test('Typing a letter moves down', async ({ page, crosswordId: _ }) => {
      await page.getByTestId('cell-1-1').click();
      await page.getByTestId('cell-1-1').click();  // Second click to switch to vertical clue.
      await page.keyboard.press('A');
      await expect(page.getByTestId('cell-1-1').getByTestId('solution')).toHaveText('A');
      await expect(page.getByTestId('cell-2-1')).toHaveClass(/active/);
    });

    test('Backspacing removes letter', async ({ page, crosswordId: _ }) => {
      await page.getByTestId('cell-1-1').click();
      await page.getByTestId('cell-1-1').click(); // Second click to switch to vertical clue.
      await page.keyboard.press('A');
      await page.keyboard.press('B');
      await expect(page.getByTestId('cell-1-1').getByTestId('solution')).toHaveText('A');
      await expect(page.getByTestId('cell-2-1').getByTestId('solution')).toHaveText('B');
      await expect(page.getByTestId('cell-3-1')).toHaveClass(/active/);
      await page.keyboard.press('Backspace');
      await expect(page.getByTestId('cell-2-1')).toHaveClass(/active/);
      await page.keyboard.press('Backspace');
      await expect(page.getByTestId('cell-2-1').getByTestId('solution')).toHaveText('');
      await expect(page.getByTestId('cell-1-1')).toHaveClass(/active/);
    });
  });
});

test.describe('Toggles', () => {
  test('Skip filled cells off', async ({ page, crosswordId: _ }) => {
    await expect(page.getByRole('switch', { name: 'Skip filled cells' })).not.toBeChecked();
    await page.getByTestId('cell-1-1').click();
    await page.keyboard.press('A');
    await page.keyboard.press('B');
    await page.getByTestId('cell-1-4').click();
    await page.keyboard.press('D');
    await page.getByTestId('cell-1-3').click();
    await page.keyboard.press('C');
    await expect(page.getByTestId('cell-1-4')).toHaveClass(/active/);
  });

  test('Skip filled cells on', async ({ page, crosswordId: _ }) => {
    // Click the label instead of the switch itself since the switch is hidden.
    await page.getByText('Skip filled cells').click({ force: true });
    await expect(page.getByRole('switch', { name: 'Skip filled cells' })).toBeChecked();
    await page.getByTestId('cell-1-1').click();
    await page.keyboard.press('A');
    await page.keyboard.press('B');
    await page.getByTestId('cell-1-4').click();
    await page.keyboard.press('D');
    await page.getByTestId('cell-1-3').click();
    await page.keyboard.press('C');
    await expect(page.getByTestId('cell-1-5')).toHaveClass(/active/);
  });

  test('Skip finished clues off', async ({ page, crosswordId: _ }) => {
    await expect(page.getByRole('switch', { name: 'Skip finished clues' })).not.toBeChecked();
    await page.getByTestId('cell-1-1').click();
    await page.keyboard.press('A');
    await page.keyboard.press('B');
    await page.keyboard.press('C');
    await page.keyboard.press('D');
    await page.keyboard.press('E');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('cell-1-1')).toHaveClass(/active/);
  });

  test('Skip finished clues on', async ({ page, crosswordId: _ }) => {
    // Click the label instead of the switch itself since the switch is hidden.
    await page.getByText('Skip finished clues').click({ force: true });
    await expect(page.getByRole('switch', { name: 'Skip finished clues' })).toBeChecked();
    await page.getByTestId('cell-1-1').click();
    await page.keyboard.press('A');
    await page.keyboard.press('B');
    await page.keyboard.press('C');
    await page.keyboard.press('D');
    await page.keyboard.press('E');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('cell-5-1')).toHaveClass(/active/);
  });

  test('Space toggles word boundary across', async ({ page, crosswordId: _ }) => {
    await page.getByTestId('cell-1-2').click();
    await page.keyboard.press(' ');
    await expect(page.getByTestId('cell-1-2')).toHaveClass(/word-boundary-across/);
  });

  test('Space toggles word boundary down', async ({ page, crosswordId: _ }) => {
    await page.getByTestId('cell-2-1').click();
    await page.keyboard.press(' ');
    await expect(page.getByTestId('cell-2-1')).toHaveClass(/word-boundary-down/);
  });
});