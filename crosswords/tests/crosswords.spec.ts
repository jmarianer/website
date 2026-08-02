import { test, PUZZLE_TEMPLATE, openCrossword } from './fixtures';
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

test('Crosswords real-time sync', async ({ browser, crossword }) => {
  const secondCrossword = await openCrossword(browser, crossword.id);
  await expect(secondCrossword.page.getByRole('grid')).toBeVisible();

  await crossword.cell(1, 1).click();
  await crossword.press('A');
  await expect(crossword.cell(1, 1).getByTestId('solution')).toHaveText('A');
  await expect(secondCrossword.cell(1, 1).getByTestId('solution')).toHaveText('A');

  // Test that lowercase input gets uppercased.
  await crossword.press('b');
  await expect(crossword.cell(1, 2).getByTestId('solution')).toHaveText('B');
  await expect(secondCrossword.cell(1, 2).getByTestId('solution')).toHaveText('B');

  // Test that changes made in the second window also sync back to the first window.
  await secondCrossword.cell(5, 1).click();
  await secondCrossword.press('c');
  await expect(secondCrossword.cell(5, 1).getByTestId('solution')).toHaveText('C');
  await expect(crossword.cell(5, 1).getByTestId('solution')).toHaveText('C');
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

  test('Two different warnings', async ({ page }) => {
    await page.goto('/create');
    await page.getByRole('textbox').fill('xx.\n.xx');
    await expect(page.getByRole('button', { name: 'Done' })).toBeDisabled();
        await expect(page.getByTestId('no-clues').getByTestId('icon')).toHaveText('❌');
    await expect(page.getByTestId('no-clues').getByTestId('message')).toHaveText('No clues found');
    await expect(page.getByTestId('connected').getByTestId('icon')).toHaveText('⚠️');
    await expect(page.getByTestId('connected').getByTestId('message')).toHaveText('White cells form multiple disconnected regions');
  });

  test('Warns about disconnected components', async ({ page }) => {
    await page.goto("/create");
    await page.getByRole('textbox').fill('..\nxx\n..');
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

// `active` on its own -- /active/ would also match `active-word`.
const ACTIVE = /(?:^|\s)active(?:\s|$)/;

test.describe('Presence', () => {
  test("Another solver's cursor shows as a ring, and ours does not", async ({ browser, crossword }) => {
    const second = await openCrossword(browser, crossword.id);

    await crossword.cell(1, 1).click();
    await second.cell(1, 3).click();

    await expect(crossword.cell(1, 3)).toHaveCSS('box-shadow', /inset/);
    // Our own position is already shown by .active, so it gets no ring.
    await expect(crossword.cell(1, 1)).toHaveCSS('box-shadow', 'none');
  });

  test('Changing colour recolours the ring others see, on the first click', async ({ browser, crossword }) => {
    const crimson = /rgb\(161, 29, 46\)/;   // #a11d2e
    const violet = /rgb\(91, 45, 142\)/;    // #5b2d8e
    const second = await openCrossword(browser, crossword.id);

    // Establish a known colour rather than relying on the random initial one,
    // so a stale publish cannot pass by coincidence.
    await second.page.getByTestId('color-crimson').click();
    await second.cell(1, 3).click();
    await expect(crossword.cell(1, 3)).toHaveCSS('box-shadow', crimson);

    // One click, not two: publishing must use the colour just chosen rather
    // than whatever React state still holds.
    await second.page.getByTestId('color-violet').click();
    await expect(crossword.cell(1, 3)).toHaveCSS('box-shadow', violet);
  });

  test('Together mode moves everyone to the same cell', async ({ browser, crossword }) => {
    const second = await openCrossword(browser, crossword.id);
    // Click the label rather than the switch, which is visually hidden.
    await crossword.page.getByText('Together mode').click({ force: true });

    await crossword.cell(1, 1).click();
    await expect(second.cell(1, 1)).toHaveClass(ACTIVE);
    // No ring: everyone is on the cell already, so .active says it.
    await expect(second.cell(1, 1)).toHaveCSS('box-shadow', 'none');

    // And it is genuinely shared, not one-way.
    await second.cell(1, 3).click();
    await expect(crossword.cell(1, 3)).toHaveClass(ACTIVE);
  });

  test('Leaving Together mode lets cursors move independently again', async ({ browser, crossword }) => {
    const second = await openCrossword(browser, crossword.id);
    const toggle = crossword.page.getByText('Together mode');

    await toggle.click({ force: true });
    await crossword.cell(1, 1).click();
    await expect(second.cell(1, 1)).toHaveClass(ACTIVE);

    await toggle.click({ force: true });
    await second.cell(1, 3).click();
    await expect(second.cell(1, 3)).toHaveClass(ACTIVE);
    await expect(crossword.cell(1, 1)).toHaveClass(ACTIVE);
  });
});

test.describe('Pencil marks', () => {
  test('Pencilled letters use the script face, inked ones do not', async ({ crossword }) => {
    const page = crossword.page;
    await crossword.cell(1, 1).click();
    await crossword.press('A');

    await page.getByText('Pencil', { exact: true }).click({ force: true });
    await crossword.press('B');

    await expect(crossword.cell(1, 2).getByTestId('solution')).toHaveCSS('font-family', /cursive/);
    await expect(crossword.cell(1, 1).getByTestId('solution')).not.toHaveCSS('font-family', /cursive/);
  });

  test('Letters are tinted with their author, and others see it', async ({ browser, crossword }) => {
    const violet = 'rgb(91, 45, 142)';  // #5b2d8e
    const second = await openCrossword(browser, crossword.id);

    await second.page.getByTestId('color-violet').click();
    await second.cell(1, 1).click();
    await second.press('A');

    await expect(crossword.cell(1, 1).getByTestId('solution')).toHaveText('A');
    await expect(crossword.cell(1, 1).getByTestId('solution')).toHaveCSS('color', violet);
  });

  test('Clearing a cell drops its authorship and pencil mark', async ({ crossword }) => {
    const page = crossword.page;
    await page.getByText('Pencil', { exact: true }).click({ force: true });
    await crossword.cell(1, 1).click();
    await crossword.press('A');
    await expect(crossword.cell(1, 1).getByTestId('solution')).toHaveCSS('font-family', /cursive/);

    // Back onto the letter, then delete it.
    await crossword.cell(1, 1).click();
    await crossword.press('Backspace');
    await expect(crossword.cell(1, 1).getByTestId('solution')).not.toHaveCSS('font-family', /cursive/);
  });
});

test.describe('Colour selection', () => {
  test('Picking a colour survives a reload', async ({ crossword }) => {
    const page = crossword.page;
    await page.getByTestId('color-violet').click();
    await expect(page.getByTestId('color-violet')).toHaveClass(/selected/);

    await page.reload();
    await expect(page.getByRole('grid')).toBeVisible();
    await expect(page.getByTestId('color-violet')).toHaveClass(/selected/);
  });

  test('Exactly one colour is selected at a time', async ({ crossword }) => {
    const page = crossword.page;
    await page.getByTestId('color-teal').click();
    await expect(page.locator('.swatch.selected')).toHaveCount(1);
    await page.getByTestId('color-crimson').click();
    await expect(page.locator('.swatch.selected')).toHaveCount(1);
    await expect(page.getByTestId('color-crimson')).toHaveClass(/selected/);
  });
});

test.describe('Basic keyboard interactions', () => {
  test('Arrow keys move selection', async ({ crossword }) => {
    await crossword.cell(1, 1).click();
    await crossword.press('ArrowRight');
    await expect(crossword.cell(1, 2)).toHaveClass(/active/);
    await crossword.press('ArrowDown');
    await expect(crossword.cell(5, 2)).toHaveClass(/active/);
    await crossword.press('ArrowLeft');
    await expect(crossword.cell(5, 1)).toHaveClass(/active/);
    await crossword.press('ArrowUp');
    await expect(crossword.cell(4, 1)).toHaveClass(/active/);
  });

  test.describe('Horizontal clue typing', () => {
    test('Typing a letter moves right', async ({ crossword }) => {
      await crossword.cell(1, 1).click();
      await crossword.press('A');
      await expect(crossword.cell(1, 1).getByTestId('solution')).toHaveText('A');
      await expect(crossword.cell(1, 2)).toHaveClass(/active/);
    });

    test('Backspacing removes letter', async ({ crossword }) => {
      await crossword.cell(1, 1).click();
      await crossword.press('A', 'B');
      await expect(crossword.cell(1, 1).getByTestId('solution')).toHaveText('A');
      await expect(crossword.cell(1, 2).getByTestId('solution')).toHaveText('B');
      await expect(crossword.cell(1, 3)).toHaveClass(/active/);
      await crossword.press('Backspace');
      await expect(crossword.cell(1, 2)).toHaveClass(/active/);
      await crossword.press('Backspace');
      await expect(crossword.cell(1, 2).getByTestId('solution')).toHaveText('');
      await expect(crossword.cell(1, 1)).toHaveClass(/active/);
    });
  });

  test.describe('Vertical clue typing', () => {
    test('Typing a letter moves down', async ({ crossword }) => {
      await crossword.cell(1, 1).click();
      await crossword.cell(1, 1).click();  // Second click to switch to vertical clue.
      await crossword.press('A');
      await expect(crossword.cell(1, 1).getByTestId('solution')).toHaveText('A');
      await expect(crossword.cell(2, 1)).toHaveClass(/active/);
    });

    test('Backspacing removes letter', async ({ crossword }) => {
      await crossword.cell(1, 1).click();
      await crossword.cell(1, 1).click(); // Second click to switch to vertical clue.
      await crossword.press('A', 'B');
      await expect(crossword.cell(1, 1).getByTestId('solution')).toHaveText('A');
      await expect(crossword.cell(2, 1).getByTestId('solution')).toHaveText('B');
      await expect(crossword.cell(3, 1)).toHaveClass(/active/);
      await crossword.press('Backspace');
      await expect(crossword.cell(2, 1)).toHaveClass(/active/);
      await crossword.press('Backspace');
      await expect(crossword.cell(2, 1).getByTestId('solution')).toHaveText('');
      await expect(crossword.cell(1, 1)).toHaveClass(/active/);
    });
  });
});

test.describe('Toggles', () => {
  test('Skip filled cells off', async ({ page, crossword }) => {
    await expect(page.getByRole('switch', { name: 'Skip filled cells' })).not.toBeChecked();
    await crossword.cell(1, 1).click();
    await crossword.press('A', 'B');
    await crossword.cell(1, 4).click();
    await crossword.press('D');
    await crossword.cell(1, 3).click();
    await crossword.press('C');
    await expect(crossword.cell(1, 4)).toHaveClass(/active/);
  });

  test('Skip filled cells on', async ({ page, crossword }) => {
    // Click the label instead of the switch itself since the switch is hidden.
    await page.getByText('Skip filled cells').click({ force: true });
    await expect(page.getByRole('switch', { name: 'Skip filled cells' })).toBeChecked();
    await crossword.cell(1, 1).click();
    await crossword.press('A', 'B');
    await crossword.cell(1, 4).click();
    await crossword.press('D');
    await crossword.cell(1, 3).click();
    await crossword.press('C');
    await expect(crossword.cell(1, 5)).toHaveClass(/active/);
  });

  test('Skip finished clues off', async ({ page, crossword }) => {
    await expect(page.getByRole('switch', { name: 'Skip finished clues' })).not.toBeChecked();
    await crossword.cell(1, 1).click();
    await crossword.press('A', 'B', 'C', 'D', 'E', 'Tab', 'Tab', 'Tab');
    await expect(crossword.cell(1, 1)).toHaveClass(/active/);
  });

  test('Skip finished clues on', async ({ page, crossword }) => {
    // Click the label instead of the switch itself since the switch is hidden.
    await page.getByText('Skip finished clues').click({ force: true });
    await expect(page.getByRole('switch', { name: 'Skip finished clues' })).toBeChecked();
    await crossword.cell(1, 1).click();
    await crossword.press('A', 'B', 'C', 'D', 'E', 'Tab', 'Tab', 'Tab');
    await expect(crossword.cell(5, 1)).toHaveClass(/active/);
  });

  test('Space toggles word boundary across', async ({ crossword }) => {
    await crossword.cell(1, 2).click();
    await crossword.press(' ');
    await expect(crossword.cell(1, 2)).toHaveClass(/word-boundary-across/);
  });

  test('Space toggles word boundary down', async ({ crossword }) => {
    await crossword.cell(2, 1).click();
    await crossword.press(' ');
    await expect(crossword.cell(2, 1)).toHaveClass(/word-boundary-down/);
  });
});